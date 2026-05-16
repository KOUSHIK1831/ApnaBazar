-- Ensure feedback insert policy is correct and allows sellers to submit
DROP POLICY IF EXISTS "Anyone authenticated can create feedback" ON public.feedback;
CREATE POLICY "Anyone authenticated can create feedback" ON public.feedback
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Ensure feedback select policy allows users to see their own feedback
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback" ON public.feedback
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.is_admin(auth.uid())
);

-- Ensure feedback update policy (for status/response) is limited to admins
DROP POLICY IF EXISTS "Admins can update all feedback" ON public.feedback;
CREATE POLICY "Admins can update all feedback" ON public.feedback
FOR UPDATE USING (public.is_admin(auth.uid()));

-- Explicitly grant permissions to authenticated users
GRANT INSERT, SELECT ON public.feedback TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.feedback TO authenticated; -- RLS will still filter rows

