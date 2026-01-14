# nish.aan

Personal bookmark manager that unifies saved content from across the web.

## Quick Start

```bash
# Install dependencies
bun install

# Setup environment
cp .env.local.example .env.local
# Add your Supabase and Gemini API keys

# Start local Supabase
bunx supabase start

# Run development server
bun dev
```

Visit [localhost:3000](http://localhost:3000)

## Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Database**: Supabase (Postgres + Auth + RLS)
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Features

- Magic link authentication
- AI URL extraction from text and screenshots
- Drag-drop reordering
- Offline-first PWA
- Search with highlighting
- Groups and tags
- Archive and bulk actions
- Share Target API (Android)

## Commands

```bash
bun dev              # Development server
bun run build        # Production build
bun run lint         # Lint code

bunx supabase start  # Start local DB
bunx supabase db push    # Apply migrations
```

## Documentation

- **CLAUDE.md**: Full developer documentation
- **DEPLOYMENT.md**: Production deployment guide
- **spec.md**: Database schema and architecture

## Philosophy

Fast, keyboard-first, clean, smart, personal, mobile-first.
