-- Remove the trigger that creates profiles on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove the function that handles new user creation
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Remove the foreign key constraint from profiles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change the profiles table to not depend on auth.users
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Remove RLS policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new RLS policies that allow all access
CREATE POLICY "Allow all access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Ensure there's a demo profile for Mr. Soriano
INSERT INTO public.profiles (id, first_name, last_name, preferred_title, email, school_name) 
VALUES (
  '9b4d6455-46aa-4102-92c9-d219353f6566'::uuid,
  'Kyle',
  'Soriano', 
  'Mr.',
  'kylesoriano05@g.ucla.edu',
  'Arcadia High School'
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  preferred_title = EXCLUDED.preferred_title,
  email = EXCLUDED.email,
  school_name = EXCLUDED.school_name;