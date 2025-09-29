-- COMPREHENSIVE SUPABASE INFORMATION GATHERING
-- Run this in Supabase SQL Editor to get all the information we need
-- Copy the results and share them for analysis

-- ============================================
-- SECTION 1: ALL RLS POLICIES (MOST IMPORTANT)
-- ============================================

SELECT 
    'ALL_RLS_POLICIES' as section,
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
ORDER BY tablename, policyname;

-- ============================================
-- SECTION 2: TABLE RLS STATUS
-- ============================================

SELECT 
    'TABLE_RLS_STATUS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- SECTION 3: CUSTOM FUNCTIONS (MIGHT INTERFERE WITH RLS)
-- ============================================

SELECT 
    'CUSTOM_FUNCTIONS' as section,
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================
-- SECTION 4: TRIGGERS (MIGHT INTERFERE WITH RLS)
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
ORDER BY event_object_table, trigger_name;

-- ============================================
-- SECTION 5: TABLE CONSTRAINTS
-- ============================================

SELECT 
    'CONSTRAINTS' as section,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
LEFT JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('galleries', 'users')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- SECTION 6: AUTH FUNCTIONS TEST
-- ============================================

SELECT 
    'AUTH_TEST' as section,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;

-- ============================================
-- SECTION 7: SAMPLE DATA ACCESS TEST
-- ============================================

-- Test gallery access
SELECT 
    'GALLERY_ACCESS_TEST' as section,
    COUNT(*) as total_gallery_items,
    COUNT(CASE WHEN user_id = '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1' THEN 1 END) as user_gallery_items
FROM galleries;

-- Test users access
SELECT 
    'USERS_ACCESS_TEST' as section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN id = '04531a4a-6ad0-4f7f-a761-0fbc08a1eef1' THEN 1 END) as user_exists
FROM users;

-- ============================================
-- SECTION 8: RECENT MIGRATIONS (if available)
-- ============================================

-- Check if there's a migrations table
SELECT 
    'MIGRATIONS_CHECK' as section,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%migration%';

-- If migrations table exists, show recent ones
-- (Uncomment if migrations table is found)
-- SELECT 
--     'RECENT_MIGRATIONS' as section,
--     *
-- FROM supabase_migrations.schema_migrations 
-- ORDER BY version DESC 
-- LIMIT 10;

-- ============================================
-- COMPLETE
-- ============================================

SELECT 'COMPREHENSIVE_INFO_GATHERED' as status, 
       'Copy all results above and share for analysis' as next_step;
