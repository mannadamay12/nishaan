# SPEC.md - nish.aan Product Specification

## 1. Product Vision

### Problem Statement
Bookmarks are scattered across multiple platforms (X/Twitter, LinkedIn, Instagram, Substack, YouTube, Reddit, browser bookmarks). Each platform has poor search, no organization, and no way to access saved content in one place.

### Solution
nish.aan is a unified bookmark manager that:
1. Collects links from any source (manual paste, text extraction, screenshot OCR)
2. Automatically fetches metadata (title, favicon, preview image)
3. Organizes with simple, flat color-coded groups
4. Provides instant search across all saved content
5. Feels fast through optimistic UI updates

### Target User
Power users who save a lot of content across platforms and want a single, fast, keyboard-driven interface to manage it all.

---

## 2. Features Specification

### 2.1 MVP Features (Phase 1)

#### 2.1.1 Authentication
- [ ] Magic link authentication (email)
- [ ] Google OAuth (optional)
- [ ] Protected routes - redirect to login if not authenticated
- [ ] Session persistence

#### 2.1.2 Bookmark Management
- [ ] **Add bookmark**: Paste URL → auto-fetch metadata
- [ ] **View bookmarks**: List view with favicon, title, URL, group indicator
- [ ] **Edit bookmark**: Modify title, description, URL, group assignment
- [ ] **Delete bookmark**: Soft delete with confirmation
- [ ] **Reorder bookmarks**: Drag and drop within groups

#### 2.1.3 Metadata Fetching
When a URL is added, automatically fetch:
- [ ] Page title (from `<title>` or `og:title`)
- [ ] Description (from `meta description` or `og:description`)
- [ ] Favicon (from `/favicon.ico` or `<link rel="icon">`)
- [ ] Preview image (from `og:image`)
- [ ] Site name (from `og:site_name`)

Fallback gracefully if metadata unavailable.

#### 2.1.4 Groups (Collections)
- [ ] Create group with name and color
- [ ] Assign bookmark to group (optional - can be ungrouped)
- [ ] Filter view by group
- [ ] Edit group (rename, change color)
- [ ] Delete group (bookmarks become ungrouped)
- [ ] Reorder groups via drag and drop

**Color palette for groups:**
```
Red: #ef4444
Orange: #f97316
Amber: #f59e0b
Yellow: #eab308
Lime: #84cc16
Green: #22c55e
Emerald: #10b981
Teal: #14b8a6
Cyan: #06b6d4
Sky: #0ea5e9
Blue: #3b82f6
Indigo: #6366f1
Violet: #8b5cf6
Purple: #a855f7
Fuchsia: #d946ef
Pink: #ec4899
```

#### 2.1.5 Search
- [ ] Global search via `Cmd/Ctrl + K`
- [ ] Search across: title, URL, description
- [ ] Filter as you type (client-side for speed)
- [ ] Highlight matching text in results
- [ ] Clear search to return to full list

#### 2.1.6 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search / focus input |
| `Cmd/Ctrl + N` | New bookmark (focus URL input) |
| `Escape` | Close modal / clear search |
| `Enter` | Submit / open selected |
| `↑ / ↓` | Navigate list |
| `Cmd/Ctrl + Backspace` | Delete selected bookmark |

---

### 2.2 Phase 2 Features

#### 2.2.1 AI Text Extraction
- [ ] Paste text blob containing multiple URLs
- [ ] AI extracts all valid URLs from text
- [ ] Preview extracted URLs before saving
- [ ] Batch save all extracted URLs

**Example input:**
```
Check out these articles I found:
https://example.com/article-1
Also this one example.com/no-protocol
And someone shared t.co/abc123 on Twitter
```

**Expected output:**
```
- https://example.com/article-1
- https://example.com/no-protocol
- https://t.co/abc123
```

#### 2.2.2 Screenshot URL Extraction
- [ ] Paste or upload screenshot
- [ ] AI vision extracts visible URLs from image
- [ ] Preview extracted URLs before saving
- [ ] Handle partial/truncated URLs gracefully

#### 2.2.3 Source Tracking
- [ ] Track where bookmark came from (manual, text extraction, screenshot, import)
- [ ] Display source indicator on bookmark
- [ ] Filter by source

#### 2.2.4 Browser Bookmark Import
- [ ] Import Chrome bookmarks HTML export
- [ ] Import Firefox bookmarks JSON
- [ ] Map browser folders to groups (optional)
- [ ] Deduplicate existing URLs

---

### 2.3 Phase 3 Features (Future)

#### 2.3.1 Browser Extension
- [ ] Chrome extension with popup
- [ ] One-click save current page
- [ ] Right-click context menu to save link
- [ ] Quick group assignment

#### 2.3.2 Full-Text Search
- [ ] Crawl and store page content
- [ ] Search within page content, not just metadata
- [ ] Semantic search with embeddings (stretch)

#### 2.3.3 Mobile PWA
- [ ] Progressive Web App
- [ ] Share sheet integration
- [ ] Offline support

#### 2.3.4 Platform Integrations
- [ ] Twitter/X API (save timeline likes)
- [ ] YouTube API (save watch later)
- [ ] Pocket import
- [ ] Raindrop import

---

## 3. Technical Specification

### 3.1 Database Schema

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Groups table
create table groups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#3b82f6',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint groups_name_length check (char_length(name) >= 1 and char_length(name) <= 100),
  constraint groups_color_format check (color ~* '^#[0-9a-f]{6}$')
);

-- Bookmarks table
create table bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text,
  description text,
  favicon_url text,
  preview_image_url text,
  site_name text,
  
  -- Organization
  group_id uuid references groups(id) on delete set null,
  tags text[] default '{}',
  sort_order integer default 0,
  
  -- Source tracking
  source text default 'manual', -- 'manual', 'text_extract', 'screenshot', 'import', 'extension'
  source_metadata jsonb default '{}',
  
  -- State
  is_archived boolean default false,
  is_favorite boolean default false,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint bookmarks_url_length check (char_length(url) >= 1 and char_length(url) <= 2048),
  constraint bookmarks_title_length check (title is null or char_length(title) <= 500)
);

-- Full-text content (Phase 3)
create table bookmark_content (
  id uuid primary key default uuid_generate_v4(),
  bookmark_id uuid references bookmarks(id) on delete cascade unique not null,
  content text,
  content_hash text, -- To detect changes
  crawled_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes for performance
create index bookmarks_user_id_idx on bookmarks(user_id);
create index bookmarks_group_id_idx on bookmarks(group_id);
create index bookmarks_created_at_idx on bookmarks(created_at desc);
create index bookmarks_url_idx on bookmarks(url);
create index groups_user_id_idx on groups(user_id);

-- Full-text search index
create index bookmarks_search_idx on bookmarks 
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || url));

-- Row Level Security
alter table groups enable row level security;
alter table bookmarks enable row level security;
alter table bookmark_content enable row level security;

-- RLS Policies: Users can only access their own data
create policy "Users can view own groups" on groups
  for select using (auth.uid() = user_id);
  
create policy "Users can insert own groups" on groups
  for insert with check (auth.uid() = user_id);
  
create policy "Users can update own groups" on groups
  for update using (auth.uid() = user_id);
  
create policy "Users can delete own groups" on groups
  for delete using (auth.uid() = user_id);

create policy "Users can view own bookmarks" on bookmarks
  for select using (auth.uid() = user_id);
  
create policy "Users can insert own bookmarks" on bookmarks
  for insert with check (auth.uid() = user_id);
  
create policy "Users can update own bookmarks" on bookmarks
  for update using (auth.uid() = user_id);
  
create policy "Users can delete own bookmarks" on bookmarks
  for delete using (auth.uid() = user_id);

create policy "Users can view own bookmark_content" on bookmark_content
  for select using (
    bookmark_id in (select id from bookmarks where user_id = auth.uid())
  );

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger groups_updated_at
  before update on groups
  for each row execute function update_updated_at();

create trigger bookmarks_updated_at
  before update on bookmarks
  for each row execute function update_updated_at();
```

### 3.2 API Specification

#### Bookmarks API

**GET /api/bookmarks**
```typescript
// Query params
interface GetBookmarksParams {
  group_id?: string;       // Filter by group
  source?: string;         // Filter by source
  search?: string;         // Search query
  archived?: boolean;      // Include archived
  limit?: number;          // Default 50
  offset?: number;         // Pagination
}

// Response
interface GetBookmarksResponse {
  bookmarks: Bookmark[];
  total: number;
  hasMore: boolean;
}
```

**POST /api/bookmarks**
```typescript
// Request body
interface CreateBookmarkRequest {
  url: string;
  group_id?: string;
  title?: string;          // Override auto-fetched
  description?: string;    // Override auto-fetched
  source?: string;
}

// Response: Created bookmark with fetched metadata
```

**PATCH /api/bookmarks/[id]**
```typescript
interface UpdateBookmarkRequest {
  url?: string;
  title?: string;
  description?: string;
  group_id?: string | null;
  is_archived?: boolean;
  is_favorite?: boolean;
  sort_order?: number;
}
```

**DELETE /api/bookmarks/[id]**
```typescript
// Returns 204 No Content
```

**POST /api/bookmarks/extract**
```typescript
// Request
interface ExtractRequest {
  text: string;            // Raw text containing URLs
}

// Response
interface ExtractResponse {
  urls: string[];          // Extracted and validated URLs
}
```

**POST /api/bookmarks/screenshot**
```typescript
// Request
interface ScreenshotExtractRequest {
  image: string;           // Base64 encoded image
}

// Response
interface ScreenshotExtractResponse {
  urls: string[];          // URLs found in image
}
```

#### Groups API

**GET /api/groups**
```typescript
// Response
interface GetGroupsResponse {
  groups: Group[];
}
```

**POST /api/groups**
```typescript
interface CreateGroupRequest {
  name: string;
  color: string;           // Hex color
}
```

**PATCH /api/groups/[id]**
```typescript
interface UpdateGroupRequest {
  name?: string;
  color?: string;
  sort_order?: number;
}
```

**DELETE /api/groups/[id]**
```typescript
// Returns 204 No Content
// Associated bookmarks become ungrouped (group_id = null)
```

#### Metadata API

**POST /api/metadata**
```typescript
// Request
interface MetadataRequest {
  url: string;
}

// Response
interface MetadataResponse {
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  preview_image_url: string | null;
  site_name: string | null;
}
```

### 3.3 TypeScript Types

```typescript
// src/types/index.ts

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  preview_image_url: string | null;
  site_name: string | null;
  group_id: string | null;
  tags: string[];
  sort_order: number;
  source: 'manual' | 'text_extract' | 'screenshot' | 'import' | 'extension';
  source_metadata: Record<string, unknown>;
  is_archived: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookmarkWithGroup extends Bookmark {
  group: Group | null;
}
```

### 3.4 Component Structure

```
components/
├── ui/                          # shadcn/ui primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── command.tsx              # For Cmd+K search
│   └── ...
├── bookmarks/
│   ├── bookmark-list.tsx        # Main list view
│   ├── bookmark-card.tsx        # Individual bookmark display
│   ├── bookmark-form.tsx        # Add/edit form
│   ├── bookmark-input.tsx       # URL input with paste handling
│   ├── bookmark-search.tsx      # Search interface
│   └── bookmark-actions.tsx     # Edit/delete actions
├── groups/
│   ├── group-list.tsx           # Sidebar group list
│   ├── group-selector.tsx       # Dropdown to assign group
│   ├── group-form.tsx           # Create/edit group
│   └── color-picker.tsx         # Group color selection
├── ai/
│   ├── text-extractor.tsx       # Text paste → URL extraction
│   └── screenshot-extractor.tsx # Image paste → URL extraction
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── main-layout.tsx
└── shared/
    ├── loading.tsx
    ├── empty-state.tsx
    └── error-boundary.tsx
```

### 3.5 AI Prompts

#### Text URL Extraction
```
You are a URL extraction assistant. Given a block of text, extract all valid URLs.

Rules:
1. Include URLs with or without protocol (add https:// if missing)
2. Handle shortened URLs (t.co, bit.ly, etc.)
3. Ignore email addresses
4. Ignore file paths that aren't URLs
5. Deduplicate results
6. Return as JSON array of strings

Text to analyze:
{input}

Return only a JSON array of URLs, no explanation:
```

#### Screenshot URL Extraction
```
Analyze this image and extract any URLs that are visible.

Rules:
1. Look for URLs in browser address bars, links, text
2. Include partial URLs if the domain is clear
3. Add https:// protocol if not visible
4. Ignore QR codes for now
5. Return as JSON array of strings

Return only a JSON array of URLs found, no explanation. If no URLs found, return [].
```

---

## 4. UI/UX Specification

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────┐  nish.aan                          [User] [⚙️]    │
│  │Logo │                                                    │
├──┴─────┴────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────────────────────────────────┐ │
│  │          │  │ ┌──────────────────────────────────────┐ │ │
│  │  Groups  │  │ │  [+] Paste URL or press ⌘K to search │ │ │
│  │          │  │ └──────────────────────────────────────┘ │ │
│  │ ● All    │  │                                          │ │
│  │ ○ Tech   │  │  ┌────────────────────────────────────┐  │ │
│  │ ○ Work   │  │  │ 🌐 Article Title                   │  │ │
│  │ ○ Read   │  │  │    example.com · Tech              │  │ │
│  │          │  │  └────────────────────────────────────┘  │ │
│  │ [+ New]  │  │  ┌────────────────────────────────────┐  │ │
│  │          │  │  │ 🌐 Another Bookmark                │  │ │
│  │          │  │  │    site.com · Work                 │  │ │
│  │          │  │  └────────────────────────────────────┘  │ │
│  │          │  │                                          │ │
│  └──────────┘  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Color Palette

```css
/* Base - Dark mode first */
--background: #0a0a0a;
--foreground: #fafafa;
--muted: #171717;
--muted-foreground: #a3a3a3;
--border: #262626;
--input: #262626;
--ring: #3b82f6;

/* Accent */
--primary: #fafafa;
--primary-foreground: #0a0a0a;

/* States */
--destructive: #ef4444;
--success: #22c55e;
```

### 4.3 Typography

```css
/* System font stack */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* Sizes */
--text-xs: 0.75rem;    /* 12px - metadata */
--text-sm: 0.875rem;   /* 14px - secondary */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.125rem;   /* 18px - titles */
--text-xl: 1.25rem;    /* 20px - headings */
```

### 4.4 Interactions

- **Hover**: Subtle background change (opacity 0.05)
- **Focus**: Blue ring (2px, ring color)
- **Active**: Scale down slightly (0.98)
- **Transitions**: 150ms ease-out for all

---

## 5. Development Phases

### Phase 1: MVP (2 weeks)
- [ ] Project setup (Next.js, Supabase, Tailwind, shadcn)
- [ ] Authentication (magic link)
- [ ] Bookmark CRUD with metadata fetching
- [ ] Groups CRUD
- [ ] Search functionality
- [ ] Keyboard shortcuts
- [ ] Basic responsive design

### Phase 2: AI Features (1 week)
- [ ] Text URL extraction
- [ ] Screenshot URL extraction
- [ ] Browser bookmark import

### Phase 3: Polish (1 week)
- [ ] Drag and drop reordering
- [ ] Animations and transitions
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Mobile optimization

### Future
- [ ] Browser extension
- [ ] Full-text search
- [ ] PWA + offline
- [ ] Platform integrations

---

## 6. Success Metrics

1. **Speed**: Add bookmark < 500ms perceived time
2. **Search**: Results appear < 100ms as typing
3. **Reliability**: 99.9% uptime, zero data loss
4. **Adoption**: Actually use it daily (dogfooding)