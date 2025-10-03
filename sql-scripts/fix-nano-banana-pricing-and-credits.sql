-- Fix nano-banana pricing and credit system mismatch
-- This addresses the specific issues identified

-- 1. Update nano-banana cost to match the actual FAL AI pricing (0.0398)
UPDATE public.model_costs 
SET 
    cost_per_generation = 0.0398,
    updated_at = NOW()
WHERE model_name = 'nano-banana';

-- 2. Create user_credits records for all users who have credit_balance but no user_credits record
INSERT INTO public.user_credits (
    user_id,
    available_credits,
    is_active,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.credit_balance,
    true,
    NOW(),
    NOW()
FROM public.users u
LEFT JOIN (
    SELECT DISTINCT user_id
    FROM public.user_credits
    WHERE is_active = true
) uc ON u.id = uc.user_id
WHERE u.credit_balance > 0 
    AND uc.user_id IS NULL
    AND u.id IS NOT NULL;

-- 3. Update existing user_credits records to match users.credit_balance
UPDATE public.user_credits 
SET 
    available_credits = u.credit_balance,
    updated_at = NOW()
FROM public.users u
WHERE user_credits.user_id = u.id
    AND user_credits.is_active = true
    AND user_credits.available_credits != u.credit_balance
    AND u.credit_balance >= 0;

-- 4. Verify the fixes
SELECT 
    'NANO_BANANA_COST_VERIFICATION' as info,
    model_name,
    cost_per_generation,
    is_active
FROM public.model_costs
WHERE model_name = 'nano-banana';

-- 5. Show credit system status for users with credits
SELECT 
    'CREDIT_SYSTEM_VERIFICATION' as info,
    u.id,
    u.email,
    u.credit_balance as users_balance,
    COALESCE(uc.available_credits, 0) as user_credits_balance,
    (u.credit_balance - COALESCE(uc.available_credits, 0)) as mismatch,
    CASE 
        WHEN u.credit_balance = COALESCE(uc.available_credits, 0) THEN 'SYNCED'
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
WHERE u.credit_balance > 0
ORDER BY ABS(u.credit_balance - COALESCE(uc.available_credits, 0)) DESC;
