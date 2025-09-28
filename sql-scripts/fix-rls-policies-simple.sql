-- Simple RLS Policy Fix - No Transaction Conflicts
-- Run each section separately if needed

-- ==============================================
-- SECTION 1: GALLERY TABLE FIXES
-- ==============================================

-- Drop existing gallery policies
DROP POLICY IF EXISTS "galleries_select_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_update_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries;
DROP POLICY IF EXISTS "Users can view their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON galleries;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON galleries;

-- Enable RLS on galleries table
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- Create new gallery policies
CREATE POLICY "galleries_select_policy" ON galleries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "galleries_insert_policy" ON galleries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "galleries_update_policy" ON galleries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "galleries_delete_policy" ON galleries
    FOR DELETE USING (auth.uid() = user_id);
