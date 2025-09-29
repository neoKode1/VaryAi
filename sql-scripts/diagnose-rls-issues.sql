-- COMPREHENSIVE RLS DIAGNOSTIC SCRIPT
-- This will help us understand exactly what's wrong with your RLS policies

-- ============================================
-- SECTION 1: CHECK CURRENT RLS STATUS
-- ============================================

SELECT 
    'RLS Status Check' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('galleries', 'users')
ORDER BY tablename;

-- ============================================
-- SECTION 2: LIST ALL EXISTING POLICIES
-- ============================================

-- Check all policies on galleries table
SELECT 
    'Galleries Policies' as table_name,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'galleries'
ORDER BY policyname;

-- Check all policies on users table  
SELECT 
    'Users Policies' as table_name,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================
-- SECTION 3: TEST AUTH CONTEXT
-- ============================================

-- Check if auth.uid() function works
SELECT 
    'Auth Test' as test_type,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- ============================================
-- SECTION 4: TEST DATA ACCESS
-- ============================================

-- Count total gallery items (should work with service role)
SELECT 
    'Gallery Count (Admin)' as test_name,
    COUNT(*) as total_items
FROM galleries;

-- Count gallery items for specific user (should work with service role)
SELECT 
    'Gallery Count for User' as test_name,
    COUNT(*) as user_items
FROM galleries 
WHERE user_id = '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1';

-- Count total users (should work with service role)
SELECT 
    'Users Count (Admin)' as test_name,
    COUNT(*) as total_users
FROM users;

-- Check if specific user exists
SELECT 
    'User Exists Check' as test_name,
    id,
    email,
    created_at
FROM users 
WHERE id = '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1';

-- ============================================
-- SECTION 5: CHECK TABLE STRUCTURE
-- ============================================

-- Check galleries table structure
SELECT 
    'Galleries Table Structure' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'galleries'
ORDER BY ordinal_position;

-- Check users table structure
SELECT 
    'Users Table Structure' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ============================================
-- SECTION 6: CHECK FOR CONSTRAINT ISSUES
-- ============================================

-- Check foreign key constraints
SELECT 
    'Foreign Key Constraints' as constraint_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('galleries', 'users');

-- ============================================
-- SECTION 7: CHECK FOR DUPLICATE POLICIES
-- ============================================

-- Look for duplicate or conflicting policies
SELECT 
    'Policy Conflicts Check' as check_type,
    tablename,
    policyname,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('galleries', 'users')
GROUP BY tablename, policyname, cmd
HAVING COUNT(*) > 1;

-- ============================================
-- SECTION 8: CHECK RECENT ERRORS
-- ============================================

-- This might show recent RLS-related errors in the database logs
SELECT 
    'Recent Activity' as info_type,
    'Check Supabase logs for recent RLS errors' as message;

-- ============================================
-- DIAGNOSTIC COMPLETE
-- ============================================

SELECT 'RLS Diagnostic Complete - Review all sections above' as status;
