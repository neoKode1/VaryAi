-- TEST SPECIFIC USER ACCESS
-- Since general access works but specific user gets RLS violations

-- ============================================
-- STEP 1: TEST AUTH CONTEXT
-- ============================================

SELECT 
    'AUTH_CONTEXT' as section,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;

-- ============================================
-- STEP 2: TEST SPECIFIC USER ACCESS
-- ============================================

-- Test if we can access the specific user's data
SELECT 
    'SPECIFIC_USER_TEST' as section,
    id,
    email,
    created_at
FROM users 
WHERE id = '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1';

-- ============================================
-- STEP 3: TEST GALLERY ACCESS FOR SPECIFIC USER
-- ============================================

-- Test gallery access for the specific user
SELECT 
    'GALLERY_ACCESS_TEST' as section,
    COUNT(*) as total_gallery_items,
    COUNT(CASE WHEN user_id = '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1' THEN 1 END) as user_gallery_items
FROM galleries;

-- ============================================
-- STEP 4: CHECK EXISTING POLICIES
-- ============================================

SELECT 
    'EXISTING_POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('galleries', 'users')
ORDER BY tablename, policyname;

-- ============================================
-- STEP 5: TEST INSERT PERMISSION
-- ============================================

-- Test if we can insert a new user (this might fail with RLS)
SELECT 
    'INSERT_TEST' as section,
    'Testing if INSERT is blocked by RLS' as test_description;

-- Try to insert a test user (this will show us the exact error)
-- Note: This might fail, but we want to see the error message
INSERT INTO users (id, email, created_at, updated_at)
VALUES (
    'test-user-' || extract(epoch from now())::text,
    'test@example.com',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 6: CHECK FOR TRIGGERS
-- ============================================

SELECT 
    'TRIGGERS' as section,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table IN ('galleries', 'users')
ORDER BY event_object_table, trigger_name;
