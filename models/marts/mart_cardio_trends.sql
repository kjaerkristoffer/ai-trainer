-- Mart: Cardio trends — weekly aggregates per sport type
--
-- ALTERATION from PRD: This mart was missing. The PRD had
-- int_cardio_efficiency at the intermediate layer but no
-- corresponding mart, forcing the dashboard to query
-- intermediate models directly (breaking the layer contract).

MODEL (
  name marts.mart_cardio_trends,
  kind FULL
);

SELECT
    DATE_TRUNC('week', activity_date)           AS week_start,
    sport_type,
    COUNT(*)                                    AS activity_count,
    SUM(distance_km)                            AS total_distance_km,
    SUM(moving_minutes)                         AS total_moving_minutes,
    AVG(pace_min_per_km)                        AS avg_pace_min_per_km,
    AVG(speed_kmh)                              AS avg_speed_kmh,
    AVG(avg_hr)                                 AS avg_heart_rate,
    AVG(hr_per_kmh)                             AS avg_efficiency,
    SUM(elevation_gain_m)                       AS total_elevation_gain_m,
    AVG(elevation_per_km)                       AS avg_elevation_per_km
FROM intermediate.int_cardio_efficiency
GROUP BY 1, 2
ORDER BY 1, 2;
