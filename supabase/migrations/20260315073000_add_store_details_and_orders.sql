-- Add new columns to sellers table
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS store_number TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  buyer_name TEXT,
  buyer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Sellers can view their orders"
  ON public.orders FOR SELECT
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Buyers can view their own orders"
  ON public.orders FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
