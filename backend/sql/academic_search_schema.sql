-- Academic Search Engine schema for Supabase/PostgreSQL
-- Includes schema, fuzzy-search indexes, RLS policies, and auth signup trigger.

BEGIN;

-- Required for UUID generation and trigram search.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Role enum for profile access control.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('staff', 'student');
  END IF;
END $$;

-- 1) Profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'student'
);

-- 2) Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) Metadata table
CREATE TABLE IF NOT EXISTS public.metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  course_code TEXT NOT NULL,
  level INT NOT NULL,
  programming_language TEXT,
  content_snippet TEXT
);

-- 4) Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful relational indexes
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON public.documents (uploader_id);
CREATE INDEX IF NOT EXISTS idx_metadata_doc_id ON public.metadata (doc_id);
CREATE INDEX IF NOT EXISTS idx_comments_doc_id ON public.comments (doc_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments (user_id);

-- Search optimization with trigram GIN indexes for typo-tolerant search.
CREATE INDEX IF NOT EXISTS idx_metadata_title_trgm
  ON public.metadata USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_metadata_content_snippet_trgm
  ON public.metadata USING GIN (content_snippet gin_trgm_ops);

-- Optional combined FTS index for faster keyword querying.
CREATE INDEX IF NOT EXISTS idx_metadata_fts
  ON public.metadata
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_snippet, '')));

-- ---------------------------
-- Row Level Security (RLS)
-- ---------------------------
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read documents.
DROP POLICY IF EXISTS documents_select_all ON public.documents;
CREATE POLICY documents_select_all
  ON public.documents
  FOR SELECT
  TO public
  USING (true);

-- Allow inserts only for users whose profile role is 'staff'.
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

-- ----------------------------------------------------
-- Requested Supabase registration function + trigger
-- ----------------------------------------------------

-- 1. Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if the email ends with the OAU domain
  IF (NEW.email LIKE '%@oauife.edu.ng') THEN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'staff');
  ELSE
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'student');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger that runs every time a new user signs up in Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMIT;
