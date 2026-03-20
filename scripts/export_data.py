"""Export mart data from DuckDB to JSON files for the mobile app.

Run from project root:
    python scripts/export_data.py
"""

import json
import os
from datetime import date, datetime
from pathlib import Path

import duckdb

DUCKDB_PATH = os.getenv("DUCKDB_PATH", "fitness.duckdb")
OUTPUT_DIR = Path("mobile-app/public/data")


def serialize(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def export_query(con: duckdb.DuckDBPyConnection, name: str, sql: str):
    result = con.sql(sql)
    cols = [desc[0] for desc in result.description]
    rows = result.fetchall()
    data = [dict(zip(cols, row)) for row in rows]
    path = OUTPUT_DIR / f"{name}.json"
    path.write_text(json.dumps(data, default=serialize, indent=None), encoding="utf-8")
    print(f"  {name}: {len(data)} rows → {path}")


def export_workout_details(con: duckdb.DuckDBPyConnection):
    details: list[dict] = []

    cardio_result = con.sql("""
        SELECT
            activity_id::VARCHAR AS source_id,
            activity_date,
            activity_name,
            sport_type AS activity_type,
            distance_km,
            duration_minutes,
            moving_minutes,
            avg_hr,
            max_hr,
            elevation_gain_m,
            pace_min_per_km,
            speed_kmh,
            hr_per_kmh,
            elevation_per_km
        FROM intermediate.int_cardio_efficiency
        ORDER BY activity_date DESC
    """)
    cardio_cols = [desc[0] for desc in cardio_result.description]
    for row in cardio_result.fetchall():
        item = dict(zip(cardio_cols, row))
        details.append({
            "source": "strava",
            "detail_type": "cardio",
            **item,
        })

    workout_result = con.sql("""
        SELECT
            CAST(id AS VARCHAR) AS source_id,
            title AS activity_name,
            CAST(start_time AS TIMESTAMP) AS workout_started_at,
            CAST(end_time AS TIMESTAMP) AS workout_ended_at
        FROM raw.hevy_workouts
    """)
    workout_cols = [desc[0] for desc in workout_result.description]
    workout_rows = {
        row[0]: dict(zip(workout_cols, row))
        for row in workout_result.fetchall()
    }

    exercise_result = con.sql("""
        SELECT
            workout_id::VARCHAR AS source_id,
            workout_started_at::DATE AS activity_date,
            exercise_name,
            exercise_index + 1 AS exercise_index,
            set_index + 1 AS set_index,
            set_type,
            weight_kg,
            reps,
            rpe,
            duration_seconds,
            COALESCE(weight_kg, 0) * COALESCE(reps, 0) AS volume_kg
        FROM staging.stg_hevy_sets
        ORDER BY 1, 4, 5
    """)
    exercise_cols = [desc[0] for desc in exercise_result.description]
    grouped_strength: dict[str, dict] = {}

    for row in exercise_result.fetchall():
        item = dict(zip(exercise_cols, row))
        source_id = item["source_id"]
        workout_meta = workout_rows.get(source_id, {})
        detail = grouped_strength.setdefault(
            source_id,
            {
                "source": "hevy",
                "detail_type": "strength",
                "source_id": source_id,
                "activity_date": item["activity_date"],
                "activity_name": workout_meta.get("activity_name") or "Strength Workout",
                "workout_started_at": workout_meta.get("workout_started_at"),
                "workout_ended_at": workout_meta.get("workout_ended_at"),
                "exercise_count": 0,
                "total_sets": 0,
                "total_reps": 0,
                "total_volume_kg": 0,
                "exercises": [],
            },
        )

        exercises = detail["exercises"]
        if not exercises or exercises[-1]["exercise_index"] != item["exercise_index"]:
            detail["exercise_count"] += 1
            exercises.append({
                "exercise_name": item["exercise_name"],
                "exercise_index": item["exercise_index"],
                "total_sets": 0,
                "total_reps": 0,
                "total_volume_kg": 0,
                "max_weight_used": 0,
                "sets": [],
            })

        exercise = exercises[-1]
        reps = item["reps"] or 0
        weight_kg = item["weight_kg"] or 0
        volume_kg = item["volume_kg"] or 0

        detail["total_sets"] += 1
        detail["total_reps"] += reps
        detail["total_volume_kg"] += volume_kg

        exercise["total_sets"] += 1
        exercise["total_reps"] += reps
        exercise["total_volume_kg"] += volume_kg
        exercise["max_weight_used"] = max(exercise["max_weight_used"], weight_kg)
        exercise["sets"].append({
            "set_index": item["set_index"],
            "set_type": item["set_type"],
            "reps": item["reps"],
            "weight_kg": item["weight_kg"],
            "rpe": item["rpe"],
            "duration_seconds": item["duration_seconds"],
            "volume_kg": volume_kg,
        })

    details.extend(grouped_strength.values())

    path = OUTPUT_DIR / "workout_details.json"
    path.write_text(json.dumps(details, default=serialize, indent=None), encoding="utf-8")
    print(f"  workout_details: {len(details)} rows → {path}")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(DUCKDB_PATH, read_only=True)

    print("Exporting fitness data to JSON…")

    export_query(con, "activity_log", """
        SELECT activity_date, source_id, source, activity_type, activity_name,
               distance_meters, moving_seconds, avg_hr, max_hr,
               load_metric, volume_kg, total_sets
        FROM marts.mart_activity_log
        ORDER BY activity_date DESC
    """)

    export_query(con, "cardio_efficiency", """
        SELECT activity_date, activity_id, activity_name, sport_type,
               distance_km, duration_minutes, moving_minutes,
               avg_hr, max_hr, elevation_gain_m,
               pace_min_per_km, speed_kmh, hr_per_kmh, elevation_per_km
        FROM intermediate.int_cardio_efficiency
        ORDER BY activity_date DESC
    """)

    export_query(con, "strength_progression", """
        SELECT log_date, exercise_name, exercise_template_id,
               estimated_1rm, max_weight_used, total_volume_kg,
               total_sets, avg_rpe
        FROM intermediate.int_strength_progression
        ORDER BY log_date DESC, exercise_name
    """)

    export_workout_details(con)

    con.close()
    print("Done!")


if __name__ == "__main__":
    main()
