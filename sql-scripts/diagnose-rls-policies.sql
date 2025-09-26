-- Diagnose Current RLS Policies
-- This script helps identify what's wrong with the current RLS setup

-- 1. Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls
FROM pg_tables 
WHERE tablename IN ('galleries', 'users')
ORDER BY tablename;

-- 2. Show all current policies on galleries and users tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('galleries', 'users')
ORDER BY tablename, policyname;

-- 3. Check for any conflicting or duplicate policies
SELECT 
    tablename,
    policyname,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('galleries', 'users')
GROUP BY tablename, policyname
HAVING COUNT(*) > 1;

-- 4. Test current user context
SELECT 
    'Current User Context' as test_name,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 5. Check sample gallery data to understand the structure
SELECT 
    'Sample Gallery Data' as test_name,
    COUNT(*) as total_items,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_item,
    MAX(created_at) as newest_item
FROM galleries;

-- 6. Check if there are any gallery items for the specific user having issues
SELECT 
    'User Gallery Check' as test_name,
    user_id,
    COUNT(*) as item_count
FROM galleries 
WHERE user_id = '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1'
GROUP BY user_id;
