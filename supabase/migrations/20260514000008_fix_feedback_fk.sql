-- Fix feedback foreign key to reference public.profiles instead of auth.users
-- This allows for easier joins in the Admin dashboard and better RLS consistency

-- First, delete feedback records with user_ids that don't exist in profiles
DELETE FROM public.feedback 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.feedback 
  DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;

ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- Ensure RLS policies are using the is_admin helper for consistency
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all feedback" ON public.feedback;
CREATE POLICY "Admins can update all feedback" ON public.feedback
  FOR UPDATE USING (public.is_admin(auth.uid()));
