-- Simple version: Create or update profile for olawaleakinbileje@pg-student.oauife.edu.ng
-- Run this in your Supabase SQL Editor

-- First: Check if user exists in auth.users
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

-- Verify the change
SELECT id, email, full_name, role, status, is_staff_verified 
FROM public.profiles 
WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng';

