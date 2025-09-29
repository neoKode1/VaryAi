-- MANUAL RLS POLICY FIX
-- Copy and paste this entire script into Supabase SQL Editor and execute it
-- This fixes the exact issues shown in your logs:
-- 1. Gallery RLS: Admin finds 1000 items, user finds 0
-- 2. Users RLS: "new row violates row-level security policy for table 'users'"

-- ============================================
-- SECTION 1: FIX GALLERIES TABLE RLS POLICIES
-- ============================================

-- Drop ALL existing gallery policies to start clean
DROP POLICY IF EXISTS "galleries_select_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_update_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries;
DROP POLICY IF EXISTS "Users can view their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON galleries;
DROP POLICY IF EXISTS "gallery_select_policy" ON galleries;
DROP POLICY IF EXISTS "gallery_insert_policy" ON galleries;
DROP POLICY IF EXISTS "gallery_update_policy" ON galleries;
DROP POLICY IF EXISTS "gallery_delete_policy" ON galleries;

-- Ensure RLS is enabled on galleries table
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- Create new, correct gallery policies
CREATE POLICY "galleries_select_policy" ON galleries 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "galleries_insert_policy" ON galleries 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "galleries_update_policy" ON galleries 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "galleries_delete_policy" ON galleries 
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SECTION 2: FIX USERS TABLE RLS POLICIES  
-- ============================================

-- Drop ALL existing user policies to start clean
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
DROP POLICY IF EXISTS "user_select_policy" ON users;
DROP POLICY IF EXISTS "user_insert_policy" ON users;
DROP POLICY IF EXISTS "user_update_policy" ON users;
DROP POLICY IF EXISTS "user_delete_policy" ON users;

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new, correct user policies
CREATE POLICY "users_select_policy" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_policy" ON users 
FOR DELETE USING (auth.uid() = id);

-- ============================================
-- SECTION 3: VERIFY THE FIXES
-- ============================================

-- Check galleries policies
SELECT 
    'Galleries Policies' as table_type,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'galleries'
ORDER BY policyname;

-- Check users policies  
SELECT 
    'Users Policies' as table_type,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query to verify users can access their own data
-- (This should return the count of accessible gallery items for the current user)
SELECT 
    'Test Galleries Access' as test_name,
    COUNT(*) as accessible_gallery_items
FROM galleries 
WHERE user_id = auth.uid();

-- Test query to verify users can access their own profile
-- (This should return 1 if the user has a profile, 0 if not)
SELECT 
    'Test Users Access' as test_name,
    COUNT(*) as accessible_user_profiles
FROM users 
WHERE id = auth.uid();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'RLS Policy Fix Complete!' as status,
       'Users should now be able to view their gallery items and create profiles' as message;
