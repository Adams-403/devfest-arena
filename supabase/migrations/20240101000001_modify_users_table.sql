-- First, create a new sequence for the auto-incrementing ID
CREATE SEQUENCE IF NOT EXISTS public.users_id_seq;

-- Create a new table with the desired structure
CREATE TABLE public.users_new (
  id BIGINT PRIMARY KEY DEFAULT nextval('public.users_id_seq'),
  username TEXT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy data from the old table to the new one
-- This will generate new sequential IDs
INSERT INTO public.users_new (username, access_code, score, created_at, updated_at)
SELECT username, access_code, score, created_at, updated_at
FROM public.users;

-- Drop the old table
DROP TABLE public.users CASCADE;

-- Rename the new table to the original name
ALTER TABLE public.users_new RENAME TO users;

-- Recreate indexes and constraints
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

-- Recreate policies
CREATE POLICY "Enable read access for all users"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON public.users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
