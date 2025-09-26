-- Fix Critical RLS Policy Issues
-- This script addresses the gallery and users table RLS problems

-- 1. Fix Gallery RLS Policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON galleries;

-- Create proper gallery policies
CREATE POLICY "Users can view their own gallery items" ON galleries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gallery items" ON galleries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery items" ON galleries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items" ON galleries
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Fix Users Table RLS Policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create proper users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 3. Ensure RLS is enabled on both tables
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Verify the policies are working
-- Test query to check if user can access their own gallery
SELECT 
    'Gallery RLS Test' as test_name,
    COUNT(*) as accessible_items
FROM galleries 
WHERE user_id = auth.uid();

-- Test query to check if user can access their own profile
SELECT 
    'Users RLS Test' as test_name,
    COUNT(*) as accessible_profiles
FROM users 
WHERE id = auth.uid();

-- 5. Show current policies for verification
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
