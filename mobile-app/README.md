## AI Trainer Mobile App

Mobile-first personal fitness app built with Next.js, TypeScript, Tailwind, and shadcn/ui.

## What It Does

- Single-user login to protect personal data
- Monthly calendar view with colored activity indicators
- Year heatmap view for activity consistency
- Day drill-down to individual workouts
- Workout detail cards with cardio metrics or strength exercise breakdown
- Light and dark mode

## Local Development

From this folder:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Default local credentials come from `.env.local`:

- Username: `admin`
- Password: `changeme`

## Data Refresh

The app deploys static JSON snapshots under `public/data`. Refresh them from the repository root:

```bash
python scripts/export_data.py
```

That command exports:

- `activity_log.json`
- `cardio_efficiency.json`
- `strength_progression.json`
- `workout_details.json`

## Verification

Run the full local verification before deploying:

```bash
npm run verify
```

## Vercel Deployment

When creating the Vercel project:

1. Import the repository.
2. Set the project Root Directory to `mobile-app`.
3. Add these environment variables:
	- `APP_USERNAME`
	- `APP_PASSWORD`
	- `JWT_SECRET`
4. Deploy.

Important: whenever data changes, rerun `python scripts/export_data.py`, commit the updated files in `public/data`, and redeploy.
