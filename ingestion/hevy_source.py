"""Hevy API → dlt → DuckDB ingestion pipeline.

Hevy uses a static API key (requires PRO subscription).
Base URL: https://api.hevyapp.com/v1
"""

import logging

import dlt
import requests

logger = logging.getLogger(__name__)

HEVY_BASE = "https://api.hevyapp.com/v1"
PAGE_SIZE = 10  # Hevy max per page


def _hevy_headers(api_key: str) -> dict:
    return {"api-key": api_key, "Accept": "application/json"}


@dlt.resource(write_disposition="append", primary_key="id")
def hevy_workouts(api_key: str, page: int = 1):
    """Yield pages of Hevy workouts (each workout includes exercises → sets).

    dlt will auto-normalize nested exercises/sets into child tables:
      - raw.hevy_workouts
      - raw.hevy_workouts__exercises
      - raw.hevy_workouts__exercises__sets
    """
    while True:
        resp = requests.get(
            f"{HEVY_BASE}/workouts",
            headers=_hevy_headers(api_key),
            params={"page": page, "pageSize": PAGE_SIZE},
            timeout=30,
        )
        if resp.status_code == 404:
            break
        resp.raise_for_status()
        workouts = resp.json().get("workouts", [])
        if not workouts:
            break
        yield workouts
        page += 1


@dlt.resource(write_disposition="merge", primary_key="id")
def hevy_exercise_templates(api_key: str, page: int = 1):
    """Fetch exercise template catalog (names, muscle groups)."""
    while True:
        resp = requests.get(
            f"{HEVY_BASE}/exercise_templates",
            headers=_hevy_headers(api_key),
            params={"page": page, "pageSize": PAGE_SIZE},
            timeout=30,
        )
        if resp.status_code == 404:
            break
        resp.raise_for_status()
        templates = resp.json().get("exercise_templates", [])
        if not templates:
            break
        yield templates
        page += 1


@dlt.resource(write_disposition="merge", primary_key="id")
def hevy_routines(api_key: str, page: int = 1):
    """Fetch planned routines for planned-vs-actual comparison."""
    while True:
        resp = requests.get(
            f"{HEVY_BASE}/routines",
            headers=_hevy_headers(api_key),
            params={"page": page, "pageSize": PAGE_SIZE},
            timeout=30,
        )
        if resp.status_code == 404:
            break  # endpoint may not exist or no more pages
        resp.raise_for_status()
        routines = resp.json().get("routines", [])
        if not routines:
            break
        yield routines
        page += 1


def get_workout_count(api_key: str) -> int:
    """Return total workout count for sync progress tracking."""
    resp = requests.get(
        f"{HEVY_BASE}/workout_count",
        headers=_hevy_headers(api_key),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("workout_count", 0)


@dlt.source(name="hevy")
def hevy_source(api_key: str):
    """Top-level dlt source combining all Hevy resources."""
    return [
        hevy_workouts(api_key),
        hevy_exercise_templates(api_key),
        hevy_routines(api_key),
    ]


def run_hevy_pipeline(api_key: str, duckdb_path: str = "fitness.duckdb"):
    """Convenience function to run the full Hevy ingestion."""
    pipeline = dlt.pipeline(
        pipeline_name="hevy",
        destination=dlt.destinations.duckdb(duckdb_path),
        dataset_name="raw",
    )
    load_info = pipeline.run(hevy_source(api_key=api_key))
    logger.info("Hevy load complete: %s", load_info)
    return load_info
