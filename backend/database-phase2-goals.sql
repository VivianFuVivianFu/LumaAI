-- =====================================================
-- Phase 2: Goals Feature Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'career', 'financial', 'health', 'relationships',
    'mental-health', 'personal-growth', 'creative', 'social-impact'
  )),
  timeframe TEXT NOT NULL CHECK (timeframe IN ('3-months', '6-months', '12-months')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Goal clarifications table (stores clarification Q&A)
CREATE TABLE IF NOT EXISTS public.goal_clarifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action plans table
CREATE TABLE IF NOT EXISTS public.action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  smart_statement TEXT NOT NULL,
  total_sprints INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Milestones/Sprints table
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'skipped')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly actions table
CREATE TABLE IF NOT EXISTS public.weekly_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  week_number INTEGER,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress reflections table (fortnightly summaries)
CREATE TABLE IF NOT EXISTS public.progress_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  wins TEXT,
  challenges TEXT,
  adjustments TEXT,
  progress_statement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON public.goals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goal_clarifications_goal_id ON public.goal_clarifications(goal_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_goal_id ON public.action_plans(goal_id);
CREATE INDEX IF NOT EXISTS idx_milestones_action_plan_id ON public.milestones(action_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_actions_milestone_id ON public.weekly_actions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_weekly_actions_goal_id ON public.weekly_actions(goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_reflections_goal_id ON public.progress_reflections(goal_id);

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_clarifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for goal_clarifications
CREATE POLICY "Users can view own clarifications"
  ON public.goal_clarifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clarifications"
  ON public.goal_clarifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for action_plans
CREATE POLICY "Users can view own action plans"
  ON public.action_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action plans"
  ON public.action_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action plans"
  ON public.action_plans FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for milestones
CREATE POLICY "Users can view own milestones"
  ON public.milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones"
  ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones"
  ON public.milestones FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for weekly_actions
CREATE POLICY "Users can view own actions"
  ON public.weekly_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actions"
  ON public.weekly_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actions"
  ON public.weekly_actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own actions"
  ON public.weekly_actions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for progress_reflections
CREATE POLICY "Users can view own reflections"
  ON public.progress_reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections"
  ON public.progress_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_goal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_goal_on_change ON public.goals;
CREATE TRIGGER update_goal_on_change
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_timestamp();

-- Verification
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('goals', 'goal_clarifications', 'action_plans', 'milestones', 'weekly_actions', 'progress_reflections');

-- Success
DO $$
BEGIN
  RAISE NOTICE '✅ Goals feature database schema created successfully!';
END $$;
