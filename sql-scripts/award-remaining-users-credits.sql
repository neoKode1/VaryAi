-- AWARD CREDITS TO ALL REMAINING USERS
-- Give all users who haven't received credits enough for 3 generations (12 nano banana images)
-- Plus give adilamahone@gmail.com specifically 125 credits

-- ============================================
-- STEP 1: CALCULATE CREDITS NEEDED
-- ============================================
-- 3 generations × 4 variations each = 12 nano banana images
-- 12 images × $0.0398 per image = $0.4776
-- At $0.05 per credit: $0.4776 ÷ $0.05 = 9.552 credits
-- Round up to 10 credits for safety

SELECT 
  'CREDIT CALCULATION' as info,
  3 as generations,
  4 as variations_per_generation,
  12 as total_nano_banana_images,
  0.0398 as cost_per_image,
  0.4776 as total_cost,
  0.05 as cost_per_credit,
  10 as credits_needed_for_3_generations;

-- ============================================
-- STEP 2: IDENTIFY USERS WHO HAVEN'T RECEIVED CREDITS
-- ============================================

SELECT 
  'USERS WITHOUT CREDITS' as status,
  au.email,
  au.raw_user_meta_data->>'full_name' as customer_name,
  COALESCE(u.credit_balance, 0) as current_credits,
  CASE 
    WHEN u.id IS NOT NULL THEN 'User exists - will award 10 credits'
    ELSE 'User NOT found - will skip'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email NOT IN (
  -- Exclude users who already received credits from previous scripts
  'blvcklightai@gmail.com',        -- Already got 500 credits
  'laura@musicvideoshow.ai',       -- Already got 300 credits
  'infj@davidbadurina.com',        -- Already got 200 credits
  'hthighway@pwhdesigns.com',      -- Already got 200 credits
  'kgable38@gmail.com',            -- Already got 200 credits
  'nayrithewitch@proton.me',       -- Already got 138 credits
  'grimfel@icloud.com',            -- Already got 138 credits
  '1deeptechnology@gmail.com'      -- Admin with unlimited credits
)
AND (u.credit_balance IS NULL OR u.credit_balance = 0)
ORDER BY au.email;

-- ============================================
-- STEP 3: AWARD 10 CREDITS TO ALL REMAINING USERS
-- ============================================

-- Update credit balance for all remaining users
UPDATE public.users 
SET 
  credit_balance = credit_balance + 10.00,
  total_credits_purchased = total_credits_purchased + 10.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id IN (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
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
  AND u.id IS NOT NULL
);

-- ============================================
-- STEP 4: AWARD SPECIFIC 125 CREDITS TO adilamahone@gmail.com
-- ============================================

-- Award 125 credits to the specific user
UPDATE public.users 
SET 
  credit_balance = credit_balance + 125.00,
  total_credits_purchased = total_credits_purchased + 125.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE au.email = 'adilamahone@gmail.com'
);

-- ============================================
-- STEP 5: LOG TRANSACTIONS FOR ALL USERS
-- ============================================

-- Log transactions for remaining users (10 credits each)
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
)
SELECT 
  u.id,
  'credit_added', 
  10.00, 
  'Welcome bonus - 10 credits for 3 generations (12 nano banana images)',
  jsonb_build_object(
    'award_reason', 'New user welcome bonus',
    'bonus_type', 'Generation credits',
    'generations_allowed', 3,
    'images_allowed', 12,
    'bonus_credits', 10.00,
    'bonus_value', 0.50,
    'award_date', NOW()
  )
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
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
AND u.id IS NOT NULL;

-- Log transaction for adilamahone@gmail.com (125 credits)
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
)
SELECT 
  u.id,
  'credit_added', 
  125.00, 
  'Special bonus - 125 credits ($6.25 value)',
  jsonb_build_object(
    'award_reason', 'Special user bonus',
    'bonus_type', 'Premium credits',
    'bonus_credits', 125.00,
    'bonus_value', 6.25,
    'award_date', NOW()
  )
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email = 'adilamahone@gmail.com' AND u.id IS NOT NULL;

-- ============================================
-- STEP 6: VERIFY CREDITS AWARDED
-- ============================================

SELECT 
  'AFTER CREDIT AWARDS - All Users' as status,
  au.email,
  au.raw_user_meta_data->>'full_name' as customer_name,
  u.credit_balance as current_credits,
  ROUND(u.credit_balance / 100, 2) as dollar_value,
  ROUND(u.credit_balance / 0.0398) as nano_banana_images,
  ROUND(u.credit_balance / 0.15) as premium_videos,
  u.last_credit_purchase
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.credit_balance > 0
ORDER BY u.credit_balance DESC;

-- ============================================
-- STEP 7: SHOW GENERATION CAPACITY
-- ============================================

SELECT 
  'GENERATION CAPACITY SUMMARY' as info,
  'adilamahone@gmail.com' as special_user,
  125 as special_user_credits,
  ROUND(125 / 0.0398) as special_user_nano_banana_images,
  ROUND(125 / 0.15) as special_user_premium_videos,
  'All other users' as remaining_users,
  10 as standard_bonus_credits,
  ROUND(10 / 0.0398) as standard_nano_banana_images,
  3 as standard_generations_allowed;

-- ============================================
-- STEP 8: FINAL SUMMARY
-- ============================================

SELECT 
  'REMAINING USERS CREDIT DISTRIBUTION COMPLETE' as status,
  'All users now have credits to generate at least 3 times' as message,
  'Special bonus of 125 credits awarded to adilamahone@gmail.com' as special_note,
  NOW() as distribution_completed_at;
