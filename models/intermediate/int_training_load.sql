-- Intermediate: Daily training load with ATL / CTL (Banister impulse model)
--
-- Cardio load uses heart-rate TRIMP (Training Impulse):
--   hrTRIMP = moving_minutes × (avg_hr / 180) × intensity_factor
-- This replaces suffer_score which is not available from the activity list API.
--
-- Strength load = total volume in tonnes (weight_kg × reps / 1000).
--
-- Both sources are z-score normalized before combining, since raw scales
-- are incomparable.

MODEL (
  name intermediate.int_training_load,
  kind FULL,
  audits [
    assert_unique_training_date
  ]
);

WITH cardio_raw AS (
    SELECT
        started_at::DATE   AS training_date,
        -- hrTRIMP: scaled heart rate load (moving_minutes × HR intensity)
        SUM(
            (moving_seconds / 60.0)
            * (avg_hr / 180.0)
        )                  AS daily_load
    FROM staging.stg_strava_activities
    WHERE avg_hr IS NOT NULL
      AND avg_hr > 0
      AND moving_seconds > 0
    GROUP BY 1
),
cardio_stats AS (
    SELECT
        AVG(daily_load)    AS mean_load,
        STDDEV(daily_load) AS std_load
    FROM cardio_raw
),
cardio_normalized AS (
    SELECT
        cr.training_date,
        'cardio'                                                       AS source,
        cr.daily_load                                                  AS raw_load,
        CASE WHEN cs.std_load > 0
             THEN (cr.daily_load - cs.mean_load) / cs.std_load
             ELSE 0
        END                                                            AS z_load
    FROM cardio_raw cr
    CROSS JOIN cardio_stats cs
),

strength_raw AS (
    SELECT
        workout_started_at::DATE          AS training_date,
        SUM(weight_kg * reps) / 1000.0    AS daily_load   -- volume in tonnes
    FROM staging.stg_hevy_sets
    WHERE set_type = 'normal'
      AND weight_kg > 0
      AND reps > 0
    GROUP BY 1
),
strength_stats AS (
    SELECT
        AVG(daily_load)    AS mean_load,
        STDDEV(daily_load) AS std_load
    FROM strength_raw
),
strength_normalized AS (
    SELECT
        sr.training_date,
        'strength'                                                     AS source,
        sr.daily_load                                                  AS raw_load,
        CASE WHEN ss.std_load > 0
             THEN (sr.daily_load - ss.mean_load) / ss.std_load
             ELSE 0
        END                                                            AS z_load
    FROM strength_raw sr
    CROSS JOIN strength_stats ss
),

combined AS (
    SELECT training_date, source, raw_load, z_load FROM cardio_normalized
    UNION ALL
    SELECT training_date, source, raw_load, z_load FROM strength_normalized
),

daily AS (
    SELECT
        training_date,
        SUM(z_load)                                    AS total_z_load,
        SUM(CASE WHEN source = 'cardio'   THEN raw_load ELSE 0 END) AS cardio_raw_load,
        SUM(CASE WHEN source = 'strength' THEN raw_load ELSE 0 END) AS strength_raw_load
    FROM combined
    GROUP BY training_date
)

SELECT
    training_date,
    total_z_load,
    cardio_raw_load,
    strength_raw_load,
    AVG(total_z_load) OVER (
        ORDER BY training_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS atl_7d,
    AVG(total_z_load) OVER (
        ORDER BY training_date
        ROWS BETWEEN 27 PRECEDING AND CURRENT ROW
    ) AS ctl_28d
FROM daily
ORDER BY training_date;
