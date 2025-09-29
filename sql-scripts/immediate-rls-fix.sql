-- IMMEDIATE RLS FIX
-- The diagnostic showed NO RLS policies exist, which explains the violations
-- When RLS is enabled but no policies exist, ALL access is blocked by default

-- ============================================
-- STEP 1: VERIFY CURRENT STATE
-- ============================================

-- Check which tables have RLS enabled
SELECT 
    'Current RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users');

-- Check if any policies exist
SELECT 
    'Existing Policies Count' as info,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users');

-- ============================================
-- STEP 2: CREATE ESSENTIAL RLS POLICIES
-- ============================================

-- Create policies for galleries table
CREATE POLICY "galleries_select_policy" ON galleries 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "galleries_insert_policy" ON galleries 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "galleries_update_policy" ON galleries 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "galleries_delete_policy" ON galleries 
FOR DELETE USING (auth.uid() = user_id);

-- Create policies for users table
CREATE POLICY "users_select_policy" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_policy" ON users 
FOR DELETE USING (auth.uid() = id);

-- ============================================
-- STEP 3: VERIFY POLICIES WERE CREATED
-- ============================================

-- Check that policies now exist
SELECT 
    'New Policies Created' as info,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 4: TEST THE FIX
-- ============================================

-- Test auth context
SELECT 
    'Auth Test' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- Test data access (this should now work)
SELECT 
    'Gallery Access Test' as info,
    COUNT(*) as total_gallery_items
FROM galleries;

SELECT 
    'Users Access Test' as info,
    COUNT(*) as total_users
FROM users;

SELECT 'RLS POLICIES CREATED SUCCESSFULLY!' as status,
       'Users should now be able to access their data' as message;
