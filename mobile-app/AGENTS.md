<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mobile App Design Guardrails

- Preserve the green gradient and glassmorphism visual direction across the mobile app.
- Do not replace the current green-accented palette with unrelated themes unless explicitly requested.
- Keep activity and workout detail flows in pop-up or overlay surfaces rather than moving them into cramped inline layouts.
- Keep the month calendar mobile-first and minimal: date first, colored activity dots beneath, balanced spacing, and no extra text inside each day tile.
- For strength workouts, exercise rows should expand inline directly beneath the selected exercise row and collapse back into that row when toggled.
