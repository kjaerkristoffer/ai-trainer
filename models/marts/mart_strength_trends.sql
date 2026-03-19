-- Mart: Strength trends — weekly peak 1RM, volume, and sets per exercise

MODEL (
  name marts.mart_strength_trends,
  kind FULL
);

SELECT
    DATE_TRUNC('week', log_date)    AS week_start,
    exercise_name,
    exercise_template_id,
    MAX(estimated_1rm)              AS peak_1rm,
    SUM(total_volume_kg)            AS weekly_volume_kg,
    SUM(total_sets)                 AS weekly_sets,
    AVG(avg_rpe)                    AS weekly_avg_rpe
FROM intermediate.int_strength_progression
GROUP BY 1, 2, 3
ORDER BY 1, 2;
