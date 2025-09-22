-- Backup Current RLS Policies Before Performance Fixes
-- Run this script first to backup existing policies

-- =====================================================
-- BACKUP CURRENT POLICIES
-- =====================================================

-- Create backup table for policies
CREATE TABLE IF NOT EXISTS policy_backup (
    id SERIAL PRIMARY KEY,
    tablename TEXT NOT NULL,
    policyname TEXT NOT NULL,
    policy_definition TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Backup galleries policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'galleries' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.galleries FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'galleries' AND schemaname = 'public';

-- Backup usage_tracking policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'usage_tracking' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.usage_tracking FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'usage_tracking' AND schemaname = 'public';

-- Backup credit_transactions policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'credit_transactions' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.credit_transactions FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'credit_transactions' AND schemaname = 'public';

-- Backup community_posts policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'community_posts' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.community_posts FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'community_posts' AND schemaname = 'public';

-- Backup community_comments policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'community_comments' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.community_comments FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'community_comments' AND schemaname = 'public';

-- Backup community_interactions policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'community_interactions' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.community_interactions FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'community_interactions' AND schemaname = 'public';

-- Backup profiles policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'profiles' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.profiles FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Backup image_uploads policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'image_uploads' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.image_uploads FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'image_uploads' AND schemaname = 'public';

-- Backup model_usage policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'model_usage' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.model_usage FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'model_usage' AND schemaname = 'public';

-- Backup model_combinations policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'model_combinations' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.model_combinations FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'model_combinations' AND schemaname = 'public';

-- Backup level_unlocks policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'level_unlocks' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.level_unlocks FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'level_unlocks' AND schemaname = 'public';

-- Backup user_promo_access policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'user_promo_access' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.user_promo_access FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'user_promo_access' AND schemaname = 'public';

-- Backup notifications policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'notifications' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.notifications FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'notifications' AND schemaname = 'public';

-- Backup user_unlocked_models policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'user_unlocked_models' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.user_unlocked_models FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'user_unlocked_models' AND schemaname = 'public';

-- Backup user_credits policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'user_credits' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.user_credits FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'user_credits' AND schemaname = 'public';

-- Backup credit_usage_log policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'credit_usage_log' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.credit_usage_log FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'credit_usage_log' AND schemaname = 'public';

-- Backup grandfathering_batch policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'grandfathering_batch' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.grandfathering_batch FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'grandfathering_batch' AND schemaname = 'public';

-- Backup analytics_events policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'analytics_events' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.analytics_events FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'analytics_events' AND schemaname = 'public';

-- Backup promo_codes policies
INSERT INTO policy_backup (tablename, policyname, policy_definition)
SELECT 
    'promo_codes' as tablename,
    policyname,
    'CREATE POLICY "' || policyname || '" ON public.promo_codes FOR ' || cmd || ' USING ' || COALESCE(qual, 'true') || ';' as policy_definition
FROM pg_policies 
WHERE tablename = 'promo_codes' AND schemaname = 'public';

-- Show backup summary
SELECT 
    tablename,
    COUNT(*) as policy_count,
    MIN(created_at) as backup_time
FROM policy_backup 
GROUP BY tablename 
ORDER BY tablename;

-- Show total policies backed up
SELECT COUNT(*) as total_policies_backed_up FROM policy_backup;
