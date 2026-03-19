---
title: Cardio
---

# 🏃 Cardio Performance

Pace, heart rate efficiency, and distance trends across all cardio activities.

---

```sql cardio_summary
SELECT
  COUNT(*) AS total_weeks,
  ROUND(SUM(total_distance_km), 0) AS total_distance,
  ROUND(AVG(avg_pace_min_per_km), 2) AS avg_pace,
  ROUND(AVG(avg_heart_rate), 0) AS avg_hr
FROM fitness.cardio_trends
WHERE sport_type = 'Run'
```

<BigValue data={cardio_summary} value=total_distance title="Total Distance (km)" fmt="#,##0" />
<BigValue data={cardio_summary} value=total_weeks title="Active Weeks (Run)" />
<BigValue data={cardio_summary} value=avg_pace title="Avg Pace (min/km)" />
<BigValue data={cardio_summary} value=avg_hr title="Avg Heart Rate" />

---

## Aerobic Efficiency

**HR per km/h** — how hard your heart works at a given speed. Lower is better.

```sql efficiency_trend
SELECT
  week_start,
  sport_type,
  ROUND(avg_efficiency, 2) AS efficiency
FROM fitness.cardio_trends
WHERE sport_type IN ('Run', 'VirtualRide', 'Ride')
ORDER BY week_start
```

<LineChart
  data={efficiency_trend}
  x=week_start
  y=efficiency
  series=sport_type
  yAxisTitle="HR / km/h (lower = better)"
  chartAreaHeight=300
/>

---

## Running Pace

```sql run_pace
SELECT
  week_start,
  ROUND(avg_pace_min_per_km, 2) AS pace
FROM fitness.cardio_trends
WHERE sport_type = 'Run'
ORDER BY week_start
```

<LineChart
  data={run_pace}
  x=week_start
  y=pace
  yAxisTitle="min / km"
  chartAreaHeight=280
/>

---

## Weekly Distance

```sql weekly_distance
SELECT
  week_start,
  sport_type,
  ROUND(total_distance_km, 1) AS distance_km
FROM fitness.cardio_trends
ORDER BY week_start
```

<BarChart
  data={weekly_distance}
  x=week_start
  y=distance_km
  series=sport_type
  type=stacked
  yAxisTitle="km"
  chartAreaHeight=280
/>

---

## Heart Rate vs. Pace

Each dot is a run. Dots trending **left and down** over time means improving aerobic fitness — faster at a lower heart rate.

```sql hr_pace
SELECT
  activity_date,
  activity_name,
  ROUND(pace_min_per_km, 2) AS pace,
  ROUND(avg_hr, 0) AS hr,
  ROUND(distance_km, 1) AS distance_km
FROM fitness.cardio_efficiency
WHERE sport_type = 'Run'
  AND pace_min_per_km IS NOT NULL
  AND pace_min_per_km < 15
ORDER BY activity_date DESC
LIMIT 200
```

<ScatterPlot
  data={hr_pace}
  x=pace
  y=hr
  xAxisTitle="Pace (min/km)"
  yAxisTitle="Avg HR (bpm)"
  chartAreaHeight=350
/>

---

## Cardio Weekly Log

```sql cardio_log
SELECT
  week_start AS "Week",
  sport_type AS "Sport",
  activity_count AS "Sessions",
  ROUND(total_distance_km, 1) AS "Distance (km)",
  ROUND(avg_pace_min_per_km, 2) AS "Pace (min/km)",
  ROUND(avg_speed_kmh, 1) AS "Speed (km/h)",
  ROUND(avg_heart_rate, 0) AS "Avg HR",
  ROUND(avg_efficiency, 2) AS "Efficiency",
  ROUND(total_elevation_gain_m, 0) AS "Elevation (m)"
FROM fitness.cardio_trends
ORDER BY week_start DESC
```

<DataTable data={cardio_log} rows=15 />

