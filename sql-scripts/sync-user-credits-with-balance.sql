-- Sync user_credits table with users.credit_balance
-- This fixes the discrepancy where users have credits in users.credit_balance 
-- but no corresponding records in user_credits table

-- First, let's see how many users have this mismatch
SELECT 
    'MISMATCH_ANALYSIS' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN u.credit_balance > 0 AND uc.available_credits IS NULL THEN 1 END) as users_with_balance_no_credits,
    COUNT(CASE WHEN u.credit_balance = 0 AND uc.available_credits > 0 THEN 1 END) as users_with_credits_no_balance,
    COUNT(CASE WHEN u.credit_balance != COALESCE(uc.available_credits, 0) THEN 1 END) as total_mismatches
FROM auth.users u
LEFT JOIN (
    SELECT 
        user_id, 
        available_credits,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.user_credits 
    WHERE is_active = true
) uc ON u.id = uc.user_id AND uc.rn = 1;

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
    u.credit_balance, -- Assuming initial balance equals total purchased
    true,
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN (
    SELECT DISTINCT user_id
    FROM public.user_credits
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

-- Log the sync operation
INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    metadata
)
SELECT 
    u.id,
    u.credit_balance,
    'credit_sync',
    'Synced user_credits table with users.credit_balance',
    jsonb_build_object(
        'sync_date', NOW(),
        'previous_credits', COALESCE(uc.available_credits, 0),
        'new_credits', u.credit_balance,
        'operation', 'credit_system_sync'
    )
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
    AND u.id IS NOT NULL;

-- Verify the sync worked
SELECT 
    'POST_SYNC_VERIFICATION' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN u.credit_balance > 0 AND uc.available_credits IS NULL THEN 1 END) as users_with_balance_no_credits,
    COUNT(CASE WHEN u.credit_balance = 0 AND uc.available_credits > 0 THEN 1 END) as users_with_credits_no_balance,
    COUNT(CASE WHEN u.credit_balance != COALESCE(uc.available_credits, 0) THEN 1 END) as total_mismatches
FROM auth.users u
LEFT JOIN (
    SELECT 
        user_id, 
        available_credits,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.user_credits 
    WHERE is_active = true
) uc ON u.id = uc.user_id AND uc.rn = 1;

-- Show specific users who still have mismatches (if any)
SELECT 
    'REMAINING_MISMATCHES' as info,
    u.id,
    u.email,
    u.credit_balance as display_credits,
    COALESCE(uc.available_credits, 0) as generation_credits,
    (u.credit_balance - COALESCE(uc.available_credits, 0)) as discrepancy
FROM auth.users u
LEFT JOIN (
    SELECT 
        user_id, 
        available_credits,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.user_credits 
    WHERE is_active = true
) uc ON u.id = uc.user_id AND uc.rn = 1
WHERE u.credit_balance != COALESCE(uc.available_credits, 0)
ORDER BY ABS(u.credit_balance - COALESCE(uc.available_credits, 0)) DESC;
