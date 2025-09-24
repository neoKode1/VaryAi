-- Fix Duplicate Indexes - Priority 1 (High Impact)
-- This script removes duplicate indexes that waste storage and slow performance

-- =====================================================
-- 1. IDENTIFY DUPLICATE INDEXES
-- =====================================================

-- Check for duplicate indexes on galleries table
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'galleries'
AND indexname IN ('idx_galleries_user_id', 'idx_galleries_user_id_perf')
ORDER BY indexname;

-- =====================================================
-- 2. REMOVE DUPLICATE INDEX
-- =====================================================

-- Drop the duplicate index (keeping the more descriptive one)
-- Based on the linter output, we have:
-- - idx_galleries_user_id
-- - idx_galleries_user_id_perf

-- Drop the less descriptive one (idx_galleries_user_id)
DROP INDEX IF EXISTS public.idx_galleries_user_id;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

-- Verify the duplicate index is removed
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'galleries'
ORDER BY indexname;

-- Check for any remaining duplicate indexes across all tables
SELECT 
    tablename,
    array_agg(indexname) as indexes,
    count(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING count(*) > 1
ORDER BY tablename;

-- =====================================================
-- 4. SUMMARY
-- =====================================================

-- This script fixes:
-- ✅ duplicate_index (1 duplicate index removed)

-- Next priorities:
-- ⚠️ multiple_permissive_policies (consolidate duplicate policies)
-- ⚠️ auth_rls_initplan (optimize auth function calls in RLS policies)
