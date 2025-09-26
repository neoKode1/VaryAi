-- Fix Duplicate RLS Policies
-- Remove all duplicate policies and keep only the working ones

-- 1. Drop ALL existing policies on galleries table
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can view their own gallery items" ON galleries;
DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_select_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_update_policy" ON galleries;

-- 2. Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- 3. Create clean, single policies for galleries table
CREATE POLICY "galleries_select_policy" ON galleries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "galleries_insert_policy" ON galleries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "galleries_update_policy" ON galleries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "galleries_delete_policy" ON galleries
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Create clean, single policies for users table
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 5. Ensure RLS is enabled on both tables
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Verify the fix worked
SELECT 
    'After Fix - Gallery Policies' as test_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'galleries';

SELECT 
    'After Fix - Users Policies' as test_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'users';

-- 7. Show the final clean policies
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
