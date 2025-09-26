-- Fix Gallery RLS Policies - Comprehensive Fix
-- This script addresses the gallery access issues by ensuring proper RLS policies

-- 1. First, let's check the current state
SELECT 
    'Current Gallery Policies' as check_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'galleries';

-- 2. Drop ALL existing gallery policies to start fresh
DROP POLICY IF EXISTS "galleries_select_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_update_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries;
DROP POLICY IF EXISTS "Users can view their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON galleries;

-- 3. Ensure RLS is enabled on galleries table
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, working gallery policies
CREATE POLICY "galleries_select_policy" ON galleries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "galleries_insert_policy" ON galleries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "galleries_update_policy" ON galleries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "galleries_delete_policy" ON galleries
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Test the policies by checking if they exist
SELECT 
    'After Fix - Gallery Policies' as check_name,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'galleries'
ORDER BY policyname;

-- 6. Verify RLS is enabled
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'galleries';

-- 7. Test query to see if user can access their own gallery items
-- This should work if the policies are correct
SELECT 
    'Test Query' as check_name,
    COUNT(*) as accessible_items
FROM galleries 
WHERE user_id = auth.uid();
