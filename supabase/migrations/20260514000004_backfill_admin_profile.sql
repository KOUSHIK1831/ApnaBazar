-- Backfill admin role for existing auth user (if present)
-- This helps when the user was created before trigger/email-role mapping updates.
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'::user_role
FROM auth.users
WHERE lower(email) = 'koushukbanuri2005@gmail.com'
ON CONFLICT (id)
DO UPDATE SET
  email = EXCLUDED.email,
  role = 'admin'::user_role,
  updated_at = NOW();
