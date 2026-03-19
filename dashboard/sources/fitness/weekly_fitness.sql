SELECT 
  week_start,
  training_days,
  weekly_load,
  weekly_cardio_load,
  weekly_strength_load,
  avg_atl,
  avg_ctl,
  training_stress_balance,
  atl_ctl_ratio
FROM marts.mart_weekly_fitness_summary
ORDER BY week_start
