-- Audit: Ensure int_training_load has no duplicate training_date rows.
-- Each calendar date should appear at most once after aggregation.

AUDIT (
  name assert_unique_training_date
);

SELECT
    training_date,
    COUNT(*) AS row_count
FROM @this_model
GROUP BY training_date
HAVING COUNT(*) > 1;
