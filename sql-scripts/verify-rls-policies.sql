-- Verify RLS Policies - Run this after both fixes
-- This script only contains SELECT statements, no conflicts

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- 1. Check gallery policies
SELECT 
    'Gallery Policies' as table_name,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'galleries'
ORDER BY policyname;

-- 2. Check users policies
SELECT 
    'Users Policies' as table_name,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Check RLS status
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('galleries', 'users')
ORDER BY tablename;

-- 4. Test gallery access (this will show 0 in SQL editor, but should work in API)
SELECT 
    'Gallery Test' as test_name,
    COUNT(*) as accessible_items
FROM galleries 
WHERE user_id = auth.uid();

-- 5. Test users access (this will show 0 in SQL editor, but should work in API)
SELECT 
    'Users Test' as test_name,
    COUNT(*) as accessible_profiles
FROM users 
WHERE id = auth.uid();
