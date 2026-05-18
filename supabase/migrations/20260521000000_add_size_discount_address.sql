-- Add size and discount fields to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS size text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- Add delivery address to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_address jsonb DEFAULT NULL;

-- delivery_address shape: { name, phone, line1, city, state, pincode }
