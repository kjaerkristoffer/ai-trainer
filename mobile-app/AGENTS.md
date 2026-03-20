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

# Development Workflow

- Always deploy changes to Vercel after completing development work. Do not leave changes undeployed.

# Deployment Workflow

- Deploy the mobile app from the `mobile-app/` folder, not from the repository root.
- Before deploying, run `npm run verify` inside `mobile-app/`. Do not deploy if lint or build is failing.
- Production deploy command: `npx vercel deploy --prod --yes --logs`
- If the Vercel project has not been bootstrapped with required environment variables yet, provide them at deploy time or configure them in the Vercel project first. Do not hardcode secrets into the repository.
- To inspect configured Vercel environments before deploy, use `npx vercel env ls` from `mobile-app/`.
- After deploying, validate the live site and authenticated routes rather than assuming success from the CLI output alone.
- Current production URL: `https://mobile-app-five-pi.vercel.app`
