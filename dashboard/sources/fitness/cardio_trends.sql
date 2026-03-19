SELECT
  week_start,
  sport_type,
  activity_count,
  total_distance_km,
  total_moving_minutes,
  avg_pace_min_per_km,
  avg_speed_kmh,
  avg_heart_rate,
  avg_efficiency,
  total_elevation_gain_m,
  avg_elevation_per_km
FROM marts.mart_cardio_trends
ORDER BY week_start, sport_type
