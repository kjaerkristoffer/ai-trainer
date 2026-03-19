-- Intermediate: Strength progression per exercise
-- Estimates 1RM using the Epley formula: 1RM = weight × (1 + reps / 30)
-- Filters to working sets (normal type, 1–12 reps, weight > 0)

MODEL (
  name intermediate.int_strength_progression,
  kind FULL,
  audits [
    assert_positive_strength_metrics
  ]
);

SELECT
    workout_started_at::DATE                    AS log_date,
    exercise_name,
    exercise_template_id,
    MAX(weight_kg * (1 + reps / 30.0))          AS estimated_1rm,
    MAX(weight_kg)                               AS max_weight_used,
    SUM(weight_kg * reps)                        AS total_volume_kg,
    COUNT(*)                                     AS total_sets,
    AVG(rpe)                                     AS avg_rpe
FROM staging.stg_hevy_sets
WHERE set_type = 'normal'
  AND reps BETWEEN 1 AND 12
  AND weight_kg > 0
GROUP BY 1, 2, 3;
