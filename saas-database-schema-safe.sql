-- SaaS Database Schema for VaryAI (Safe Version)
-- This script safely adds the necessary tables and features for a complete SaaS application
-- It handles existing tables and columns gracefully

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Teams Table (for multi-user organizations)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Enhanced Users Table (add missing SaaS fields safely)
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user'));
    END IF;
    
    -- Add subscription_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_id') THEN
        ALTER TABLE public.users ADD COLUMN subscription_id VARCHAR(255);
    END IF;
    
    -- Add subscription_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive';
    END IF;
    
    -- Add current_period_end column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_period_end') THEN
        ALTER TABLE public.users ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add cancel_at_period_end column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cancel_at_period_end') THEN
        ALTER TABLE public.users ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add monthly_generations column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'monthly_generations') THEN
        ALTER TABLE public.users ADD COLUMN monthly_generations INTEGER DEFAULT 0;
    END IF;
    
    -- Add daily_generations column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_generations') THEN
        ALTER TABLE public.users ADD COLUMN daily_generations INTEGER DEFAULT 0;
    END IF;
    
    -- Add overage_charges column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'overage_charges') THEN
        ALTER TABLE public.users ADD COLUMN overage_charges DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add last_reset_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_reset_date') THEN
        ALTER TABLE public.users ADD COLUMN last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add last_activity column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_activity') THEN
        ALTER TABLE public.users ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add onboarding_completed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add email_notifications column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_notifications') THEN
        ALTER TABLE public.users ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add marketing_emails column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'marketing_emails') THEN
        ALTER TABLE public.users ADD COLUMN marketing_emails BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add two_factor_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE public.users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add api_access_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'api_access_enabled') THEN
        ALTER TABLE public.users ADD COLUMN api_access_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Stripe Customers Table
CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe Subscriptions Table
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    price_id VARCHAR(255) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table (Safe creation with column check)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If notifications table exists but has 'read' column instead of 'is_read', rename it
DO $$
BEGIN
    -- Check if 'read' column exists and 'is_read' doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
        ALTER TABLE public.notifications RENAME COLUMN "read" TO is_read;
    END IF;
END $$;

-- API Keys Table (for programmatic access)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    permissions JSONB DEFAULT '{}',
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Analytics Table
CREATE TABLE IF NOT EXISTS public.usage_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    generations_count INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    models_used JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON public.stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_date ON public.usage_analytics(date);

-- Row Level Security (RLS) Policies

-- Activity Logs RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_logs;

CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Teams RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;

CREATE POLICY "Users can view teams they belong to" ON public.teams
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT user_id FROM public.team_members WHERE team_id = id)
    );

CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update their teams" ON public.teams
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete their teams" ON public.teams
    FOR DELETE USING (auth.uid() = owner_id);

-- Team Members RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view team members of teams they belong to" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;

CREATE POLICY "Users can view team members of teams they belong to" ON public.team_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT user_id FROM public.team_members WHERE team_id = team_id)
    );

CREATE POLICY "Team owners can manage team members" ON public.team_members
    FOR ALL USING (
        auth.uid() IN (SELECT owner_id FROM public.teams WHERE id = team_id)
    );

-- Stripe Customers RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stripe customer data" ON public.stripe_customers;
DROP POLICY IF EXISTS "Users can insert their own stripe customer data" ON public.stripe_customers;

CREATE POLICY "Users can view their own stripe customer data" ON public.stripe_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stripe customer data" ON public.stripe_customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stripe Subscriptions RLS
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscription data" ON public.stripe_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription data" ON public.stripe_subscriptions;

CREATE POLICY "Users can view their own subscription data" ON public.stripe_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription data" ON public.stripe_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- API Keys RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;

CREATE POLICY "Users can manage their own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Usage Analytics RLS
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own usage analytics" ON public.usage_analytics;
DROP POLICY IF EXISTS "System can insert usage analytics" ON public.usage_analytics;

CREATE POLICY "Users can view their own usage analytics" ON public.usage_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage analytics" ON public.usage_analytics
    FOR INSERT WITH CHECK (true);

-- Functions for common operations

-- Function to update user's last activity
CREATE OR REPLACE FUNCTION update_user_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET last_activity = NOW() 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_user_last_activity ON public.activity_logs;

-- Create trigger to update last activity on activity log insert
CREATE TRIGGER trigger_update_user_last_activity
    AFTER INSERT ON public.activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_activity();

-- Function to reset daily/monthly counters
CREATE OR REPLACE FUNCTION reset_usage_counters()
RETURNS void AS $$
BEGIN
    -- Reset daily counters for all users
    UPDATE public.users 
    SET daily_generations = 0 
    WHERE DATE(last_reset_date) < CURRENT_DATE;
    
    -- Reset monthly counters on the first day of the month
    UPDATE public.users 
    SET monthly_generations = 0 
    WHERE DATE_TRUNC('month', last_reset_date) < DATE_TRUNC('month', CURRENT_DATE);
    
    -- Update last reset date
    UPDATE public.users 
    SET last_reset_date = NOW() 
    WHERE DATE(last_reset_date) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user tier limits
CREATE OR REPLACE FUNCTION get_user_tier_limits(user_uuid UUID)
RETURNS TABLE(
    tier VARCHAR,
    monthly_limit INTEGER,
    daily_limit INTEGER,
    can_use_video_models BOOLEAN,
    can_use_premium_models BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.tier,
        CASE 
            WHEN u.tier = 'free' THEN 5
            WHEN u.tier = 'light' THEN 50
            WHEN u.tier = 'heavy' THEN 200
            WHEN u.tier = 'admin' THEN 9999
            ELSE 5
        END as monthly_limit,
        CASE 
            WHEN u.tier = 'free' THEN 2
            WHEN u.tier = 'light' THEN 10
            WHEN u.tier = 'heavy' THEN 20
            WHEN u.tier = 'admin' THEN 9999
            ELSE 2
        END as daily_limit,
        CASE 
            WHEN u.tier IN ('heavy', 'admin') THEN true
            ELSE false
        END as can_use_video_models,
        CASE 
            WHEN u.tier IN ('light', 'heavy', 'admin') THEN true
            ELSE false
        END as can_use_premium_models
    FROM public.users u
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can generate
CREATE OR REPLACE FUNCTION can_user_generate(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier VARCHAR;
    monthly_count INTEGER;
    daily_count INTEGER;
    monthly_limit INTEGER;
    daily_limit INTEGER;
BEGIN
    -- Get user tier and current usage
    SELECT 
        u.tier,
        u.monthly_generations,
        u.daily_generations
    INTO user_tier, monthly_count, daily_count
    FROM public.users u
    WHERE u.id = user_uuid;
    
    -- Get limits based on tier
    SELECT 
        CASE 
            WHEN user_tier = 'free' THEN 5
            WHEN user_tier = 'light' THEN 50
            WHEN user_tier = 'heavy' THEN 200
            WHEN user_tier = 'admin' THEN 9999
            ELSE 5
        END,
        CASE 
            WHEN user_tier = 'free' THEN 2
            WHEN user_tier = 'light' THEN 10
            WHEN user_tier = 'heavy' THEN 20
            WHEN user_tier = 'admin' THEN 9999
            ELSE 2
        END
    INTO monthly_limit, daily_limit;
    
    -- Check if user has exceeded limits
    RETURN (monthly_count < monthly_limit AND daily_count < daily_limit);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
