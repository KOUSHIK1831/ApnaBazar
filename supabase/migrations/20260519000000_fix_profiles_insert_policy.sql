-- Fix 1: Allow users to insert their own profile row (needed for client-side upsert in signUp)
DROP POLICY IF EXISTS "user_insert_own_profile" ON public.profiles;
CREATE POLICY "user_insert_own_profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix 2: Fix the trigger to use the role from user metadata instead of hardcoding 'seller'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'koushukbanuri2005@gmail.com' THEN 'admin'::user_role
      ELSE COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'seller'::user_role)
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
