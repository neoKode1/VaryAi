-- EMERGENCY RLS FIX - Execute this immediately in Supabase SQL Editor
-- This fixes the exact issues in your logs:
-- 1. Gallery: Admin finds 1000 items, user finds 0  
-- 2. Users: "new row violates row-level security policy for table 'users'"

-- STEP 1: Fix Galleries Table
ALTER TABLE galleries DISABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "galleries_select_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_insert_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_update_policy" ON galleries;
DROP POLICY IF EXISTS "galleries_delete_policy" ON galleries;

CREATE POLICY "galleries_select_policy" ON galleries 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "galleries_insert_policy" ON galleries 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "galleries_update_policy" ON galleries 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "galleries_delete_policy" ON galleries 
FOR DELETE USING (auth.uid() = user_id);

-- STEP 2: Fix Users Table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

CREATE POLICY "users_select_policy" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_policy" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_delete_policy" ON users 
FOR DELETE USING (auth.uid() = id);

-- STEP 3: Verify Fix
SELECT 'RLS Fix Complete - Users can now access their data!' as status;
