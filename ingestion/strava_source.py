"""Strava API V3 → dlt → DuckDB ingestion pipeline.

Handles paginated activity listing with rate-limit awareness.
Strava limits: 100 requests / 15 min, 1 000 requests / day.
"""

import logging
import time

import dlt
import requests

logger = logging.getLogger(__name__)

STRAVA_BASE = "https://www.strava.com/api/v3"
PAGE_SIZE = 200  # max allowed by Strava
RATE_LIMIT_BUFFER = 20  # pause when remaining requests < this


def _check_rate_limit(resp: requests.Response) -> None:
    """Sleep if we're approaching Strava's 15-minute rate limit."""
    usage = resp.headers.get("X-RateLimit-Usage", "")
    limit = resp.headers.get("X-RateLimit-Limit", "")
    if not usage or not limit:
        return

    short_used, _ = (int(x) for x in usage.split(","))
    short_limit, _ = (int(x) for x in limit.split(","))
    remaining = short_limit - short_used

    if remaining <= RATE_LIMIT_BUFFER:
        wait_seconds = 60 * 5  # wait 5 minutes to let the 15-min window slide
        logger.warning("Strava rate-limit approaching (%s/%s). Sleeping %ss…", short_used, short_limit, wait_seconds)
        time.sleep(wait_seconds)


@dlt.resource(write_disposition="append", primary_key="id")
def strava_activities(access_token: str, after: int | None = None):
    """Yield pages of Strava activities, respecting rate limits.

    Parameters
    ----------
    access_token : str
        Valid OAuth 2.0 bearer token.
    after : int | None
        Unix epoch — only return activities after this timestamp.
    """
    page = 1
    while True:
        params: dict = {"page": page, "per_page": PAGE_SIZE}
        if after is not None:
            params["after"] = after

        resp = requests.get(
            f"{STRAVA_BASE}/athlete/activities",
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
            timeout=30,
        )
        resp.raise_for_status()
        _check_rate_limit(resp)

        data = resp.json()
        if not data:
            break

        yield data
        page += 1


@dlt.resource(write_disposition="merge", primary_key="id")
def strava_athlete(access_token: str):
    """Fetch the authenticated athlete profile (weight, FTP, etc.)."""
    resp = requests.get(
        f"{STRAVA_BASE}/athlete",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=30,
    )
    resp.raise_for_status()
    yield [resp.json()]


@dlt.source(name="strava")
def strava_source(access_token: str, after: int | None = None):
    """Top-level dlt source combining all Strava resources."""
    return [
        strava_activities(access_token, after),
        strava_athlete(access_token),
    ]


def run_strava_pipeline(access_token: str, after: int | None = None, duckdb_path: str = "fitness.duckdb"):
    """Convenience function to run the full Strava ingestion."""
    pipeline = dlt.pipeline(
        pipeline_name="strava",
        destination=dlt.destinations.duckdb(duckdb_path),
        dataset_name="raw",
    )
    load_info = pipeline.run(strava_source(access_token=access_token, after=after))
    logger.info("Strava load complete: %s", load_info)
    return load_info
