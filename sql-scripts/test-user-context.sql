-- TEST USER CONTEXT AND RLS POLICIES
-- This will help us understand why the user-authenticated client still can't access data

-- ============================================
-- STEP 1: TEST AUTH CONTEXT AS REGULAR USER
-- ============================================

SELECT 
    'AUTH_CONTEXT_TEST' as section,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email,
    auth.jwt() as jwt_claims;

-- ============================================
-- STEP 2: TEST USER TABLE ACCESS WITH CURRENT USER
-- ============================================

-- This should work if RLS policies are correct
SELECT 
    'USER_TABLE_ACCESS' as section,
    COUNT(*) as accessible_users,
    COUNT(CASE WHEN id = auth.uid() THEN 1 END) as current_user_accessible
FROM users;

-- ============================================
-- STEP 3: TEST GALLERY ACCESS WITH CURRENT USER
-- ============================================

-- This should work if RLS policies are correct
SELECT 
    'GALLERY_TABLE_ACCESS' as section,
    COUNT(*) as accessible_galleries,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as current_user_galleries
FROM galleries;

-- ============================================
-- STEP 4: CHECK SPECIFIC USER DATA
-- ============================================

-- Test access to the specific user's data
SELECT 
    'SPECIFIC_USER_TEST' as section,
    id,
    email,
    created_at
FROM users 
WHERE id = auth.uid();

-- Test access to the specific user's gallery
SELECT 
    'SPECIFIC_GALLERY_TEST' as section,
    id,
    user_id,
    created_at
FROM galleries 
WHERE user_id = auth.uid()
LIMIT 5;

-- ============================================
-- STEP 5: CHECK RLS POLICY DETAILS
-- ============================================

-- Get detailed policy information
SELECT 
    'RLS_POLICY_DETAILS' as section,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 6: TEST POLICY EXPRESSIONS MANUALLY
-- ============================================

-- Test if auth.uid() returns the expected value
SELECT 
    'MANUAL_POLICY_TEST' as section,
    'auth.uid() result' as test_name,
    auth.uid() as auth_uid_result,
    '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1' as expected_user_id,
    CASE 
        WHEN auth.uid() = '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1' THEN 'MATCH'
        ELSE 'NO_MATCH'
    END as match_result;
