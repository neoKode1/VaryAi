-- AWARD CREDITS TO ANY SPECIFIC USER
-- Use this script to award 10 credits to any user by email
-- Replace 'YOUR_EMAIL_HERE' with the actual email address

-- ============================================
-- STEP 1: CHECK USER STATUS (REPLACE EMAIL)
-- ============================================

SELECT 
  'CURRENT USER STATUS' as info,
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as name,
  COALESCE(u.credit_balance, 0) as current_credits,
  u.total_credits_purchased as lifetime_credits,
  u.last_credit_purchase
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- ⚠️ REPLACE WITH ACTUAL EMAIL

-- ============================================
-- STEP 2: AWARD 10 CREDITS TO USER (REPLACE EMAIL)
-- ============================================

-- Update credit balance for the user
UPDATE public.users 
SET 
  credit_balance = credit_balance + 10.00,
  total_credits_purchased = total_credits_purchased + 10.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT au.id 
  FROM auth.users au
  WHERE au.email = 'YOUR_EMAIL_HERE'  -- ⚠️ REPLACE WITH ACTUAL EMAIL
);

-- ============================================
-- STEP 3: LOG TRANSACTION (REPLACE EMAIL)
-- ============================================

-- Log transaction for the user
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
)
SELECT 
  au.id,
  'credit_added', 
  10.00, 
  'User credit award - 10 credits for 3 generations (12 nano banana images)',
  jsonb_build_object(
    'award_reason', 'User credit award',
    'bonus_type', 'Generation credits',
    'generations_allowed', 3,
    'images_allowed', 12,
    'bonus_credits', 10.00,
    'bonus_value', 0.50,
    'award_date', NOW()
  )
FROM auth.users au
WHERE au.email = 'YOUR_EMAIL_HERE'  -- ⚠️ REPLACE WITH ACTUAL EMAIL
AND au.id IS NOT NULL;

-- ============================================
-- STEP 4: VERIFY THE FIX (REPLACE EMAIL)
-- ============================================

SELECT 
  'AFTER CREDIT AWARD' as status,
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as name,
  u.credit_balance as current_credits,
  ROUND(u.credit_balance / 100, 2) as dollar_value,
  ROUND(u.credit_balance / 0.0398) as nano_banana_images,
  ROUND(u.credit_balance / 0.15) as premium_videos,
  u.last_credit_purchase
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- ⚠️ REPLACE WITH ACTUAL EMAIL

-- ============================================
-- STEP 5: SHOW ALL REMAINING USERS
-- ============================================

SELECT 
  'ALL REMAINING USERS STATUS' as info,
  au.email,
  COALESCE(u.credit_balance, 0) as current_credits,
  CASE 
    WHEN u.credit_balance >= 10 THEN '✅ Has enough credits'
    WHEN u.credit_balance > 0 THEN '⚠️ Has some credits'
    ELSE '❌ Needs credits'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email NOT IN (
  'blvcklightai@gmail.com',
  'laura@musicvideoshow.ai',
  'infj@davidbadurina.com',
  'hthighway@pwhdesigns.com',
  'kgable38@gmail.com',
  'nayrithewitch@proton.me',
  'grimfel@icloud.com',
  '1deeptechnology@gmail.com'
)
ORDER BY u.credit_balance DESC;
