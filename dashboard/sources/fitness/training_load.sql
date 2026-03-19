SELECT 
  training_date,
  total_z_load,
  cardio_raw_load,
  strength_raw_load,
  atl_7d,
  ctl_28d,
  ctl_28d - atl_7d AS tsb
FROM intermediate.int_training_load
ORDER BY training_date
