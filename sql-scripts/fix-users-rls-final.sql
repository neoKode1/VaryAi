-- Final Fix for Users Table RLS Policies
-- This script resolves the "new row violates row-level security policy" error

-- ==============================================
-- STEP 1: REMOVE ALL EXISTING POLICIES
-- ==============================================

-- Drop ALL existing users policies to start completely fresh
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;

-- ==============================================
-- STEP 2: ENABLE RLS
-- ==============================================

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 3: CREATE NEW WORKING POLICIES
-- ==============================================

-- SELECT Policy: Users can view their own profile
CREATE POLICY "users_select_policy" ON users
    FOR SELECT 
    USING (auth.uid() = id);

-- INSERT Policy: Users can insert their own profile (this is the key fix)
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- UPDATE Policy: Users can update their own profile
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DELETE Policy: Users can delete their own profile
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE 
    USING (auth.uid() = id);

-- ==============================================
-- STEP 4: VERIFICATION
-- ==============================================

-- Check that policies were created
SELECT 
    'Users Policies Created' as status,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Verify RLS is enabled
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users';

-- ==============================================
-- STEP 5: TEST THE FIX
-- ==============================================

-- This should now work: users can insert their own profile
-- The key is that auth.uid() = id in the WITH CHECK clause
-- This allows authenticated users to create profiles where their user ID matches the profile ID

COMMENT ON POLICY "users_insert_policy" ON users IS 
'Allows authenticated users to create profiles where the profile ID matches their auth.uid()';

COMMENT ON POLICY "users_select_policy" ON users IS 
'Allows users to view only their own profile';

COMMENT ON POLICY "users_update_policy" ON users IS 
'Allows users to update only their own profile';

COMMENT ON POLICY "users_delete_policy" ON users IS 
'Allows users to delete only their own profile';
