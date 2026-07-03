-- To mark your account as staff (verified staff in Supabase
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles
SET
  role = 'staff',
  status = 'active',
  is_staff_verified = true
WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng';

-- To verify the change
SELECT * FROM profiles WHERE email = 'olawaleakinbileje@pg-student.oauife.edu.ng';
