-- Create a table to store the game state
CREATE TABLE IF NOT EXISTS public.game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_challenge_id TEXT,
  is_active BOOLEAN DEFAULT false,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.game_state;
DROP POLICY IF EXISTS "Enable update for admins" ON public.game_state;

-- Create policy to allow public read access
CREATE POLICY "Enable read access for all users"
  ON public.game_state
  FOR SELECT
  USING (true);

-- Create policy to allow admins to update game state
CREATE POLICY "Enable update for admins"
  ON public.game_state
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

-- Create or replace the function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS handle_game_state_updated_at ON public.game_state;

-- Create the trigger to update the updated_at timestamp
CREATE TRIGGER handle_game_state_updated_at
BEFORE UPDATE ON public.game_state
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial game state if it doesn't exist
INSERT INTO public.game_state (id, is_active, created_at, updated_at)
SELECT '00000000-0000-0000-0000-000000000000', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.game_state WHERE id = '00000000-0000-0000-0000-000000000000');
