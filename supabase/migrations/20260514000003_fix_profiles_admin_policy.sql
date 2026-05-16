-- Helper function to safely check admin role without re-triggering RLS on profiles
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = $1 AND role = 'admin');
$$;

-- Replace admin policies to call the helper function to avoid recursion in policy evaluation
-- Sellers
DROP POLICY IF EXISTS "Admin can do everything with sellers" ON public.sellers;
CREATE POLICY "Admin can do everything with sellers" ON public.sellers
  FOR ALL USING (public.is_admin(auth.uid()));

-- Products
DROP POLICY IF EXISTS "Admin can do everything with products" ON public.products;
CREATE POLICY "Admin can do everything with products" ON public.products
  FOR ALL USING (public.is_admin(auth.uid()));

-- Orders
DROP POLICY IF EXISTS "Admin can do everything with orders" ON public.orders;
CREATE POLICY "Admin can do everything with orders" ON public.orders
  FOR ALL USING (public.is_admin(auth.uid()));

-- Files
DROP POLICY IF EXISTS "Admin can do everything with files" ON public.files;
CREATE POLICY "Admin can do everything with files" ON public.files
  FOR ALL USING (public.is_admin(auth.uid()));

-- Profiles: allow admins to read all profiles using the helper
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));
