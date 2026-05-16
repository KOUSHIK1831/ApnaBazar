-- Add Admin policies for Sellers
CREATE POLICY "Admin can do everything with sellers" ON public.sellers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add Admin policies for Products
CREATE POLICY "Admin can do everything with products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add Admin policies for Orders
CREATE POLICY "Admin can do everything with orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add Admin policies for Files
CREATE POLICY "Admin can do everything with files" ON public.files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
