-- Staging: Hevy exercise templates (catalog of exercises + muscle groups)
-- secondary_muscle_groups is a child table from dlt normalization;
-- we aggregate it back into a comma-separated list.

MODEL (
  name staging.stg_hevy_exercise_templates,
  kind FULL,
  grain [template_id]
);

SELECT
    t.id                      AS template_id,
    t.title                   AS exercise_name,
    t.type                    AS exercise_type,
    t.primary_muscle_group,
    t.equipment,
    t.is_custom
FROM raw.hevy_exercise_templates AS t;
