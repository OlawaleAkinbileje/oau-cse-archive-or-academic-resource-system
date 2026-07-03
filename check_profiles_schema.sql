-- First get the actual column structure of public.profiles
-- Run this first in Supabase SQL Editor

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check what users are in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng';

-- Also check if profile exists already
SELECT * FROM public.profiles;

