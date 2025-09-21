-- Fix Security Issues from Performance Fix
-- Enable RLS on backup table and clean up

-- =====================================================
-- 1. ENABLE RLS ON BACKUP TABLE
-- =====================================================

-- Enable RLS on the backup table we created
ALTER TABLE public.policy_backup_safe ENABLE ROW LEVEL SECURITY;

-- Create a restrictive policy for the backup table
-- This table should only be accessible by service role or specific admin users
CREATE POLICY "Restrict policy backup access" ON public.policy_backup_safe
    FOR ALL USING (false); -- Deny all access by default

-- =====================================================
-- 2. CLEAN UP BACKUP TABLE (Optional)
-- =====================================================

-- If you want to remove the backup table after confirming everything works:
-- DROP TABLE IF EXISTS public.policy_backup_safe;

-- =====================================================
-- 3. VERIFY FIX
-- =====================================================

-- Check that RLS is enabled on backup table
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'policy_backup_safe' AND schemaname = 'public';

-- Check that policy exists
SELECT 
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'policy_backup_safe' AND schemaname = 'public';
