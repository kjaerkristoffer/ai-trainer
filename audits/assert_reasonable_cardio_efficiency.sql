-- Audit: Ensure cardio efficiency values are within reasonable bounds.

AUDIT (
  name assert_reasonable_cardio_efficiency
);

SELECT *
FROM @this_model
WHERE pace_min_per_km < 1          -- faster than world record
   OR pace_min_per_km > 30         -- essentially walking
   OR hr_per_kmh < 0
   OR speed_kmh < 0;
