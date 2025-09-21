-- Fix Gallery RLS Policies
-- This script fixes the critical RLS policy issue where users can't see their own gallery items

-- =====================================================
-- 1. DROP ALL EXISTING GALLERY POLICIES
-- =====================================================

-- Drop all existing policies on galleries table
DROP POLICY IF EXISTS "galleries_select_policy" ON public.galleries;
DROP POLICY IF EXISTS "galleries_insert_policy" ON public.galleries;
DROP POLICY IF EXISTS "galleries_update_policy" ON public.galleries;
DROP POLICY IF EXISTS "galleries_delete_policy" ON public.galleries;
DROP POLICY IF EXISTS "Users can view their own gallery items" ON public.galleries;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON public.galleries;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON public.galleries;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON public.galleries;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.galleries;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.galleries;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.galleries;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.galleries;

-- =====================================================
-- 2. CREATE NEW, CORRECT GALLERY POLICIES
-- =====================================================

-- Enable RLS on galleries table
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (users can view their own gallery items)
CREATE POLICY "galleries_select_policy" ON public.galleries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for INSERT (users can insert their own gallery items)
CREATE POLICY "galleries_insert_policy" ON public.galleries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (users can update their own gallery items)
CREATE POLICY "galleries_update_policy" ON public.galleries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (users can delete their own gallery items)
CREATE POLICY "galleries_delete_policy" ON public.galleries
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. VERIFY GALLERY TABLE STRUCTURE
-- =====================================================

-- Check if galleries table has the correct structure
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'galleries' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.galleries ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'galleries' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.galleries ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_galleries_user_id ON public.galleries(user_id);
CREATE INDEX IF NOT EXISTS idx_galleries_created_at ON public.galleries(created_at);

-- =====================================================
-- 5. TEST QUERY TO VERIFY FIX
-- =====================================================

-- This query should work for authenticated users
-- SELECT COUNT(*) FROM public.galleries WHERE user_id = auth.uid();

COMMENT ON POLICY "galleries_select_policy" ON public.galleries IS 'Users can view their own gallery items';
COMMENT ON POLICY "galleries_insert_policy" ON public.galleries IS 'Users can insert their own gallery items';
COMMENT ON POLICY "galleries_update_policy" ON public.galleries IS 'Users can update their own gallery items';
COMMENT ON POLICY "galleries_delete_policy" ON public.galleries IS 'Users can delete their own gallery items';
