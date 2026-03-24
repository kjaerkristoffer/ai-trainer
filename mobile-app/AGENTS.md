<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mobile App Design Guardrails

- This is a mobile-first app. Always design and validate layout at mobile viewport widths first. Do not waste vertical space — every screen should feel intentional and tight on a 390px-wide device.
- Preserve the green gradient and glassmorphism visual direction across the mobile app.
- Do not replace the current green-accented palette with unrelated themes unless explicitly requested.
- Keep activity and workout detail flows in pop-up or overlay surfaces rather than moving them into cramped inline layouts.
- Keep the month calendar mobile-first and minimal: date first, colored activity dots beneath, balanced spacing, and no extra text inside each day tile.
- For strength workouts, exercise rows should expand inline directly beneath the selected exercise row and collapse back into that row when toggled.

# Data Update Workflow

When asked to "update data", run all of the following steps in order from the **repository root** (`c:\Projects\AI Trainer`), not from `mobile-app/`. Do not skip steps or stop early — verify each step succeeds before moving to the next.

**Step 1 — Ingest raw data (Strava + Hevy)**
```
python run_ingestion.py
```
This pulls incremental Strava data (from last sync timestamp) and full Hevy data into `fitness.duckdb`.

**Step 2 — Refresh SQLMesh models**
```
sqlmesh run
```
This rebuilds all staging → intermediate → mart tables from the raw data. This step is mandatory — skipping it means the mart tables stay stale even though raw data was updated.

**Step 3 — Verify the data landed**
Query the mart to confirm the expected recent dates are present:
```python
python -c "
import duckdb
con = duckdb.connect('fitness.duckdb', read_only=True)
rows = con.sql(\"SELECT activity_date, source, activity_name FROM marts.mart_activity_log ORDER BY activity_date DESC LIMIT 10\").fetchall()
for r in rows: print(r)
con.close()
"
```
Do not proceed to export if the most recent activities are missing. If data is missing, diagnose before continuing.

**Step 4 — Export JSON files for the mobile app**
```
PYTHONIOENCODING=utf-8 python scripts/export_data.py
```
This reads from `fitness.duckdb` and writes updated JSON files to `mobile-app/public/data/`.

**Step 5 — Deploy the mobile app**
Follow the Deployment Workflow below (verify → deploy → commit → push).

# Development Workflow

- Always deploy changes to Vercel after completing development work. Do not leave changes undeployed.

# Deployment Workflow

- Deploy the mobile app from the `mobile-app/` folder, not from the repository root.
- Before deploying, run `npm run verify` inside `mobile-app/`. Do not deploy if lint or build is failing.
- Production deploy command: `npx vercel deploy --prod --yes --logs`
- If the Vercel project has not been bootstrapped with required environment variables yet, provide them at deploy time or configure them in the Vercel project first. Do not hardcode secrets into the repository.
- To inspect configured Vercel environments before deploy, use `npx vercel env ls` from `mobile-app/`.
- After deploying, validate the live site and authenticated routes rather than assuming success from the CLI output alone.
- After a successful production deploy, commit all changes to the `main` branch in git. Stage only the relevant source files (not build artifacts), write a concise commit message describing the work done, and push to origin.
- Current production URL: `https://mobile-app-five-pi.vercel.app`
