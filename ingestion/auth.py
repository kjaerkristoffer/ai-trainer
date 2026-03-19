"""Strava OAuth 2.0 token refresh and DuckDB state helpers."""

import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()


def refresh_strava_token(
    client_id: str | None = None,
    client_secret: str | None = None,
    refresh_token: str | None = None,
) -> str:
    """Exchange a Strava refresh token for a fresh access token.

    Falls back to environment variables when arguments are omitted.
    Returns the new access token string.
    """
    client_id = client_id or os.environ["STRAVA_CLIENT_ID"]
    client_secret = client_secret or os.environ["STRAVA_CLIENT_SECRET"]
    refresh_token = refresh_token or os.environ["STRAVA_REFRESH_TOKEN"]

    resp = requests.post(
        "https://www.strava.com/oauth/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
        timeout=30,
    )
    resp.raise_for_status()
    payload = resp.json()

    # Persist the rotated refresh token so the next run can use it
    new_refresh = payload.get("refresh_token")
    if new_refresh and new_refresh != refresh_token:
        os.environ["STRAVA_REFRESH_TOKEN"] = new_refresh

    return payload["access_token"]


def get_last_sync(source_name: str, duckdb_path: str | None = None) -> int | None:
    """Read the last-synced unix epoch for *source_name* from DuckDB.

    Returns None on first run (table doesn't exist yet).
    """
    import duckdb

    db_path = duckdb_path or os.getenv("DUCKDB_PATH", "fitness.duckdb")
    try:
        con = duckdb.connect(db_path, read_only=True)
        row = con.execute(
            "SELECT last_synced_epoch FROM _pipeline_state WHERE source_name = $1",
            [source_name],
        ).fetchone()
        con.close()
        return row[0] if row else None
    except Exception:
        return None


def set_last_sync(source_name: str, epoch: int | None = None, duckdb_path: str | None = None) -> None:
    """Upsert the last-synced unix epoch for *source_name* into DuckDB."""
    import duckdb

    db_path = duckdb_path or os.getenv("DUCKDB_PATH", "fitness.duckdb")
    epoch = epoch or int(time.time())
    con = duckdb.connect(db_path)
    con.execute("""
        CREATE TABLE IF NOT EXISTS _pipeline_state (
            source_name VARCHAR PRIMARY KEY,
            last_synced_epoch BIGINT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Use a two-step approach to avoid DuckDB binding issues with
    # CURRENT_TIMESTAMP in parameterized INSERT ... ON CONFLICT
    con.execute("DELETE FROM _pipeline_state WHERE source_name = $1", [source_name])
    con.execute(
        "INSERT INTO _pipeline_state (source_name, last_synced_epoch) VALUES ($1, $2)",
        [source_name, epoch],
    )
    con.close()
