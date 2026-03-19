---
title: Strength
---

# 💪 Strength Progression

Track your estimated 1RM, total volume, and training intensity over time.

---

```sql top_exercises
SELECT 
  exercise_name,
  MAX(peak_1rm) AS best_1rm
FROM fitness.strength_trends
GROUP BY exercise_name
ORDER BY best_1rm DESC
LIMIT 8
```

```sql strength_data
SELECT
  week_start,
  exercise_name,
  ROUND(peak_1rm, 1) AS peak_1rm,
  ROUND(weekly_volume_kg, 0) AS volume_kg,
  weekly_sets,
  ROUND(weekly_avg_rpe, 1) AS avg_rpe
FROM fitness.strength_trends
WHERE exercise_name IN (SELECT exercise_name FROM ${top_exercises})
ORDER BY week_start
```

## Estimated 1RM — Top Lifts

Estimated using the **Epley formula**: `1RM = weight × (1 + reps / 30)`. Only working sets (1–12 reps) are included.

<LineChart
  data={strength_data}
  x=week_start
  y=peak_1rm
  series=exercise_name
  yAxisTitle="Estimated 1RM (kg)"
  chartAreaHeight=350
/>

---

## Weekly Volume

Total weight × reps per exercise per week.

<BarChart
  data={strength_data}
  x=week_start
  y=volume_kg
  series=exercise_name
  type=stacked
  yAxisTitle="Volume (kg)"
  chartAreaHeight=300
/>

---

## Weekly Sets

<BarChart
  data={strength_data}
  x=week_start
  y=weekly_sets
  series=exercise_name
  type=stacked
  yAxisTitle="Sets"
  chartAreaHeight=280
/>

---

## RPE Trend

Rate of Perceived Exertion — how hard the sets felt.

<LineChart
  data={strength_data}
  x=week_start
  y=avg_rpe
  series=exercise_name
  yAxisTitle="RPE"
  chartAreaHeight=280
/>

---

## Top Exercises — All-Time Bests

```sql exercise_bests
SELECT 
  exercise_name AS "Exercise",
  ROUND(MAX(peak_1rm), 1) AS "Best 1RM (kg)",
  ROUND(SUM(weekly_volume_kg), 0) AS "Total Volume (kg)",
  SUM(weekly_sets) AS "Total Sets"
FROM fitness.strength_trends
GROUP BY exercise_name
ORDER BY "Best 1RM (kg)" DESC
LIMIT 20
```

<DataTable data={exercise_bests} rows=20 />

