-- Migration: Security Hardening and Performance Optimization
-- Date: 2026-01-13
-- Purpose: Add missing RLS policies for bookmark_content table and performance indexes

-- ============================================================================
-- PART 1: Missing RLS Policies for bookmark_content table
-- ============================================================================
-- Currently only SELECT policy exists. Adding INSERT, UPDATE, DELETE policies
-- to ensure complete user isolation at the database level.

create policy "Users can insert own bookmark_content" on bookmark_content
  for insert with check (
    bookmark_id in (select id from bookmarks where user_id = auth.uid())
  );

create policy "Users can update own bookmark_content" on bookmark_content
  for update using (
    bookmark_id in (select id from bookmarks where user_id = auth.uid())
  );

create policy "Users can delete own bookmark_content" on bookmark_content
  for delete using (
    bookmark_id in (select id from bookmarks where user_id = auth.uid())
  );

-- ============================================================================
-- PART 2: Performance Indexes for Sort Operations
-- ============================================================================
-- The sort_order column is used in ORDER BY queries for drag-drop reordering.
-- Without indexes, these queries perform sequential scans as data grows.

create index if not exists bookmarks_sort_order_idx on bookmarks(sort_order);
create index if not exists groups_sort_order_idx on groups(sort_order);

-- ============================================================================
-- PART 3: Foreign Key Index Optimization
-- ============================================================================
-- Index on bookmark_content.bookmark_id improves JOIN and cascade delete performance.

create index if not exists bookmark_content_bookmark_id_idx on bookmark_content(bookmark_id);

-- ============================================================================
-- PART 4: Optional Tag Filtering Indexes (Commented Out - Evaluate After Testing)
-- ============================================================================
-- Uncomment these if tag filtering becomes slow with large datasets (1000+ bookmarks)

-- GIN index for array operations on tags column
-- create index if not exists bookmarks_tags_idx on bookmarks using gin(tags);

-- Partial index for favorites filtering
-- create index if not exists bookmarks_is_favorite_idx on bookmarks(is_favorite)
--   where is_favorite = true;

-- Composite index for archive queries
-- create index if not exists bookmarks_user_archived_idx on bookmarks(user_id, is_archived);
