-- Enhance feedback RLS and enable more realtime tables

-- Update feedback insert policy to be more restrictive
DROP POLICY IF EXISTS "Anyone authenticated can create feedback" ON public.feedback;
CREATE POLICY "Anyone authenticated can create feedback" ON public.feedback
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  (user_id IS NULL OR user_id = auth.uid())
);

-- Allow users to view their own feedback
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback" ON public.feedback
FOR SELECT USING (user_id = auth.uid());

-- Enable realtime for more tables to keep Admin dashboard live
ALTER publication supabase_realtime ADD TABLE public.profiles;
ALTER publication supabase_realtime ADD TABLE public.sellers;
ALTER publication supabase_realtime ADD TABLE public.products;

-- Note: orders and feedback are already in the publication from previous migrations
