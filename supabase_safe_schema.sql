-- Safe version: Drops existing tables/constraints first before recreating
-- Run this in your Supabase SQL Editor

BEGIN;

-- Drop existing tables in reverse order to avoid foreign key conflicts
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.metadata CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Role enum
CREATE TYPE public.user_role AS ENUM ('staff', 'student');

-- 1) Profiles table linked to Supabase auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'student',
  status TEXT NOT NULL DEFAULT 'active',
  is_staff_verified BOOLEAN NOT NULL DEFAULT FALSE,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) Metadata table
CREATE TABLE public.metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  course_code TEXT NOT NULL,
  level INT NOT NULL,
  programming_language TEXT,
  content_snippet TEXT
);

-- 4) Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON public.documents (uploader_id);
CREATE INDEX IF NOT EXISTS idx_metadata_doc_id ON public.metadata (doc_id);
CREATE INDEX IF NOT EXISTS idx_comments_doc_id ON public.comments (doc_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments (user_id);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_metadata_title_trgm
  ON public.metadata USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_metadata_content_snippet_trgm
  ON public.metadata USING GIN (content_snippet gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_metadata_fts
  ON public.metadata
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_snippet, '')));

-- Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_select_all ON public.documents;
CREATE POLICY documents_select_all
  ON public.documents
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS documents_insert_staff_only ON public.documents;
CREATE POLICY documents_insert_staff_only
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploader_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'staff'
    )
  );

COMMIT;

