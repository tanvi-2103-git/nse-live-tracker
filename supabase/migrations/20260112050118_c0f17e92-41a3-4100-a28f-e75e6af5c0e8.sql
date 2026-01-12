-- Remove email column from profiles table to prevent PII leakage
-- Email should only be stored in auth.users (accessible via user.email)

-- Drop the email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update the handle_new_user function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;