-- Fix Auth UID RLS Policies - Address auth.uid() issues
-- This script fixes the common auth.uid() problems in RLS policies

-- ==============================================
-- DIAGNOSTIC QUERIES
-- ==============================================

-- 1. Check current auth context
SELECT 
    'Auth Context Check' as check_name,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    current_user as database_user;

-- 2. Check if we're in the right schema
SELECT 
    'Schema Check' as check_name,
    current_schema() as current_schema,
    current_database() as current_database;

-- ==============================================
-- GALLERY TABLE FIXES WITH IMPROVED AUTH
-- ==============================================

-- 3. Drop ALL existing gallery policies
DROP POLICY IF EXISTS "galleries_select_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_update_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries;
DROP POLICY IF EXISTS "Users can view their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON galleries;

-- 4. Ensure RLS is enabled on galleries table
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- 5. Create improved gallery policies with better auth handling
CREATE POLICY "galleries_select_policy" ON galleries
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

CREATE POLICY "galleries_insert_policy" ON galleries
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

CREATE POLICY "galleries_update_policy" ON galleries
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

CREATE POLICY "galleries_delete_policy" ON galleries
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

-- ==============================================
-- USERS TABLE FIXES WITH IMPROVED AUTH
-- ==============================================

-- 6. Drop ALL existing users policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- 7. Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 8. Create improved users policies with better auth handling
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = id
    );

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = id
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = id
    );

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = id
    );

-- ==============================================
-- VERIFICATION AND TESTING
-- ==============================================

-- 9. Verify all policies are created correctly
SELECT 
    'Gallery Policies' as table_name,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'galleries'
ORDER BY policyname;

SELECT 
    'Users Policies' as table_name,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 10. Verify RLS is enabled on both tables
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('galleries', 'users')
ORDER BY tablename;

-- 11. Test auth.uid() function
SELECT 
    'Auth UID Test' as test_name,
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Auth UID is working'
        ELSE 'Auth UID is NULL - this is the problem'
    END as auth_status;

-- 12. Test queries with improved error handling
SELECT 
    'Gallery Test' as test_name,
    COUNT(*) as accessible_items,
    CASE 
        WHEN auth.uid() IS NULL THEN 'Auth UID is NULL'
        ELSE 'Auth UID is working'
    END as auth_status
FROM galleries 
WHERE auth.uid() IS NOT NULL AND user_id = auth.uid();

SELECT 
    'Users Test' as test_name,
    COUNT(*) as accessible_profiles,
    CASE 
        WHEN auth.uid() IS NULL THEN 'Auth UID is NULL'
        ELSE 'Auth UID is working'
    END as auth_status
FROM users 
WHERE auth.uid() IS NOT NULL AND id = auth.uid();

-- 13. Check if there are any users in the database
SELECT 
    'Database Check' as check_name,
    COUNT(*) as total_users,
    COUNT(DISTINCT id) as unique_user_ids
FROM users;

-- 14. Check if there are any gallery items
SELECT 
    'Gallery Check' as check_name,
    COUNT(*) as total_gallery_items,
    COUNT(DISTINCT user_id) as unique_user_ids
FROM galleries;
