-- Check your test user's credit status in both systems
-- Replace 'your-test-user-email@example.com' with the actual email

-- Check if user exists in public.users table
SELECT 
    'PUBLIC_USERS_CHECK' as info,
    id,
    email,
    CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' AND column_name = 'credit_balance')
         THEN 'HAS_CREDIT_BALANCE_COLUMN'
         ELSE 'NO_CREDIT_BALANCE_COLUMN'
    END as credit_balance_status
FROM public.users 
WHERE email = 'your-test-user-email@example.com';

-- Check user_credits table for this user
SELECT 
    'USER_CREDITS_CHECK' as info,
    user_id,
    available_credits,
    is_active,
    created_at
FROM public.user_credits 
WHERE user_id = (
    SELECT id FROM public.users WHERE email = 'your-test-user-email@example.com'
    UNION
    SELECT id FROM auth.users WHERE email = 'your-test-user-email@example.com'
    LIMIT 1
);

-- Check auth.users table if public.users doesn't have the user
SELECT 
    'AUTH_USERS_CHECK' as info,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'your-test-user-email@example.com';
