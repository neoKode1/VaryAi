-- Debug script to check test user credit status
-- This will help identify the discrepancy between display credits and generation credits

-- First, let's find the test user by email or ID
-- Replace 'your-test-user-email@example.com' with the actual test user email
-- Or replace 'user-id-here' with the actual user ID

-- Check user_credits table (used by generation system)
SELECT 
    'USER_CREDITS TABLE' as source,
    uc.user_id,
    uc.available_credits,
    uc.is_active,
    uc.created_at,
    uc.updated_at
FROM public.user_credits uc
WHERE uc.user_id = '237e93d3-2156-440e-9c0d-a012f26ba094'  -- Replace with actual user ID
ORDER BY uc.created_at DESC;

-- Check users table credit_balance (used by display system)
SELECT 
    'USERS TABLE' as source,
    u.id,
    u.email,
    u.credit_balance,
    u.is_admin,
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE u.id = '237e93d3-2156-440e-9c0d-a012f26ba094'  -- Replace with actual user ID;

-- Check if there are any credit transactions for this user
SELECT 
    'CREDIT_TRANSACTIONS' as source,
    ct.user_id,
    ct.amount,
    ct.transaction_type,
    ct.description,
    ct.created_at
FROM public.credit_transactions ct
WHERE ct.user_id = '237e93d3-2156-440e-9c0d-a012f26ba094'  -- Replace with actual user ID
ORDER BY ct.created_at DESC
LIMIT 10;

-- Check model_costs table to see what nano-banana costs
SELECT 
    'MODEL_COSTS' as source,
    mc.model_name,
    mc.cost_per_generation,
    mc.is_active
FROM public.model_costs mc
WHERE mc.model_name = 'nano-banana';

-- Summary query to see the discrepancy
SELECT 
    'SUMMARY' as info,
    u.id,
    u.email,
    u.credit_balance as display_credits,
    COALESCE(uc.available_credits, 0) as generation_credits,
    (u.credit_balance - COALESCE(uc.available_credits, 0)) as discrepancy,
    u.is_admin,
    CASE 
        WHEN u.credit_balance > 0 AND COALESCE(uc.available_credits, 0) = 0 THEN 'DISPLAY_HAS_CREDITS_GENERATION_HAS_NONE'
        WHEN u.credit_balance = 0 AND COALESCE(uc.available_credits, 0) > 0 THEN 'DISPLAY_HAS_NONE_GENERATION_HAS_CREDITS'
        WHEN u.credit_balance = COALESCE(uc.available_credits, 0) THEN 'BOTH_MATCH'
        ELSE 'MISMATCH'
    END as status
FROM auth.users u
LEFT JOIN (
    SELECT 
        user_id, 
        available_credits,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.user_credits 
    WHERE is_active = true
) uc ON u.id = uc.user_id AND uc.rn = 1
WHERE u.id = '237e93d3-2156-440e-9c0d-a012f26ba094';  -- Replace with actual user ID
