-- FIX TEST USER CREDITS
-- Award 10 credits to the test user who should have received them

-- ============================================
-- STEP 1: CHECK CURRENT USER STATUS
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
LEFT JOIN public.users u ON au.id = au.id
WHERE au.id = '237e93d3-2156-440e-9c0d-a012f26ba094';

-- ============================================
-- STEP 2: AWARD 10 CREDITS TO TEST USER
-- ============================================

-- Update credit balance for the test user
UPDATE public.users 
SET 
  credit_balance = credit_balance + 10.00,
  total_credits_purchased = total_credits_purchased + 10.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = '237e93d3-2156-440e-9c0d-a012f26ba094';

-- ============================================
-- STEP 3: LOG TRANSACTION
-- ============================================

-- Log transaction for test user
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
) VALUES (
  '237e93d3-2156-440e-9c0d-a012f26ba094',
  'credit_added', 
  10.00, 
  'Test user credit fix - 10 credits for 3 generations (12 nano banana images)',
  jsonb_build_object(
    'award_reason', 'Test user credit fix',
    'bonus_type', 'Generation credits',
    'generations_allowed', 3,
    'images_allowed', 12,
    'bonus_credits', 10.00,
    'bonus_value', 0.50,
    'award_date', NOW()
  )
);

-- ============================================
-- STEP 4: VERIFY THE FIX
-- ============================================

SELECT 
  'AFTER CREDIT FIX' as status,
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as name,
  u.credit_balance as current_credits,
  ROUND(u.credit_balance / 100, 2) as dollar_value,
  ROUND(u.credit_balance / 0.0398) as nano_banana_images,
  ROUND(u.credit_balance / 0.15) as premium_videos,
  u.last_credit_purchase
FROM auth.users au
LEFT JOIN public.users u ON au.id = au.id
WHERE au.id = '237e93d3-2156-440e-9c0d-a012f26ba094';

-- ============================================
-- STEP 5: CHECK ALL REMAINING USERS
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
