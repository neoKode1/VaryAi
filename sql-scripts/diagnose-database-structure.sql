-- COMPREHENSIVE DATABASE DIAGNOSTIC
-- This will show us exactly what exists in your Supabase database

-- 1. Check if public.users table exists and its structure
SELECT 
    'PUBLIC_USERS_TABLE' as table_info,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
         THEN 'EXISTS' 
         ELSE 'DOES_NOT_EXIST' 
    END as status;

-- If it exists, show its structure
SELECT 
    'PUBLIC_USERS_COLUMNS' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if auth.users table exists and its structure
SELECT 
    'AUTH_USERS_TABLE' as table_info,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'auth') 
         THEN 'EXISTS' 
         ELSE 'DOES_NOT_EXIST' 
    END as status;

-- If it exists, show its structure
SELECT 
    'AUTH_USERS_COLUMNS' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 3. Check user_credits table structure
SELECT 
    'USER_CREDITS_TABLE' as table_info,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'user_credits' AND table_schema = 'public') 
         THEN 'EXISTS' 
         ELSE 'DOES_NOT_EXIST' 
    END as status;

-- If it exists, show its structure
SELECT 
    'USER_CREDITS_COLUMNS' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check model_costs table structure
SELECT 
    'MODEL_COSTS_TABLE' as table_info,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'model_costs' AND table_schema = 'public') 
         THEN 'EXISTS' 
         ELSE 'DOES_NOT_EXIST' 
    END as status;

-- If it exists, show its structure and nano-banana data
SELECT 
    'MODEL_COSTS_COLUMNS' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'model_costs' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show nano-banana model data
SELECT 
    'NANO_BANANA_MODEL_DATA' as info,
    model_name,
    cost_per_generation,
    is_active,
    created_at,
    updated_at
FROM public.model_costs
WHERE model_name = 'nano-banana';

-- 5. Check credit_transactions table
SELECT 
    'CREDIT_TRANSACTIONS_TABLE' as table_info,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions' AND table_schema = 'public') 
         THEN 'EXISTS' 
         ELSE 'DOES_NOT_EXIST' 
    END as status;

-- 6. Sample data from public.users table (if it exists)
SELECT 
    'SAMPLE_PUBLIC_USERS_DATA' as info,
    id,
    email,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'credit_balance')
         THEN 'HAS_CREDIT_BALANCE_COLUMN'
         ELSE 'NO_CREDIT_BALANCE_COLUMN'
    END as credit_balance_status
FROM public.users 
LIMIT 3;

-- 7. Sample data from auth.users table (if it exists)
SELECT 
    'SAMPLE_AUTH_USERS_DATA' as info,
    id,
    email,
    'AUTH_USERS_TABLE' as table_type
FROM auth.users 
LIMIT 3;

-- 8. Check what credit-related data exists
SELECT 
    'CREDIT_SYSTEM_SUMMARY' as info,
    'Users with credit_balance > 0' as metric,
    COUNT(*) as count
FROM public.users 
WHERE credit_balance > 0;

SELECT 
    'CREDIT_SYSTEM_SUMMARY' as info,
    'Active user_credits records' as metric,
    COUNT(*) as count
FROM public.user_credits 
WHERE is_active = true;
