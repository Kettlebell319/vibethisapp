-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ideas table - stores our daily app ideas
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL, -- Full idea content in our markdown format
  difficulty_score INTEGER CHECK (difficulty_score >= 1 AND difficulty_score <= 5),
  revenue_potential TEXT CHECK (revenue_potential IN ('low', 'medium', 'high')),
  build_time_estimate TEXT, -- e.g., "1-2 weeks"
  tools_required TEXT[], -- Array of tools like ["Claude API", "Replit", "Supabase"]
  tags TEXT[], -- Array of tags like ["trend-based", "pain-driven", "revenue-first"]
  trend_signals JSONB, -- Data about what trends influenced this idea
  published_date DATE,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trend signals table - stores raw data from various sources
CREATE TABLE IF NOT EXISTS public.trend_signals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source TEXT NOT NULL, -- 'reddit', 'google_trends', 'github', 'twitter', etc.
  signal_type TEXT NOT NULL, -- 'keyword_spike', 'discussion_volume', 'repo_stars', etc.
  keyword TEXT,
  data JSONB NOT NULL, -- Raw signal data
  strength_score DECIMAL(3,2), -- 0.00 to 1.00 representing signal strength
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interactions with ideas
CREATE TABLE IF NOT EXISTS public.user_idea_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'favorite', 'built', 'shared')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, idea_id, interaction_type)
);

-- Subscription events for tracking
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled'
  from_tier TEXT,
  to_tier TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ideas_published_date ON public.ideas(published_date DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_ideas_tags ON public.ideas USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_trend_signals_source ON public.trend_signals(source);
CREATE INDEX IF NOT EXISTS idx_trend_signals_created_at ON public.trend_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_signals_processed ON public.trend_signals(processed) WHERE processed = false;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_idea_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Policies for profiles (users can only see/edit their own)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for ideas (public read, admin write)
CREATE POLICY "Anyone can view published ideas" ON public.ideas FOR SELECT USING (is_published = true);

-- Policies for user interactions (users can only see/edit their own)
CREATE POLICY "Users can view own interactions" ON public.user_idea_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON public.user_idea_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON public.user_idea_interactions FOR UPDATE USING (auth.uid() = user_id);

-- Policies for subscription events (users can only see their own)
CREATE POLICY "Users can view own subscription events" ON public.subscription_events FOR SELECT USING (auth.uid() = user_id);

-- Functions to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();