-- Mart: Activity log — day-by-day drill-down of all activities
-- Combines cardio activities and strength workouts into a single unified log.

MODEL (
  name marts.mart_activity_log,
  kind FULL
);

WITH cardio AS (
    SELECT
        started_at::DATE        AS activity_date,
        activity_id::VARCHAR    AS source_id,
        'strava'                AS source,
        sport_type              AS activity_type,
        activity_name,
        distance_meters,
        moving_seconds,
        avg_hr,
        max_hr,
        -- hrTRIMP as load metric (suffer_score not available from list API)
        CASE WHEN avg_hr > 0 AND moving_seconds > 0
             THEN (moving_seconds / 60.0) * (avg_hr / 180.0)
             ELSE NULL
        END                     AS load_metric,
        NULL::DOUBLE            AS volume_kg,
        NULL::INTEGER           AS total_sets
    FROM staging.stg_strava_activities
),

strength AS (
    SELECT
        workout_started_at::DATE    AS activity_date,
        workout_id::VARCHAR         AS source_id,
        'hevy'                      AS source,
        'Strength'                  AS activity_type,
        workout_title               AS activity_name,
        NULL::DOUBLE                AS distance_meters,
        NULL::BIGINT                AS moving_seconds,
        NULL::DOUBLE                AS avg_hr,
        NULL::DOUBLE                AS max_hr,
        NULL::DOUBLE                AS load_metric,
        SUM(weight_kg * reps)       AS volume_kg,
        COUNT(*)                    AS total_sets
    FROM staging.stg_hevy_sets
    WHERE set_type = 'normal'
    GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
)

SELECT * FROM cardio
UNION ALL
SELECT * FROM strength
ORDER BY activity_date DESC;
