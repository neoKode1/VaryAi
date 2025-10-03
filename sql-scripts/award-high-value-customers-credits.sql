-- AWARD CREDITS TO HIGH-VALUE CUSTOMERS
-- Based on unified_customers.csv analysis - targeting customers who spent $50+
-- This rewards your most valuable customers with additional credits

-- ============================================
-- STEP 1: IDENTIFY HIGH-VALUE CUSTOMERS
-- ============================================

SELECT 
  'HIGH-VALUE CUSTOMERS IDENTIFIED' as status,
  au.email,
  au.raw_user_meta_data->>'full_name' as customer_name,
  COALESCE(u.credit_balance, 0) as current_credits,
  CASE 
    WHEN u.id IS NOT NULL THEN 'User exists - will award credits'
    ELSE 'User NOT found - will skip'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE au.email IN (
  -- Top customers from unified_customers.csv
  'blvcklightai@gmail.com',        -- $250.00
  'laura@musicvideoshow.ai',       -- $100.00
  'infj@davidbadurina.com',        -- $66.25 (2 payments)
  'hthighway@pwhdesigns.com',      -- $50.00
  'kgable38@gmail.com'             -- $50.00
)
ORDER BY au.email;

-- ============================================
-- STEP 2: AWARD CREDITS TO TOP CUSTOMER ($250 SPENT)
-- ============================================

-- Award 500 credits ($25 value) to blvcklightai@gmail.com
UPDATE public.users 
SET 
  credit_balance = credit_balance + 500.00,
  total_credits_purchased = total_credits_purchased + 500.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE au.email = 'blvcklightai@gmail.com'
);

-- Log transaction for top customer (only if user exists)
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
  500.00, 
  'High-value customer bonus - 500 credits ($25 value)',
  jsonb_build_object(
    'award_reason', 'Top customer bonus',
    'customer_tier', 'VIP',
    'original_spend', 250.00,
    'bonus_credits', 500.00,
    'bonus_value', 25.00,
    'award_date', NOW()
  )
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email = 'blvcklightai@gmail.com' AND u.id IS NOT NULL;

-- ============================================
-- STEP 3: AWARD CREDITS TO SECOND TIER ($100 SPENT)
-- ============================================

-- Award 300 credits ($15 value) to laura@musicvideoshow.ai
UPDATE public.users 
SET 
  credit_balance = credit_balance + 300.00,
  total_credits_purchased = total_credits_purchased + 300.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE au.email = 'laura@musicvideoshow.ai'
);

-- Log transaction for second tier (only if user exists)
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
  300.00, 
  'High-value customer bonus - 300 credits ($15 value)',
  jsonb_build_object(
    'award_reason', 'High-value customer bonus',
    'customer_tier', 'Premium',
    'original_spend', 100.00,
    'bonus_credits', 300.00,
    'bonus_value', 15.00,
    'award_date', NOW()
  )
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email = 'laura@musicvideoshow.ai' AND u.id IS NOT NULL;

-- ============================================
-- STEP 4: AWARD CREDITS TO THIRD TIER ($50+ SPENT)
-- ============================================

-- Award 200 credits ($10 value) to remaining high-value customers
UPDATE public.users 
SET 
  credit_balance = credit_balance + 200.00,
  total_credits_purchased = total_credits_purchased + 200.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id IN (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE au.email IN (
    'infj@davidbadurina.com',
    'hthighway@pwhdesigns.com',
    'kgable38@gmail.com'
  )
);

-- Log transactions for third tier
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
  200.00, 
  'High-value customer bonus - 200 credits ($10 value)',
  jsonb_build_object(
    'award_reason', 'High-value customer bonus',
    'customer_tier', 'Premium',
    'original_spend', CASE 
      WHEN au.email = 'infj@davidbadurina.com' THEN 66.25
      WHEN au.email = 'hthighway@pwhdesigns.com' THEN 50.00
      WHEN au.email = 'kgable38@gmail.com' THEN 50.00
    END,
    'bonus_credits', 200.00,
    'bonus_value', 10.00,
    'award_date', NOW()
  )
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email IN (
  'infj@davidbadurina.com',
  'hthighway@pwhdesigns.com',
  'kgable38@gmail.com'
);

-- ============================================
-- STEP 5: VERIFY CREDITS AWARDED
-- ============================================

SELECT 
  'AFTER CREDIT AWARDS - High-Value Customers' as status,
  au.email,
  au.raw_user_meta_data->>'full_name' as customer_name,
  u.credit_balance as current_credits,
  ROUND(u.credit_balance / 100, 2) as dollar_value,
  u.total_credits_purchased as lifetime_credits,
  ROUND(u.total_credits_purchased / 100, 2) as lifetime_dollar_value,
  u.last_credit_purchase
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email IN (
  'blvcklightai@gmail.com',
  'laura@musicvideoshow.ai',
  'infj@davidbadurina.com',
  'hthighway@pwhdesigns.com',
  'kgable38@gmail.com'
)
ORDER BY u.credit_balance DESC;

-- ============================================
-- STEP 6: SHOW GENERATION CAPACITY
-- ============================================

SELECT 
  'GENERATION CAPACITY - After Bonus' as info,
  au.email,
  u.credit_balance as credits,
  ROUND(u.credit_balance / 0.0398) as nano_banana_images,
  ROUND(u.credit_balance / 0.15) as premium_videos,
  ROUND(u.credit_balance / 2.50) as ultra_premium_generations
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email IN (
  'blvcklightai@gmail.com',
  'laura@musicvideoshow.ai',
  'infj@davidbadurina.com',
  'hthighway@pwhdesigns.com',
  'kgable38@gmail.com'
)
ORDER BY u.credit_balance DESC;

-- ============================================
-- STEP 7: FINAL SUMMARY
-- ============================================

SELECT 
  'HIGH-VALUE CUSTOMER REWARDS COMPLETE' as status,
  5 as customers_rewarded,
  1400.00 as total_credits_awarded,
  70.00 as total_dollar_value_awarded,
  'Top customers rewarded based on spending history' as message,
  NOW() as award_completed_at;
