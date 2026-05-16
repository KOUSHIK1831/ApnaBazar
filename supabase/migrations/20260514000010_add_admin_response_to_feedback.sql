-- Add admin_response and seller_id columns to feedback table
ALTER TABLE public.feedback 
  ADD COLUMN IF NOT EXISTS admin_response TEXT;

ALTER TABLE public.feedback 
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;

-- Update RLS policy to allow admins to update admin_response
DROP POLICY IF EXISTS "Admins can update all feedback" ON public.feedback;
CREATE POLICY "Admins can update all feedback" ON public.feedback
  FOR UPDATE USING (public.is_admin(auth.uid()));
