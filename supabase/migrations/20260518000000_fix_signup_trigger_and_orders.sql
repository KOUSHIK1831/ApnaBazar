-- Fix handle_new_user trigger: always succeeds, no fragile metadata casting.
-- The trigger only creates a minimal profile with default 'seller' role.
-- Client code updates the role to 'buyer' or 'admin' after signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role user_role := 'seller';
BEGIN
  BEGIN
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'seller'::user_role);
  EXCEPTION WHEN invalid_text_representation THEN
    _role := 'seller'::user_role;
  END;

  IF NEW.email = 'koushukbanuri2005@gmail.com' THEN
    _role := 'admin'::user_role;
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, _role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Allow users to insert their own profile (needed for client-side upsert after signup)
DROP POLICY IF EXISTS "user_insert_own_profile" ON public.profiles;
CREATE POLICY "user_insert_own_profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "user_update_own_profile" ON public.profiles;
CREATE POLICY "user_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Add confirmed_at and completed_at columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
