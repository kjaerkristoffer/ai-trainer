-- Staging: Strava athlete profile (weight, FTP, etc.)

MODEL (
  name staging.stg_strava_athlete,
  kind FULL,
  grain [athlete_id]
);

SELECT
    id                      AS athlete_id,
    firstname,
    lastname,
    weight                  AS weight_kg,
    ftp,
    CAST(_dlt_load_id AS VARCHAR)  AS load_id
FROM raw.strava_athlete;
