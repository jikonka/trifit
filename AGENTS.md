## Project Overview
TriFit: A web app that reads Garmin .FIT activity files, visualizes
performance data, generates AI-powered triathlon training plans,
and adapts schedules to real life.

## Tech Stack
- Framework: Next.js 14 (App Router)
- Database: Supabase (PostgreSQL + Auth + RLS)
- UI: Tailwind CSS + shadcn/ui
- Charts: Recharts
- AI: to be discussed later
- File Parsing: fit-file-parser

## Architecture
See docs/architecture.md (TODO: create after Milestone 3)

## Conventions
- All components in src/components/, grouped by feature
- All API routes in src/app/api/
- Database queries go through src/lib/db/ — never call Supabase directly from components
- Environment variables in .env.local, never committed
- Commit messages: conventional commits (feat:, fix:, docs:, refactor:)

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