# Fitness Analytics Pipeline

Personal fitness intelligence platform that ingests cardio data from **Strava** and strength training data from **Hevy**, transforms it with **SQLMesh**, stores everything in **DuckDB**, and serves a unified dashboard via **Evidence.dev**.

> *"One place to answer: Am I getting fitter, stronger, and recovering well?"*

---

## Architecture

```
Strava API V3 ──┐                          ┌── Evidence.dev Dashboard
(OAuth 2.0)      ├──→ dlt → DuckDB → SQLMesh ──┤   (SQL + Markdown)
Hevy API ────────┘     (raw)       (staged →  └── Static site
(API Key)                           mart)

Orchestration: Dagster OSS (daily 06:00 schedule)
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for Evidence.dev)
- [uv](https://docs.astral.sh/uv/) (recommended) or pip
- A [Strava API app](https://www.strava.com/settings/api) (free)
- A [Hevy PRO](https://hevyapp.com) subscription (for API key)

### 1. Clone & install

```bash
git clone <repo-url> && cd fitness-analytics
cp .env.example .env
# Fill in your API credentials in .env

# Python dependencies
uv sync                  # or: pip install -e ".[dev]"

# Evidence.dev dashboard
cd dashboard && npm install && cd ..
```

### 2. Initial data load

```bash
python run_ingestion.py
```

This will:
- Refresh your Strava OAuth token automatically
- Pull all Strava activities and athlete profile
- Pull all Hevy workouts, exercise templates, and routines
- Store everything in `fitness.duckdb` under the `raw` schema

### 3. Run transformations

```bash
sqlmesh plan --no-prompts --auto-apply
```

### 4. Launch dashboard

```bash
cd dashboard
npm run dev         # opens at http://localhost:3000
```

### 5. Set up daily automation (optional)

```bash
dagster dev -m orchestration.definitions
# Open http://localhost:3000 → enable the daily_fitness_schedule
```

---

## Project Structure

```
fitness-analytics/
├── .env.example                 # Required environment variables
├── .gitignore
├── pyproject.toml               # Python dependencies
├── config.yaml                  # SQLMesh configuration (DuckDB gateway)
├── run_ingestion.py             # One-command ingestion runner
│
├── ingestion/                   # dlt pipelines
│   ├── __init__.py
│   ├── auth.py                  # Strava OAuth refresh + sync watermarks
│   ├── strava_source.py         # Strava activities + athlete profile
│   └── hevy_source.py           # Hevy workouts, templates, routines
│
├── models/                      # SQLMesh transformation models
│   ├── staging/                 # Layer 1: clean + type-cast (no logic)
│   │   ├── stg_strava_activities.sql
│   │   ├── stg_strava_athlete.sql
│   │   ├── stg_hevy_sets.sql
│   │   └── stg_hevy_exercise_templates.sql
│   ├── intermediate/            # Layer 2: business logic + metrics
│   │   ├── int_training_load.sql
│   │   ├── int_strength_progression.sql
│   │   └── int_cardio_efficiency.sql
│   └── marts/                   # Layer 3: dashboard-ready aggregates
│       ├── mart_weekly_fitness_summary.sql
│       ├── mart_strength_trends.sql
│       ├── mart_cardio_trends.sql
│       └── mart_activity_log.sql
│
├── audits/                      # SQLMesh data quality audits
│   ├── assert_unique_training_date.sql
│   ├── assert_positive_strength_metrics.sql
│   └── assert_reasonable_cardio_efficiency.sql
│
├── orchestration/               # Dagster jobs + schedules
│   ├── __init__.py
│   └── definitions.py
│
└── dashboard/                   # Evidence.dev static dashboard
    ├── package.json
    ├── evidence.config.yaml
    └── pages/
        ├── index.md             # Weekly fitness overview + activity log
        ├── strength.md          # 1RM progression, volume, RPE trends
        └── cardio.md            # Pace, efficiency, HR vs speed
```

---

## Key Metrics

| Metric | Definition | Source |
|--------|-----------|--------|
| **ATL** (Fatigue) | 7-day rolling avg of normalized training load | `int_training_load` |
| **CTL** (Fitness) | 28-day rolling avg of normalized training load | `int_training_load` |
| **TSB** (Form) | CTL − ATL; negative = fatigued | `mart_weekly_fitness_summary` |
| **Estimated 1RM** | Epley formula per exercise | `int_strength_progression` |
| **Cardio Efficiency** | HR per km/h (lower = better) | `int_cardio_efficiency` |
| **Weekly Volume** | Total weight × reps per week | `mart_strength_trends` |
| **Elevation Density** | Elevation gain per km | `int_cardio_efficiency` |

---

## Design Decisions

1. **dlt auto-normalizes nested JSON** → `stg_hevy_sets` uses JOINs across `hevy_workouts`, `hevy_workouts__exercises`, and `hevy_workouts__exercises__sets` (not `UNNEST`)
2. **Z-score normalization** for combined training load → cardio suffer_score and strength volume are on incomparable scales; raw addition is meaningless
3. **TSB = CTL − ATL** (difference, not ratio) → matches the standard Banister impulse model
4. **Strava rate-limit handling** → checks `X-RateLimit-Usage` headers, sleeps when approaching the 100 req/15 min ceiling
5. **Parallel ingestion** in Dagster → Strava and Hevy are independent; no reason to block one on the other

---

## Rate Limits

| API | Limit | Strategy |
|-----|-------|----------|
| Strava | 100 req / 15 min, 1,000 / day | Check `X-RateLimit-Usage` headers; sleep on approach |
| Hevy | Not documented (reasonable use) | Standard pagination with 10 items/page |

---

## Alerts

The pipeline checks two conditions after each run:

- **Overreach**: TSB < −30 → log a warning to reduce training load
- **Stale data**: >7 days since last training entry → log a sync warning

---

## License

MIT
