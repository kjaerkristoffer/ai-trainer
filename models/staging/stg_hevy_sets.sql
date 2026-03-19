-- Staging: Hevy sets (1:1 clean + type-cast of raw data)
--
-- IMPORTANT: dlt auto-normalizes nested JSON into child tables:
--   raw.hevy_workouts                     → workout-level fields
--   raw.hevy_workouts__exercises           → exercise-level fields
--   raw.hevy_workouts__exercises__sets     → set-level fields
--
-- We JOIN across these dlt-generated tables instead of using UNNEST.
-- The _dlt_parent_id / _dlt_id columns are the join keys dlt creates.

MODEL (
  name staging.stg_hevy_sets,
  kind FULL,
  grain [workout_id, exercise_index, set_index],
  audits [
    not_null(columns := [workout_id, exercise_name, set_index]),
    accepted_range(column := weight_kg, min_v := 0),
    accepted_range(column := reps, min_v := 0, max_v := 200),
    accepted_range(column := rpe, min_v := 1, max_v := 10)
  ]
);

SELECT
    w.id                                AS workout_id,
    w.title                             AS workout_title,
    CAST(w.start_time AS TIMESTAMP)     AS workout_started_at,
    CAST(w.end_time AS TIMESTAMP)       AS workout_ended_at,
    e.title                             AS exercise_name,
    e.exercise_template_id,
    e._dlt_list_idx                     AS exercise_index,
    s._dlt_list_idx                     AS set_index,
    s.type                              AS set_type,       -- normal, warmup, dropset, failure
    -- dlt creates variant columns (BIGINT + DOUBLE) when types differ across rows
    CAST(COALESCE(s.weight_kg__v_double, s.weight_kg) AS DOUBLE) AS weight_kg,
    CAST(s.reps AS INTEGER)             AS reps,
    CAST(COALESCE(s.rpe__v_double, s.rpe) AS DOUBLE)             AS rpe,
    CAST(s.duration_seconds AS DOUBLE)  AS duration_seconds
FROM raw.hevy_workouts AS w
JOIN raw.hevy_workouts__exercises AS e
    ON w._dlt_id = e._dlt_parent_id
JOIN raw.hevy_workouts__exercises__sets AS s
    ON e._dlt_id = s._dlt_parent_id;
