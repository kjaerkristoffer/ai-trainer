SELECT
  week_start,
  exercise_name,
  exercise_template_id,
  peak_1rm,
  weekly_volume_kg,
  weekly_sets,
  weekly_avg_rpe
FROM marts.mart_strength_trends
ORDER BY week_start, exercise_name
