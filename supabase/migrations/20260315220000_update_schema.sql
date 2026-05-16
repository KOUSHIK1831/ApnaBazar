-- Add missing columns to sellers table
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS contact_number text,
ADD COLUMN IF NOT EXISTS store_number text,
ADD COLUMN IF NOT EXISTS maps_url text;

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid default gen_random_uuid() primary key,
    buyer_id uuid references auth.users(id) on delete restrict,
    seller_id uuid references public.sellers(id) on delete restrict,
    product_id uuid references public.products(id) on delete restrict,
    quantity integer not null default 1,
    status text not null default 'pending',
    buyer_name text,
    buyer_phone text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own orders
CREATE POLICY "Buyers can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = buyer_id);

-- Sellers can read orders placed on their products
CREATE POLICY "Sellers can view orders for their products"
    ON public.orders FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.sellers WHERE id = orders.seller_id
    ));

-- Buyers can insert their own orders
CREATE POLICY "Buyers can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update order status
CREATE POLICY "Sellers can update order status"
    ON public.orders FOR UPDATE
    USING (auth.uid() IN (
        SELECT user_id FROM public.sellers WHERE id = orders.seller_id
    ));
