SELECT
  activity_date,
  activity_id,
  activity_name,
  sport_type,
  distance_km,
  duration_minutes,
  moving_minutes,
  avg_hr,
  max_hr,
  elevation_gain_m,
  pace_min_per_km,
  speed_kmh,
  hr_per_kmh,
  elevation_per_km
FROM intermediate.int_cardio_efficiency
ORDER BY activity_date DESC
