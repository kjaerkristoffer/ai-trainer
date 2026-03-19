SELECT
  activity_date,
  source_id,
  source,
  activity_type,
  activity_name,
  distance_meters,
  moving_seconds,
  avg_hr,
  max_hr,
  load_metric,
  volume_kg,
  total_sets
FROM marts.mart_activity_log
ORDER BY activity_date DESC
