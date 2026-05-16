-- Add seller_id and admin_response to feedback table
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Enable realtime for feedback status updates for sellers
-- (Already enabled in previous migration, but ensuring it's clear)

-- Update RLS to allow users to view their feedback including admin responses
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback" ON public.feedback
FOR SELECT USING (user_id = auth.uid());
