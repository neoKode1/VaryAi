-- INVESTIGATE EXISTING RLS POLICIES
-- Since policies exist but aren't working, we need to see what's wrong with them

-- ============================================
-- STEP 1: SEE WHAT POLICIES ACTUALLY EXIST
-- ============================================

SELECT 
    'EXISTING_POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 2: CHECK RLS STATUS
-- ============================================

SELECT 
    'RLS_STATUS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users')
ORDER BY tablename;

-- ============================================
-- STEP 3: TEST AUTH CONTEXT
-- ============================================

SELECT 
    'AUTH_CONTEXT' as section,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;

-- ============================================
-- STEP 4: TEST DATA ACCESS WITH CURRENT POLICIES
-- ============================================

-- Try to access galleries
SELECT 
    'GALLERY_ACCESS_TEST' as section,
    COUNT(*) as accessible_items
FROM galleries;

-- Try to access users
SELECT 
    'USERS_ACCESS_TEST' as section,
    COUNT(*) as accessible_users
FROM users;

-- ============================================
-- STEP 5: CHECK FOR POLICY CONFLICTS
-- ============================================

-- Look for multiple policies with same name/command
SELECT 
    'POLICY_CONFLICTS' as section,
    tablename,
    policyname,
    cmd,
    COUNT(*) as duplicate_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users')
GROUP BY tablename, policyname, cmd
HAVING COUNT(*) > 1;

-- ============================================
-- STEP 6: CHECK FOR BROKEN POLICY EXPRESSIONS
-- ============================================

-- This will show us if the policy expressions are malformed
SELECT 
    'POLICY_EXPRESSIONS' as section,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NULL THEN 'NULL_QUAL'
        WHEN qual = '' THEN 'EMPTY_QUAL'
        ELSE 'HAS_QUAL'
    END as qual_status,
    CASE 
        WHEN with_check IS NULL THEN 'NULL_CHECK'
        WHEN with_check = '' THEN 'EMPTY_CHECK'
        ELSE 'HAS_CHECK'
    END as check_status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users')
ORDER BY tablename, policyname;
