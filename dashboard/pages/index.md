---
title: Fitness Dashboard
hide_title: true
---

# 🏋️ Fitness Dashboard

_Am I getting fitter, stronger, and recovering well?_

---

```sql total_stats
SELECT
  COUNT(DISTINCT CASE WHEN source = 'strava' THEN source_id END) AS cardio_sessions,
  COUNT(DISTINCT CASE WHEN source = 'hevy' THEN source_id END) AS strength_sessions,
  ROUND(SUM(CASE WHEN source = 'strava' THEN distance_meters ELSE 0 END) / 1000.0, 0) AS total_km,
  ROUND(SUM(CASE WHEN source = 'hevy' THEN volume_kg ELSE 0 END) / 1000.0, 1) AS total_tonnes_lifted
FROM fitness.activity_log
```

```sql this_week
SELECT
  COUNT(DISTINCT CASE WHEN source = 'strava' THEN source_id END) AS cardio,
  COUNT(DISTINCT CASE WHEN source = 'hevy' THEN source_id END) AS strength,
  ROUND(SUM(CASE WHEN source = 'strava' THEN distance_meters ELSE 0 END) / 1000.0, 1) AS km,
  ROUND(SUM(CASE WHEN source = 'hevy' THEN volume_kg ELSE 0 END), 0) AS vol_kg
FROM fitness.activity_log
WHERE activity_date >= DATE_TRUNC('week', CURRENT_DATE)
```

<BigValue 
  data={total_stats} 
  value=cardio_sessions
  title="Total Cardio Sessions"
/>
<BigValue 
  data={total_stats} 
  value=strength_sessions
  title="Total Strength Sessions"
/>
<BigValue 
  data={total_stats} 
  value=total_km
  title="Total Distance (km)"
  fmt='#,##0'
/>
<BigValue 
  data={total_stats} 
  value=total_tonnes_lifted
  title="Total Tonnes Lifted"
/>

### This Week

<BigValue 
  data={this_week} 
  value=cardio
  title="Cardio"
/>
<BigValue 
  data={this_week} 
  value=strength
  title="Strength"
/>
<BigValue 
  data={this_week} 
  value=km
  title="km"
/>
<BigValue 
  data={this_week} 
  value=vol_kg
  title="Volume (kg)"
  fmt='#,##0'
/>

---

## Fitness vs. Fatigue

The **Banister impulse model** tracks training load over time. **CTL** (28-day avg) represents your fitness baseline. **ATL** (7-day avg) represents recent fatigue. When ATL exceeds CTL, you're accumulating fatigue faster than fitness.

```sql fitness_data
SELECT 
  training_date,
  ROUND(atl_7d, 2) AS atl,
  ROUND(ctl_28d, 2) AS ctl
FROM fitness.training_load
ORDER BY training_date
```

<LineChart
  data={fitness_data}
  x=training_date
  y={["atl", "ctl"]}
  yAxisTitle="Normalized Load"
  chartAreaHeight=300
  labels={["Fatigue (ATL)", "Fitness (CTL)"]}
/>

## Training Stress Balance

**TSB = CTL − ATL.** Positive = fresh. Negative = fatigued. Below **-1.5** is an overreach warning.

```sql tsb_data
SELECT 
  training_date,
  ROUND(tsb, 2) AS tsb
FROM fitness.training_load
ORDER BY training_date
```

<BarChart
  data={tsb_data}
  x=training_date
  y=tsb
  chartAreaHeight=250
/>

---

## Weekly Training Volume

```sql weekly_load
SELECT 
  week_start,
  training_days,
  ROUND(weekly_cardio_load, 0) AS cardio_trimp,
  ROUND(weekly_strength_load, 1) AS strength_tonnes
FROM fitness.weekly_fitness
ORDER BY week_start
```

<BarChart
  data={weekly_load}
  x=week_start
  y={["cardio_trimp", "strength_tonnes"]}
  chartAreaHeight=280
  type=stacked
/>

---

## Recent Activity Log

```sql recent_log
SELECT
  activity_date AS "Date",
  source AS "Source",
  activity_type AS "Type",
  activity_name AS "Activity",
  ROUND(distance_meters / 1000.0, 1) AS "Dist (km)",
  ROUND(moving_seconds / 60.0, 0) AS "Dur (min)",
  ROUND(avg_hr, 0) AS "Avg HR",
  ROUND(load_metric, 1) AS "TRIMP",
  ROUND(volume_kg, 0) AS "Vol (kg)",
  total_sets AS "Sets"
FROM fitness.activity_log
ORDER BY activity_date DESC
LIMIT 30
```

<DataTable data={recent_log} rows=15 />

