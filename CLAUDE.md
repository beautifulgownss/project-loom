# Outreach Studio - AI-Powered Email Automation

> **Note**: The repository is named `project-loom`, but the product is branded as **Outreach Studio**.

## Overview
AI-powered email follow-up automation platform with Voice Studio for brand voice management.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS
- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL (Supabase) + SQLAlchemy 2.0
- **Auth**: Clerk or Supabase Auth (JWT)
- **Email**: Resend API (primary), Gmail API fallback
- **AI**: OpenAI API
- **Queue**: Redis (Upstash) for scheduled jobs
- **Monorepo**: pnpm + Turbo

## Project Structure
```
project-loom/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # FastAPI backend (port 8000)
├── packages/
│   ├── ui/           # Shared React components
│   ├── config/       # Shared configs (ESLint, TS)
│   └── shared/       # Shared utilities
└── infra/            # Infrastructure configs
```

## Development Commands
- `pnpm --filter apps/web dev` → Start Next.js frontend
- `cd apps/api && uvicorn main:app --reload` → Start FastAPI backend  
- `turbo run dev` → Start all apps concurrently
- `turbo run lint` → Lint all packages
- `turbo run build` → Build all packages

## Coding Conventions
- **TypeScript**: Strict mode enabled
- **Commits**: Conventional commits (feat:, fix:, docs:, chore:, test:)
- **Branches**: feature/description, fix/description
- **Python**: Pydantic v2 models, type hints required
- **React**: Functional components with hooks, no class components

## Current Features
Outreach Studio includes:
- **Voice Studio**: Create and manage multiple brand voices
- **AI Follow-Ups**: Generate intelligent follow-up emails
- **Sequences**: Build multi-step email campaigns
- **Analytics**: Track performance and reply rates
- **Reply Detection**: Auto-stop sequences on replies

## API Endpoints (FastAPI)
Base: `/v1`
- POST `/auth/token-exchange`
- POST `/accounts/email/connect`
- POST `/followups` - Create follow-up job
- GET `/followups` - List jobs
- POST `/ai/generate` - Generate draft

## Environment Variables
See `.env.example` files in apps/web and apps/api
Never commit actual .env files - use Doppler/1Password
