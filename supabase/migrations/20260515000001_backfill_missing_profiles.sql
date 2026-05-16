-- Backfill missing profiles for users who don't have them
INSERT INTO public.profiles (id, email, role, created_at)
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email = 'koushukbanuri2005@gmail.com' THEN 'admin'::user_role
    ELSE COALESCE((au.raw_user_meta_data->>'role')::user_role, 'seller'::user_role)
  END,
  au.created_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Also update the feedback table to ensure all feedback has valid user_ids
DELETE FROM public.feedback 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Make sure the foreign key constraint is properly set
ALTER TABLE public.feedback
DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

ALTER TABLE public.feedback
ADD CONSTRAINT feedback_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
