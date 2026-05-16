-- Add status to sellers
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked'));

-- Add is_blocked to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Update RLS policies to restrict blocked sellers/users

-- Anyone can only view sellers that are NOT blocked
DROP POLICY IF EXISTS "Anyone can view sellers by slug" ON public.sellers;
CREATE POLICY "Anyone can view sellers by slug" ON public.sellers 
FOR SELECT USING (store_slug IS NOT NULL AND status = 'active');

-- Anyone can only view products from active sellers
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products 
FOR SELECT USING (seller_id IN (SELECT id FROM public.sellers WHERE status = 'active'));

-- Admins can view everything regardless of status
CREATE POLICY "Admins can view all sellers" ON public.sellers
FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update all sellers" ON public.sellers
FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can view all products" ON public.products
FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update all products" ON public.products
FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
