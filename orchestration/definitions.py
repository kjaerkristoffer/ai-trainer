"""Dagster definitions for the daily fitness analytics pipeline.

ALTERATION from PRD: Strava and Hevy ingestion run in parallel
(they are independent), then SQLMesh runs after both complete.

    ingest_strava() ──┐
                       ├──→ run_sqlmesh()
    ingest_hevy()  ───┘
"""

import logging
import os
import subprocess

from dagster import (
    AssetExecutionContext,
    Definitions,
    Nothing,
    ScheduleDefinition,
    graph,
    job,
    op,
)
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DUCKDB_PATH = os.getenv("DUCKDB_PATH", "fitness.duckdb")


@op
def ingest_strava(context: AssetExecutionContext) -> Nothing:
    """Refresh Strava token and ingest activities into DuckDB."""
    from ingestion.auth import get_last_sync, refresh_strava_token, set_last_sync
    from ingestion.strava_source import run_strava_pipeline

    context.log.info("Starting Strava ingestion…")
    access_token = refresh_strava_token()
    after = get_last_sync("strava", DUCKDB_PATH)
    context.log.info("Strava incremental sync: after=%s", after)

    run_strava_pipeline(access_token=access_token, after=after, duckdb_path=DUCKDB_PATH)
    set_last_sync("strava", duckdb_path=DUCKDB_PATH)
    context.log.info("Strava ingestion complete.")


@op
def ingest_hevy(context: AssetExecutionContext) -> Nothing:
    """Ingest Hevy workouts, exercise templates, and routines into DuckDB."""
    from ingestion.hevy_source import run_hevy_pipeline

    api_key = os.environ["HEVY_API_KEY"]
    context.log.info("Starting Hevy ingestion…")

    run_hevy_pipeline(api_key=api_key, duckdb_path=DUCKDB_PATH)
    context.log.info("Hevy ingestion complete.")


@op
def run_sqlmesh(context: AssetExecutionContext, strava_done: Nothing, hevy_done: Nothing) -> Nothing:
    """Run SQLMesh transformations (staging → intermediate → mart)."""
    context.log.info("Running SQLMesh transformations…")
    result = subprocess.run(
        ["sqlmesh", "run"],
        capture_output=True,
        text=True,
        check=False,
    )
    context.log.info("SQLMesh stdout:\n%s", result.stdout)
    if result.returncode != 0:
        context.log.error("SQLMesh stderr:\n%s", result.stderr)
        raise RuntimeError(f"sqlmesh run failed with exit code {result.returncode}")
    context.log.info("SQLMesh transformations complete.")


@op
def check_alerts(context: AssetExecutionContext, sqlmesh_done: Nothing) -> Nothing:
    """Check for alert conditions after pipeline run."""
    import duckdb

    con = duckdb.connect(DUCKDB_PATH, read_only=True)

    # Alert: TSB < -30 → overreached
    tsb_row = con.sql("""
        SELECT week_start, training_stress_balance
        FROM marts.mart_weekly_fitness_summary
        ORDER BY week_start DESC
        LIMIT 1
    """).fetchone()

    if tsb_row and tsb_row[1] is not None and tsb_row[1] < -30:
        context.log.warning(
            "⚠️  OVERREACH ALERT: TSB = %.2f for week of %s. Consider a recovery week.",
            tsb_row[1],
            tsb_row[0],
        )

    # Alert: 7-day gap in data → stale sync
    gap_row = con.sql("""
        SELECT MAX(training_date) AS last_date,
               CURRENT_DATE - MAX(training_date) AS days_since
        FROM intermediate.int_training_load
    """).fetchone()

    if gap_row and gap_row[1] is not None and gap_row[1] > 7:
        context.log.warning(
            "⚠️  STALE DATA ALERT: Last training data is from %s (%d days ago).",
            gap_row[0],
            gap_row[1],
        )

    con.close()
    context.log.info("Alert checks complete.")


@graph
def daily_fitness_graph():
    """Graph: parallel ingestion → transform → alerts."""
    strava_result = ingest_strava()
    hevy_result = ingest_hevy()
    sqlmesh_result = run_sqlmesh(strava_done=strava_result, hevy_done=hevy_result)
    check_alerts(sqlmesh_done=sqlmesh_result)


daily_fitness_pipeline = daily_fitness_graph.to_job(name="daily_fitness_pipeline")

# Run every day at 06:00
daily_schedule = ScheduleDefinition(
    job=daily_fitness_pipeline,
    cron_schedule="0 6 * * *",
    name="daily_fitness_schedule",
)

defs = Definitions(
    jobs=[daily_fitness_pipeline],
    schedules=[daily_schedule],
)
