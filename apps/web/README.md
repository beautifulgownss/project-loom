# Project Loom - Web Frontend

Next.js 14 frontend for Project Loom's AI-powered email follow-up automation.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Linting**: ESLint with Next.js config

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Development

From the project root:

```bash
# Install dependencies (if not already done)
pnpm install

# Start dev server (runs on port 3000)
pnpm --filter @project-loom/web dev
```

Or from this directory:

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Build

```bash
# From project root
pnpm --filter @project-loom/web build

# Or from this directory
pnpm build
```

### Lint

```bash
pnpm lint
```

## Project Structure

```
apps/web/
├── app/                 # App Router pages and layouts
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles with Tailwind
├── public/             # Static assets
├── .env.example        # Environment variables template
├── next.config.js      # Next.js configuration
├── tailwind.config.ts  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000/v1)
- Auth provider keys (Clerk or Supabase)

## Coding Standards

- Use functional components with React hooks
- Strict TypeScript mode enabled
- Follow conventional commits (feat:, fix:, docs:, etc.)
- Use Tailwind utility classes for styling
- Import paths use `@/*` alias for root-level imports
