-- Intermediate: Cardio efficiency (running economy, cycling efficiency)
-- Computes pace, speed, and HR-per-km/h (lower = more aerobically efficient)

MODEL (
  name intermediate.int_cardio_efficiency,
  kind FULL,
  audits [
    assert_reasonable_cardio_efficiency
  ]
);

SELECT
    started_at::DATE                                        AS activity_date,
    activity_id,
    activity_name,
    sport_type,
    distance_meters / 1000.0                                AS distance_km,
    elapsed_seconds / 60.0                                  AS duration_minutes,
    moving_seconds / 60.0                                   AS moving_minutes,
    avg_hr,
    max_hr,
    elevation_gain_m,

    -- Pace: minutes per km (useful for running)
    CASE
        WHEN distance_meters > 0
        THEN (moving_seconds / 60.0) / (distance_meters / 1000.0)
    END                                                     AS pace_min_per_km,

    -- Speed: km per hour
    CASE
        WHEN moving_seconds > 0
        THEN (distance_meters / 1000.0) / (moving_seconds / 3600.0)
    END                                                     AS speed_kmh,

    -- Efficiency: HR per km/h — lower means more efficient
    CASE
        WHEN distance_meters > 0 AND moving_seconds > 0
        THEN avg_hr / ((distance_meters / 1000.0) / (moving_seconds / 3600.0))
    END                                                     AS hr_per_kmh,

    -- Elevation density: meters gained per km
    CASE
        WHEN distance_meters > 0
        THEN elevation_gain_m / (distance_meters / 1000.0)
    END                                                     AS elevation_per_km

FROM staging.stg_strava_activities
WHERE sport_type IN ('Run', 'Ride', 'Swim', 'Walk', 'Hike', 'TrailRun', 'VirtualRun', 'VirtualRide')
  AND avg_hr IS NOT NULL
  AND distance_meters > 500;
