-- Fix Duplicate Permissive Policies - Priority 2 (Medium Impact)
-- This script removes duplicate permissive policies that cause performance overhead

-- =====================================================
-- 1. IDENTIFY DUPLICATE POLICIES
-- =====================================================

-- Check for duplicate permissive policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND permissive = 'PERMISSIVE'
ORDER BY tablename, policyname;

-- =====================================================
-- 2. FIX ANALYTICS_EVENTS DUPLICATE POLICIES
-- =====================================================

-- analytics_events has duplicate policies for all roles
-- Keep "Service role can manage analytics events" and drop "Service role can manage analytics"

DROP POLICY IF EXISTS "Service role can manage analytics" ON public.analytics_events;

-- =====================================================
-- 3. FIX COMMUNITY_COMMENTS DUPLICATE POLICIES
-- =====================================================

-- community_comments has duplicate policies for INSERT
-- Keep "Users can create comments" and drop "Authenticated users can create comments"

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;

-- =====================================================
-- 4. FIX COMMUNITY_INTERACTIONS DUPLICATE POLICIES
-- =====================================================

-- community_interactions has duplicate policies for INSERT
-- Keep "Users can create interactions" and drop "Authenticated users can create interactions"

DROP POLICY IF EXISTS "Authenticated users can create interactions" ON public.community_interactions;

-- =====================================================
-- 5. FIX COMMUNITY_POSTS DUPLICATE POLICIES
-- =====================================================

-- community_posts has duplicate policies for INSERT
-- Keep "Users can create their own posts" and drop "Authenticated users can create posts"

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;

-- =====================================================
-- 6. FIX CREDIT_TRANSACTIONS DUPLICATE POLICIES
-- =====================================================

-- credit_transactions has duplicate policies for SELECT
-- Keep "Users can view own transactions" and drop "Users can view own credit transactions"

DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;

-- =====================================================
-- 7. FIX NOTIFICATIONS DUPLICATE POLICIES
-- =====================================================

-- notifications has multiple duplicate policies
-- Keep the more specific ones and drop the generic ones

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- =====================================================
-- 8. FIX PROMO_CODES DUPLICATE POLICIES
-- =====================================================

-- promo_codes has duplicate policies for SELECT
-- Keep "Users can read active promo codes" and drop "Admin users can read all promo codes"

DROP POLICY IF EXISTS "Admin users can read all promo codes" ON public.promo_codes;

-- =====================================================
-- 9. FIX TEAM_MEMBERS DUPLICATE POLICIES
-- =====================================================

-- team_members has duplicate policies for SELECT
-- Keep "Users can view team members of teams they belong to" and drop "Team owners can manage team members"

DROP POLICY IF EXISTS "Team owners can manage team members" ON public.team_members;

-- =====================================================
-- 10. VERIFICATION
-- =====================================================

-- Check remaining policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND permissive = 'PERMISSIVE'
ORDER BY tablename, policyname;

-- =====================================================
-- 11. SUMMARY
-- =====================================================

-- This script fixes:
-- ✅ multiple_permissive_policies (consolidated duplicate policies)

-- Next priority:
-- ⚠️ auth_rls_initplan (optimize auth function calls in RLS policies)