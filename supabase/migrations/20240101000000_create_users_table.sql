-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Create policy to allow users to view their own data
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text::uuid = id);

-- Create policy to allow admins to view all users
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid()::text::uuid
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text::uuid = id)
  WITH CHECK (auth.uid()::text::uuid = id);

-- Create policy to allow admins to update any user
CREATE POLICY "Admins can update any user"
  ON public.users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid()::text::uuid
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid()::text::uuid
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, access_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'access_code'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to handle new user signups
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to login with username and access code
CREATE OR REPLACE FUNCTION public.login_with_username(
  p_username TEXT,
  p_access_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  result JSONB;
BEGIN
  -- Find the user by username and access code
  SELECT u.*, a.email
  INTO user_record
  FROM public.users u
  JOIN auth.users a ON u.id = a.id
  WHERE u.username = p_username 
  AND u.access_code = p_access_code;
  
  IF user_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid username or access code');
  END IF;
  
  -- Generate a JWT token
  SELECT 
    sign(
      jsonb_build_object(
        'role', 'authenticated',
        'user_id', user_record.id,
        'exp', extract(epoch from now() + interval '1 day')
      )::jsonb,
      current_setting('app.settings.jwt_secret')
    ) INTO result;
    
  RETURN jsonb_build_object('token', result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
