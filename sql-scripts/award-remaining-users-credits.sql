-- AWARD CREDITS TO ALL REMAINING USERS
-- Give all users who haven't received credits enough for 3 generations (12 nano banana images)
-- Plus give adilamahone@gmail.com specifically 125 credits

-- ============================================
-- STEP 1: CALCULATE CREDITS NEEDED
-- ============================================
-- 3 generations × 4 variations each = 12 nano banana images
-- 1 vcred = 1 nano banana image
-- 12 vcreds = 12 nano banana images = 3 generations

SELECT 
  'VCRED CALCULATION' as info,
  3 as generations,
  4 as variations_per_generation,
  12 as total_nano_banana_images,
  1 as vcreds_per_image,
  12 as vcreds_needed_for_3_generations,
  12 as vcreds_awarded_per_user;

-- ============================================
-- STEP 2: IDENTIFY USERS WHO HAVEN'T RECEIVED CREDITS
-- ============================================

SELECT 
  'USERS WITHOUT CREDITS' as status,
  au.email,
  au.raw_user_meta_data->>'full_name' as customer_name,
  COALESCE(u.credit_balance, 0) as current_credits,
  CASE 
    WHEN u.id IS NOT NULL THEN 'User exists - will award 12 vcreds'
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
-- STEP 3: AWARD 12 VCREDS TO ALL REMAINING USERS
-- ============================================

-- Update credit balance for all remaining users
UPDATE public.users 
SET 
  credit_balance = credit_balance + 12.00,
  total_credits_purchased = total_credits_purchased + 12.00,
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
-- STEP 4: AWARD INFINITE VCREDS TO adilamahone@gmail.com
-- ============================================

-- Award infinite credits to the specific user
UPDATE public.users 
SET 
  credit_balance = 999999.00,
  total_credits_purchased = total_credits_purchased + 999999.00,
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

-- Log transactions for remaining users (12 vcreds each)
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
  12.00, 
  'Welcome bonus - 12 vcreds for 3 generations (12 nano banana images)',
  jsonb_build_object(
    'award_reason', 'New user welcome bonus',
    'bonus_type', 'Generation vcreds',
    'generations_allowed', 3,
    'images_allowed', 12,
    'bonus_vcreds', 12.00,
    'bonus_value', 12.00,
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

-- Log transaction for adilamahone@gmail.com (infinite vcreds)
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
  999999.00, 
  'Special bonus - infinite vcreds for unlimited testing',
  jsonb_build_object(
    'award_reason', 'Special user infinite access',
    'bonus_type', 'Infinite vcreds',
    'bonus_vcreds', 999999.00,
    'bonus_value', 999999.00,
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
  225 as special_user_credits,
  ROUND(225 / 0.039) as special_user_nano_banana_images,
  ROUND(225 / 0.15) as special_user_premium_videos,
  'All other users' as remaining_users,
  200 as standard_bonus_credits,
  ROUND(200 / 0.039) as standard_nano_banana_images,
  'unlimited' as standard_generations_allowed;

-- ============================================
-- STEP 8: FINAL SUMMARY
-- ============================================

SELECT 
  'REMAINING USERS VCRED DISTRIBUTION COMPLETE' as status,
  'All users now have 12 vcreds for 3 generations' as message,
  'Special bonus of infinite vcreds awarded to adilamahone@gmail.com' as special_note,
  NOW() as distribution_completed_at;
