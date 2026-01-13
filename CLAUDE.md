# CLAUDE.md - nish.aan

## Project Overview

**nish.aan** (निशान - "marker" in Hindi) is a personal bookmark manager that unifies saved content from across the web. Built because bookmarks are scattered across LinkedIn, X, Instagram, Substack, YouTube, and browser bookmarks - making them impossible to search or organize.

## Current Status

### Phase 1: MVP ✅ Complete
- [x] Magic link authentication
- [x] Protected routes with middleware
- [x] Bookmark CRUD (create, read, update, delete)
- [x] Auto metadata fetching (title, description, favicon, og:image)
- [x] Groups CRUD with color picker
- [x] Filter bookmarks by group
- [x] Favorites (toggle and display)
- [x] Global search (`Cmd+F`)
- [x] Optimistic UI updates

### Phase 2: AI Features ✅ Complete
- [x] Text URL extraction (paste text → extract URLs via Gemini)
- [x] Screenshot URL extraction (paste image → OCR → extract URLs via Gemini)

### Phase 3: Polish ✅ Complete
- [x] Drag-drop reorder (bookmarks and groups)
- [x] Search match highlighting
- [x] Animated icons (lucide-animated)

### Phase 4: Next
- [ ] TBD

## Philosophy

- **Fast** - Optimistic UI, instant feedback, no spinners
- **Keyboard-first** - Power users shouldn't reach for the mouse
- **Clean** - Minimal design, no clutter, no engagement tricks
- **Smart** - AI extracts links from text blobs and screenshots
- **Personal** - No social features, no tracking, just your stuff

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Server Components) |
| Database | Supabase (Postgres + Auth + RLS + Storage) |
| AI | Vercel AI SDK + Google Gemini 2.5 Flash |
| Styling | Tailwind CSS + shadcn/ui |
| Hosting | Vercel |

## Project Structure

```
nishaan/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, signup)
│   │   ├── (dashboard)/        # Main app routes
│   │   ├── api/                # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── bookmarks/          # Bookmark-specific components
│   │   ├── groups/             # Group management components
│   │   └── shared/             # Shared/common components
│   ├── lib/
│   │   ├── supabase/           # Supabase client & helpers
│   │   ├── ai/                 # AI extraction utilities
│   │   ├── metadata/           # URL metadata fetching
│   │   └── utils.ts            # General utilities
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── styles/                 # Global styles
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed.sql                # Seed data
├── public/                     # Static assets
└── tests/                      # Test files
```

## Key Commands

```bash
# Development
bun dev                     # Start dev server (localhost:3000)
bun run build               # Production build
bun run lint                # ESLint

# Testing
bun test                    # Unit tests (vitest)
bun run test:e2e            # E2E tests (playwright)
bun run test:all            # Both unit + e2e

# Database
bunx supabase start         # Start local Supabase
bunx supabase db push       # Push migrations
bunx supabase gen types ts  # Generate TypeScript types
```

## Database Schema

Core tables (see spec.md for full schema):
- `bookmarks` - Main bookmark entries
- `groups` - Color-coded collections (flat, not nested)
- `bookmark_content` - Full-text content for search (future)

All tables use Row Level Security (RLS) - users can only access their own data.

## Server Actions & API Routes

### Server Actions (src/app/actions/)
| Action | Purpose |
|--------|---------|
| `auth.ts` | signInWithMagicLink, signOut |
| `bookmarks.ts` | getBookmarks, createBookmark, updateBookmark, deleteBookmark, toggleFavorite |
| `groups.ts` | getGroups, createGroup, updateGroup, deleteGroup |

### API Routes (src/app/api/)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/metadata` | POST | Fetch URL metadata |
| `/api/bookmarks/extract` | POST | AI extract URLs from text (Phase 2) |
| `/api/bookmarks/screenshot` | POST | AI extract URLs from image (Phase 2) |

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=    # For Gemini
```

## Code Patterns

### Optimistic UI Updates
Always update UI immediately, then sync to database:
```typescript
// 1. Update local state immediately
setBookmarks(prev => [...prev, optimisticBookmark])
// 2. Persist to database
const result = await createBookmark(data)
// 3. Replace optimistic with real data (or rollback on error)
```

### Server Components by Default
Use Server Components unless you need:
- Event handlers (onClick, onChange)
- useState, useEffect
- Browser APIs

### Supabase Client Usage
- Server Components: Use `createServerClient()`
- Client Components: Use `createBrowserClient()`
- API Routes: Use `createRouteHandlerClient()`

## Design Guidelines

- **Colors**: Muted grays, neutral palette, accent colors only for groups
- **Typography**: System fonts (`font-sans`), clean hierarchy
- **Spacing**: Generous whitespace, breathable layouts
- **Interactions**: Subtle hover states, smooth transitions (150-200ms)
- **Mobile**: Touch-friendly targets (min 44px), vertical stacking

## AI Integration Notes

### Text Extraction
- Input: Raw text blob (notes, copied content)
- Output: Array of valid URLs found in text
- Model: Gemini 2.5 Flash (fast, cheap)
- Prompt should handle malformed URLs, duplicates

### Screenshot Extraction  
- Input: Base64 image or image URL
- Output: Array of URLs visible in image
- Use vision capabilities to OCR then extract
- Handle partial URLs, QR codes (stretch goal)

## Testing Approach

- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical flows (save bookmark, search)
- Use Playwright for E2E

## Common Tasks

### Adding a new shadcn/ui component
```bash
bunx shadcn@latest add [component-name]
```

### Creating a new migration
```bash
bunx supabase migration new [migration-name]
```

### Generating types after schema change
```bash
bunx supabase gen types typescript --local > src/types/database.ts
```

## Known Constraints

1. **No nested folders** - Groups are flat by design
2. **No collaboration** - Single-user only
3. **No browser extension yet** - Web-first MVP
4. **Platform API limits** - Most social platforms don't allow bookmark export via API

## Reference Links

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)