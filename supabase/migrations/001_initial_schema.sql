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
  content_hash text,
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
