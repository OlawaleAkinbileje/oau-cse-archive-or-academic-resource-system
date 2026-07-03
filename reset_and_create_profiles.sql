-- Step 1: DROP existing profiles table (and all dependencies)
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.metadata CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Step 2: Create the user_role enum
CREATE TYPE public.user_role AS ENUM ('staff', 'student');

-- Step 3: Create profiles table EXACTLY as backend expects!
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  status TEXT NOT NULL DEFAULT 'active',
  is_staff_verified BOOLEAN NOT NULL DEFAULT FALSE,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Create index on email and id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles (id);

-- Step 5: Insert/Update Olawale's profile as staff!
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng'
)
INSERT INTO public.profiles (id, email, full_name, role, status, is_staff_verified)
SELECT 
  id, 
  'olawaleakinbileje@pg-student.oauife.edu.ng',
  'Olawale Akinbileje', 
  'staff', 
  'active', 
  TRUE
FROM user_info
ON CONFLICT (id) 
DO UPDATE SET
  role = 'staff',
  status = 'active',
  is_staff_verified = TRUE;

-- Verify it worked!
SELECT * FROM public.profiles;

