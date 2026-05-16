-- Restrict order creation to only users with the 'buyer' role
-- Admins are already allowed by their 'FOR ALL' policy in 20260514000003_fix_profiles_admin_policy.sql

DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

CREATE POLICY "Only buyers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'buyer')
  );

-- Also ensure buyers cannot view seller dashboard (already handled by app but good to have DB layer check)
-- Actually, profiles RLS already restricts reading profiles.
