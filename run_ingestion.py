"""Run the full dlt ingestion for both Strava and Hevy into DuckDB."""
import os
import sys
import logging
import traceback

sys.path.insert(0, ".")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("run_ingestion")

from dotenv import load_dotenv
load_dotenv()

DUCKDB_PATH = os.getenv("DUCKDB_PATH", "fitness.duckdb")

# ── Strava ──
def run_strava():
    from ingestion.auth import refresh_strava_token, get_last_sync, set_last_sync
    from ingestion.strava_source import run_strava_pipeline

    logger.info("=== Strava Ingestion ===")
    token = refresh_strava_token()
    after = get_last_sync("strava", DUCKDB_PATH)
    logger.info("Incremental after=%s", after)

    load_info = run_strava_pipeline(access_token=token, after=after, duckdb_path=DUCKDB_PATH)
    set_last_sync("strava", duckdb_path=DUCKDB_PATH)
    logger.info("Strava done: %s", load_info)

# ── Hevy ──
def run_hevy():
    from ingestion.hevy_source import run_hevy_pipeline

    api_key = os.environ.get("HEVY_API_KEY", "")
    if not api_key:
        logger.warning("HEVY_API_KEY not set, skipping Hevy ingestion")
        return

    logger.info("=== Hevy Ingestion ===")
    load_info = run_hevy_pipeline(api_key=api_key, duckdb_path=DUCKDB_PATH)
    logger.info("Hevy done: %s", load_info)

# ── Main ──
if __name__ == "__main__":
    try:
        run_strava()
    except Exception as e:
        logger.error("Strava ingestion failed: %s", e)
        traceback.print_exc()

    try:
        run_hevy()
    except Exception as e:
        logger.error("Hevy ingestion failed: %s", e)
        traceback.print_exc()

    # Show what tables landed
    import duckdb
    con = duckdb.connect(DUCKDB_PATH, read_only=True)
    tables = con.sql("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema') ORDER BY 1, 2").fetchall()
    logger.info("=== Tables in DuckDB ===")
    for schema, table in tables:
        count = con.sql(f"SELECT COUNT(*) FROM {schema}.{table}").fetchone()[0]
        logger.info("  %s.%s: %d rows", schema, table, count)
    con.close()
