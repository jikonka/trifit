## Project Overview
TriFit: A web app that reads Garmin .FIT activity files, visualizes
performance data, generates AI-powered triathlon training plans,
and adapts schedules to real life.

## Tech Stack
- Frontend: Static HTML + Tailwind CSS (CDN) — hosted on GitHub Pages
- Backend Proxy: Node.js + Express — hosted on Render.com
- Database: Supabase (PostgreSQL + Auth + RLS)
- UI: Tailwind CSS + shadcn/ui
- Charts: Chart.js (CDN)
- AI: to be discussed later
- File Parsing: fit-file-parser

## Architecture
- Frontend (GitHub Pages): `index.html`, `analysis.html`, `upload.html`, `setup.html`
- Backend (Render.com): `server/` directory — proxies third-party API calls, keeps secrets server-side
- See docs/architecture.md (TODO: create after Milestone 3)

## Conventions
- All components in src/components/, grouped by feature
- All API routes in src/app/api/
- Database queries go through src/lib/db/ — never call Supabase directly from components
- Environment variables in `server/.env.local`, never committed
- `.env.example` files are committed (variable names only, no values)
- `.gitignore` must always include `.env.local`, `.env`, `.env.*.local`
- Commit messages: conventional commits (feat:, fix:, docs:, refactor:)
- **API Key Security**: API keys (e.g. OpenWeatherMap) are NEVER stored in frontend code, localStorage, or any client-accessible location. All third-party API keys are stored as environment variables on the backend server (Render.com). The frontend calls the backend proxy (`/api/weather`), which injects the API key server-side before forwarding requests to upstream APIs. The backend enforces CORS whitelisting, rate limiting, input validation, and security headers (Helmet). No API key is ever transmitted to or visible in the browser.
- **Weather-Aware Training**: Weather data from OpenWeatherMap API is displayed on the Dashboard (fetched via backend proxy). When rain is detected, the training plan logic checks the user's equipment profile (indoor trainer / treadmill). If the user has an indoor bike trainer, cycling can proceed indoors on rainy days; if they have a treadmill, running can proceed indoors. Otherwise, outdoor bike and run sessions are flagged with a rain warning suggesting an indoor alternative or rest day.
- **XSS Prevention**: Never use `innerHTML` with user-generated content. Use `textContent` or DOM API (`createElement` / `appendChild`) to inject user input into the page.

## Current Status
- [ ] M0: Environment setup 
- [ ] M1: Landing Page + Prompt skills ← YOU ARE HERE
- [ ] M2: API integration (weather)
- [ ] M3: Backend + Auth + Database
- [ ] M4: Data visualization (Dashboard)
- [ ] M5: .FIT file parsing
- [ ] M6: AI training plan + Coach chat
- [ ] M7: Polish + Deploy + Monitor
- [ ] M8: Retrospective + Playbook