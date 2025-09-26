-- Fix Users RLS Policies - Comprehensive Fix
-- This script addresses the user profile creation issues

-- 1. Check current users policies
SELECT 
    'Current Users Policies' as check_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Drop ALL existing users policies to start fresh
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

-- 3. Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, working users policies
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (auth.uid() = id);

-- 5. Test the policies by checking if they exist
SELECT 
    'After Fix - Users Policies' as check_name,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 6. Verify RLS is enabled
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- 7. Test query to see if user can access their own profile
SELECT 
    'Test Query' as check_name,
    COUNT(*) as accessible_profiles
FROM users 
WHERE id = auth.uid();
