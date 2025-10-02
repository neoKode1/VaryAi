-- DISTRIBUTE FINAL CREDITS TO SPECIFIC USERS
-- Distribute $4.14 remaining budget among 3 specific users
-- Each user gets $1.38 (138 credits at $0.01 per credit)

-- ============================================
-- STEP 1: VERIFY USERS EXIST
-- ============================================

SELECT 
  'VERIFYING USERS EXIST' as status,
  u.id,
  au.email,
  COALESCE(u.credit_balance, 0) as current_credits
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email IN (
  'blvcklightai@gmail.com',
  'nayrithewitch@proton.me', 
  'grimfel@icloud.com'
);

-- ============================================
-- STEP 2: DISTRIBUTE CREDITS TO EACH USER
-- ============================================

-- Add $1.38 (138 credits) to blvcklightai@gmail.com
UPDATE public.users 
SET 
  credit_balance = credit_balance + 138.00,
  total_credits_purchased = total_credits_purchased + 138.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE au.email = 'blvcklightai@gmail.com'
);

-- Add $1.38 (138 credits) to nayrithewitch@proton.me
UPDATE public.users 
SET 
  credit_balance = credit_balance + 138.00,
  total_credits_purchased = total_credits_purchased + 138.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE au.email = 'nayrithewitch@proton.me'
);

-- Add $1.38 (138 credits) to grimfel@icloud.com
UPDATE public.users 
SET 
  credit_balance = credit_balance + 138.00,
  total_credits_purchased = total_credits_purchased + 138.00,
  last_credit_purchase = NOW(),
  updated_at = NOW()
WHERE id = (
  SELECT u.id 
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE au.email = 'grimfel@icloud.com'
);

-- ============================================
-- STEP 3: LOG CREDIT TRANSACTIONS
-- ============================================

-- Log transaction for blvcklightai@gmail.com
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
) VALUES (
  (SELECT u.id FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.email = 'blvcklightai@gmail.com'),
  'credit_added', 
  138.00, 
  'Final budget distribution - $1.38 allocated',
  jsonb_build_object(
    'distribution_reason', 'Final budget allocation',
    'dollar_amount', 1.38,
    'credit_amount', 138.00,
    'distribution_date', NOW()
  )
);

-- Log transaction for nayrithewitch@proton.me
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
) VALUES (
  (SELECT u.id FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.email = 'nayrithewitch@proton.me'),
  'credit_added', 
  138.00, 
  'Final budget distribution - $1.38 allocated',
  jsonb_build_object(
    'distribution_reason', 'Final budget allocation',
    'dollar_amount', 1.38,
    'credit_amount', 138.00,
    'distribution_date', NOW()
  )
);

-- Log transaction for grimfel@icloud.com
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
) VALUES (
  (SELECT u.id FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.email = 'grimfel@icloud.com'),
  'credit_added', 
  138.00, 
  'Final budget distribution - $1.38 allocated',
  jsonb_build_object(
    'distribution_reason', 'Final budget allocation',
    'dollar_amount', 1.38,
    'credit_amount', 138.00,
    'distribution_date', NOW()
  )
);

-- ============================================
-- STEP 4: VERIFY CREDIT DISTRIBUTION
-- ============================================

SELECT 
  'AFTER DISTRIBUTION - Credit Status' as status,
  au.email,
  u.credit_balance as current_credits,
  ROUND(u.credit_balance / 100, 2) as dollar_value,
  u.last_credit_purchase
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email IN (
  'blvcklightai@gmail.com',
  'nayrithewitch@proton.me', 
  'grimfel@icloud.com'
)
ORDER BY au.email;

-- ============================================
-- STEP 5: FINAL SUMMARY
-- ============================================

SELECT 
  'DISTRIBUTION COMPLETE' as status,
  3 as users_credited,
  414.00 as total_credits_distributed,
  4.14 as total_dollars_distributed,
  138.00 as credits_per_user,
  1.38 as dollars_per_user,
  NOW() as distribution_completed_at;

-- ============================================
-- STEP 6: SHOW RECENT TRANSACTIONS
-- ============================================

SELECT 
  'RECENT TRANSACTIONS' as info,
  ct.user_id,
  au.email,
  ct.transaction_type,
  ct.amount,
  ct.description,
  ct.created_at
FROM public.credit_transactions ct
LEFT JOIN auth.users au ON ct.user_id = au.id
WHERE ct.description LIKE '%Final budget distribution%'
ORDER BY ct.created_at DESC;
