-- Direct fix for credit system mismatch
-- This will ensure user_credits table matches users.credit_balance

-- First, let's see the current state
SELECT 
    'CURRENT_STATE' as info,
    u.id,
    u.email,
    u.credit_balance as users_balance,
    COALESCE(uc.available_credits, 0) as user_credits_balance,
    (u.credit_balance - COALESCE(uc.available_credits, 0)) as mismatch
FROM auth.users u
LEFT JOIN (
    SELECT 
        user_id, 
        available_credits,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.user_credits 
    WHERE is_active = true
) uc ON u.id = uc.user_id AND uc.rn = 1
WHERE u.credit_balance > 0
ORDER BY ABS(u.credit_balance - COALESCE(uc.available_credits, 0)) DESC;

-- Create user_credits records for users who have credit_balance but no user_credits record
INSERT INTO public.user_credits (
    user_id,
    available_credits,
    total_credits_purchased,
    is_active,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.credit_balance,
    u.credit_balance,
    true,
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN (
    SELECT DISTINCT user_id
    FROM public.user_credits
    WHERE is_active = true
) uc ON u.id = uc.user_id
WHERE u.credit_balance > 0 
    AND uc.user_id IS NULL
    AND u.id IS NOT NULL;

-- Update existing user_credits records to match users.credit_balance
UPDATE public.user_credits 
SET 
    available_credits = u.credit_balance,
    updated_at = NOW()
FROM auth.users u
WHERE user_credits.user_id = u.id
    AND user_credits.is_active = true
    AND user_credits.available_credits != u.credit_balance
    AND u.credit_balance >= 0;

-- Verify the fix worked
SELECT 
    'AFTER_FIX' as info,
    u.id,
    u.email,
    u.credit_balance as users_balance,
    COALESCE(uc.available_credits, 0) as user_credits_balance,
    (u.credit_balance - COALESCE(uc.available_credits, 0)) as mismatch
FROM auth.users u
LEFT JOIN (
    SELECT 
        user_id, 
        available_credits,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.user_credits 
    WHERE is_active = true
) uc ON u.id = uc.user_id AND uc.rn = 1
WHERE u.credit_balance > 0
ORDER BY ABS(u.credit_balance - COALESCE(uc.available_credits, 0)) DESC;
