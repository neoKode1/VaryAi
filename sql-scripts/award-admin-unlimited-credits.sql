-- AWARD ADMIN UNLIMITED CREDITS FOR TESTING
-- Email: 1deeptechnology@gmail.com
-- This gives the admin account a large amount of credits for testing purposes

-- ============================================
-- STEP 1: VERIFY ADMIN USER EXISTS
-- ============================================

SELECT 
  'VERIFYING ADMIN USER EXISTS' as status,
  u.id,
  au.email,
  COALESCE(u.credit_balance, 0) as current_credits,
  u.is_admin,
  ROUND(COALESCE(u.credit_balance, 0) / 100, 2) as current_dollar_value
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email = '1deeptechnology@gmail.com';

-- ============================================
-- STEP 2: SET ADMIN FLAG AND AWARD UNLIMITED CREDITS
-- ============================================

-- Set admin flag and award 100,000 credits (equivalent to $5,000) for testing
UPDATE public.users 
SET 
  credit_balance = 100000.00,
  is_admin = true,
  total_credits_purchased = total_credits_purchased + 100000.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE au.email = '1deeptechnology@gmail.com'
);

-- ============================================
-- STEP 3: LOG ADMIN CREDIT TRANSACTION
-- ============================================

-- Log the admin credit award transaction
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
) VALUES (
  (SELECT u.id FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.email = '1deeptechnology@gmail.com'),
  'credit_added', 
  100000.00, 
  'Admin unlimited credits for testing - 100,000 credits awarded',
  jsonb_build_object(
    'award_reason', 'Admin testing credits',
    'credits_awarded', 100000.00,
    'dollar_value', 5000.00,
    'admin_email', '1deeptechnology@gmail.com',
    'award_date', NOW(),
    'testing_purpose', true
  )
);

-- ============================================
-- STEP 4: VERIFY ADMIN CREDITS AWARDED
-- ============================================

SELECT 
  'AFTER ADMIN CREDIT AWARD - Account Status' as status,
  au.email,
  au.raw_user_meta_data->>'full_name' as admin_name,
  u.credit_balance as current_credits,
  ROUND(u.credit_balance / 100, 2) as dollar_value,
  u.is_admin,
  u.total_credits_purchased as lifetime_credits,
  ROUND(u.total_credits_purchased / 100, 2) as lifetime_dollar_value,
  u.last_credit_purchase,
  u.updated_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email = '1deeptechnology@gmail.com';

-- ============================================
-- STEP 5: SHOW WHAT ADMIN CAN GENERATE
-- ============================================

SELECT 
  'ADMIN GENERATION CAPACITY' as info,
  'With 100,000 credits, admin can generate:' as description,
  ROUND(100000 / 0.0398) as nano_banana_images,
  ROUND(100000 / 0.15) as premium_video_generations,
  ROUND(100000 / 2.50) as ultra_premium_generations,
  'This should be more than enough for extensive testing!' as note;

-- ============================================
-- STEP 6: SHOW RECENT TRANSACTIONS
-- ============================================

SELECT 
  'RECENT ADMIN TRANSACTIONS' as info,
  ct.user_id,
  au.email,
  ct.transaction_type,
  ct.amount,
  ct.description,
  ct.created_at
FROM public.credit_transactions ct
LEFT JOIN auth.users au ON ct.user_id = au.id
WHERE au.email = '1deeptechnology@gmail.com'
ORDER BY ct.created_at DESC
LIMIT 5;

-- ============================================
-- STEP 7: FINAL SUMMARY
-- ============================================

SELECT 
  'ADMIN CREDIT AWARD COMPLETE' as status,
  '1deeptechnology@gmail.com' as admin_email,
  100000.00 as credits_awarded,
  5000.00 as dollar_value,
  'Admin can now test all features extensively!' as message,
  NOW() as award_completed_at;
