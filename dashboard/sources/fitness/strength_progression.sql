SELECT
  log_date,
  exercise_name,
  exercise_template_id,
  estimated_1rm,
  max_weight_used,
  total_volume_kg,
  total_sets,
  avg_rpe
FROM intermediate.int_strength_progression
ORDER BY log_date DESC, exercise_name
