-- Mart: Weekly fitness summary (ATL, CTL, TSB)
--
-- ALTERATION from PRD: TSB is now computed as CTL − ATL (difference),
-- matching the standard Banister model. The PRD had ATL / CTL (ratio),
-- which contradicts the documented definition.
--   Negative TSB → fatigued / overreached
--   Positive TSB → fresh / detraining risk

MODEL (
  name marts.mart_weekly_fitness_summary,
  kind FULL
);

SELECT
    DATE_TRUNC('week', training_date)                       AS week_start,
    COUNT(*)                                                AS training_days,
    SUM(total_z_load)                                       AS weekly_load,
    SUM(cardio_raw_load)                                    AS weekly_cardio_load,
    SUM(strength_raw_load)                                  AS weekly_strength_load,
    AVG(atl_7d)                                             AS avg_atl,
    AVG(ctl_28d)                                            AS avg_ctl,
    AVG(ctl_28d) - AVG(atl_7d)                              AS training_stress_balance,
    AVG(atl_7d) / NULLIF(AVG(ctl_28d), 0)                  AS atl_ctl_ratio
FROM intermediate.int_training_load
GROUP BY 1
ORDER BY 1;
