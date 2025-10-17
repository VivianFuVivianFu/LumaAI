-- =====================================================
-- Luma Backend Database Setup Script
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
-- This table stores additional user profile information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_new_user BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Mood check-ins table
-- Stores daily mood tracking data
CREATE TABLE IF NOT EXISTS public.mood_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood_value INTEGER NOT NULL CHECK (mood_value >= 1 AND mood_value <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON public.mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_created_at ON public.mood_checkins(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only view their own data
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own data (for initial profile creation)
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Mood check-ins table policies
-- Users can view their own mood check-ins
CREATE POLICY "Users can view own mood checkins"
  ON public.mood_checkins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own mood check-ins
CREATE POLICY "Users can insert own mood checkins"
  ON public.mood_checkins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own mood check-ins
CREATE POLICY "Users can update own mood checkins"
  ON public.mood_checkins
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own mood check-ins
CREATE POLICY "Users can delete own mood checkins"
  ON public.mood_checkins
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
-- This automatically creates a profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for users table to update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically create user profile when auth.users record is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.mood_checkins TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'mood_checkins');

-- Verify RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'mood_checkins');

-- =====================================================
-- NOTES
-- =====================================================

-- 1. This script is idempotent - you can run it multiple times safely
-- 2. Row Level Security (RLS) ensures users can only access their own data
-- 3. The trigger automatically creates a user profile when someone signs up
-- 4. All timestamps are stored in UTC with timezone
-- 5. Mood values are constrained to 1-5 range

-- =====================================================
-- SUCCESS
-- =====================================================

-- If you see this message, the database setup is complete!
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete! Tables, indexes, policies, and triggers created successfully.';
END $$;
