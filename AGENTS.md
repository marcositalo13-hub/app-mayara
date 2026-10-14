<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

- UI text in pt-BR; code and identifiers in English.
- Colors, radii and shadows only via tokens in `src/app/globals.css`; no hardcoded colors in components.
- Body text ≥ 16px; touch targets ≥ 48px; mobile-first — the installed iPhone PWA is the primary device.
- Animations: transform/opacity only, ≤ 300ms, purposeful. Exceptions (requested): `CelebrationBurst`, the exercise illustration crossfade loop and the water bottle wave. Always respect `prefers-reduced-motion` (loops become static).
- Cache Components is enabled: any per-day or per-user data must be rendered dynamically (inside `<Suspense>` / request-time APIs), never prerendered.
- Plan content (meals, swaps, workouts, targets) lives in the database, not in code.
- Derived values (totals, averages, next workout, load suggestion) are computed, never typed by the user.
- Health data minimization: no photos, exam results or clinical notes stored in the app.
- Navigation: bottom tabs Dieta (`/`, also the PWA start_url), Água (`/agua`), Treino (`/treino`); a 4th tab "Metas" is planned. Authenticated pages live in `src/app/(app)/`, whose layout renders the shared header (greeting, date, week, "Sair") and the `BottomNav`; `/entrar` stays outside it. Each tab owns its data (no duplicated entry points: the next workout lives only in Treino).
- Use the skills `emil-design-eng`, `mobile-native`, `apple-design`, `animate`, `ask-sonner` for UI work.
