# Gallery RLS Policy Fix Instructions

## 🚨 Critical Issue
Your terminal logs show: **"RLS POLICY ISSUE DETECTED: Admin query found items but user query returned zero"**

This means users have 293 gallery items but can't see any of them due to broken RLS policies.

## 🔧 Fix Steps

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Execute This SQL Script

```sql
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
-- 5. VERIFY THE FIX
-- =====================================================

-- Test query to verify the fix works
SELECT 
    COUNT(*) as total_items,
    COUNT(DISTINCT user_id) as unique_users
FROM public.galleries;

-- Show sample items
SELECT id, user_id, created_at 
FROM public.galleries 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 3: Test the Fix
1. After running the SQL script, refresh your application
2. Check if users can now see their gallery items
3. The terminal logs should no longer show "RLS POLICY ISSUE DETECTED"

## 🎯 What This Fix Does

1. **Removes all broken policies** that were preventing users from seeing their items
2. **Creates new, correct policies** using `auth.uid() = user_id`
3. **Ensures proper table structure** with required columns
4. **Adds performance indexes** for better query speed
5. **Verifies the fix** with test queries

## ✅ Expected Result

After running this fix:
- Users will be able to see their own gallery items
- The terminal logs will show successful gallery queries
- No more "RLS POLICY ISSUE DETECTED" messages
- Gallery functionality will work properly

## 🚨 Important Notes

- This fix only affects the `galleries` table
- Users will only see their own items (not other users' items)
- The fix is safe and won't delete any data
- All existing gallery items will remain intact
