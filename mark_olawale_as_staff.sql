-- Mark olawaleakinbileje@pg-student.oauife.edu.ng as verified staff
-- Run this in your Supabase SQL Editor

UPDATE public.profiles
SET 
  role = 'staff',
  status = 'active',
  is_staff_verified = TRUE
WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng';

-- Verify the change:
SELECT id, email, full_name, role, status, is_staff_verified 
FROM public.profiles 
WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng';

