-- Upsert (Create profile for olawaleakinbileje@pg-student.oauife.edu.ng
-- Creates profile even if it doesn't exist yet, and mark as staff!
-- Run this in your Supabase SQL Editor

-- First, let's find the user ID from auth.users
-- (replace with your email if you can manually create profiles profile first get the your email:

-- Upsert (Create the the profile even it doesn't exist then mark as staff!

-- 1. Get the your user ID from auth.users
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
  -- If profile already exists, just update to staff status!
DO UPDATE SET
  role = 'staff',
  status = 'active',
  is_staff_verified = TRUE;

-- Verify the change!
SELECT id, email, full_name, role, status, is_staff_verified 
FROM public.profiles 
WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng';
UNION ALL
SELECT id, email, null, null, null, null
FROM auth.users
WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng'
AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.users.id);

