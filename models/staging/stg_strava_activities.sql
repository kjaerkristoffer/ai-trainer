-- Staging: Strava activities (1:1 clean + type-cast of raw data)
-- No business logic — just rename, cast, and filter garbage rows.
--
-- NOTE: suffer_score and perceived_exertion are NOT available from
-- the /athlete/activities list endpoint. We compute a heart-rate-based
-- training impulse (hrTRIMP) in the intermediate layer instead.

MODEL (
  name staging.stg_strava_activities,
  kind FULL,
  grain [activity_id],
  audits [
    not_null(columns := [activity_id, sport_type, started_at]),
    accepted_range(column := distance_meters, min_v := 0)
  ]
);

SELECT
    id                                    AS activity_id,
    name                                  AS activity_name,
    type                                  AS activity_type,
    sport_type,
    CAST(start_date_local AS TIMESTAMP)   AS started_at,
    elapsed_time                          AS elapsed_seconds,
    moving_time                           AS moving_seconds,
    distance                              AS distance_meters,
    total_elevation_gain                  AS elevation_gain_m,
    CAST(average_heartrate AS DOUBLE)     AS avg_hr,
    CAST(max_heartrate AS DOUBLE)         AS max_hr,
    average_speed                         AS avg_speed_mps,
    CAST(average_watts AS DOUBLE)         AS average_watts,
    CAST(weighted_average_watts AS DOUBLE) AS normalized_power,
    CAST(kilojoules AS DOUBLE)            AS kilojoules
FROM raw.strava_activities
WHERE sport_type IS NOT NULL;
