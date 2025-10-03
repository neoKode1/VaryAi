-- SIMPLE STEP-BY-STEP DIAGNOSTIC
-- Run each section separately to see what works

-- Step 1: Check what tables exist in public schema
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 2: Check what tables exist in auth schema
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
ORDER BY table_name;

-- Step 3: Check if public.users exists and has data
SELECT 
    'PUBLIC_USERS_EXISTS' as check_type,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
         THEN 'YES' 
         ELSE 'NO' 
    END as exists;

-- Step 4: If public.users exists, show its columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: If public.users exists, show sample data
SELECT id, email, created_at
FROM public.users 
LIMIT 3;

-- Step 6: Check user_credits table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Show sample user_credits data
SELECT 
    user_id,
    available_credits,
    is_active,
    created_at
FROM public.user_credits 
LIMIT 5;

-- Step 8: Check model_costs table
SELECT 
    model_name,
    cost_per_generation,
    is_active
FROM public.model_costs 
WHERE model_name = 'nano-banana';
