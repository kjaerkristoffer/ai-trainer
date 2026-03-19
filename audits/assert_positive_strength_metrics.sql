-- Audit: Ensure no negative values in key numeric fields for strength data.

AUDIT (
  name assert_positive_strength_metrics
);

SELECT *
FROM @this_model
WHERE estimated_1rm < 0
   OR total_volume_kg < 0
   OR total_sets < 0;
