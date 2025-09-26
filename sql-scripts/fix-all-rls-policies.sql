-- Comprehensive RLS Policy Fix
-- This script fixes both gallery and users table RLS policies

-- ==============================================
-- GALLERY TABLE FIXES
-- ==============================================

-- 1. Drop ALL existing gallery policies
DROP POLICY IF EXISTS "galleries_select_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_update_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries;
DROP POLICY IF EXISTS "Users can view their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON galleries;

-- 2. Ensure RLS is enabled on galleries table
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- 3. Create simple, working gallery policies
CREATE POLICY "galleries_select_policy" ON galleries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "galleries_insert_policy" ON galleries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "galleries_update_policy" ON galleries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "galleries_delete_policy" ON galleries
    FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- USERS TABLE FIXES
-- ==============================================

-- 4. Drop ALL existing users policies
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

-- 5. Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Create simple, working users policies
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (auth.uid() = id);

-- ==============================================
-- VERIFICATION
-- ==============================================

-- 7. Verify all policies are created correctly
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

-- 8. Verify RLS is enabled on both tables
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('galleries', 'users')
ORDER BY tablename;

-- 9. Test queries (these should work if policies are correct)
SELECT 
    'Gallery Test' as test_name,
    COUNT(*) as accessible_items
FROM galleries 
WHERE user_id = auth.uid();

SELECT 
    'Users Test' as test_name,
    COUNT(*) as accessible_profiles
FROM users 
WHERE id = auth.uid();
