-- AWARD CREDITS TO DAVID BADURINA
-- Customer purchased $6.25 worth of credits (125 credits)
-- Email: infj@davidbadurina.com

-- ============================================
-- STEP 1: VERIFY USER EXISTS
-- ============================================

SELECT 
  'VERIFYING USER EXISTS' as status,
  u.id,
  au.email,
  COALESCE(u.credit_balance, 0) as current_credits,
  ROUND(COALESCE(u.credit_balance, 0) / 100, 2) as current_dollar_value
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email = 'infj@davidbadurina.com';

-- ============================================
-- STEP 2: ADD CREDITS TO USER ACCOUNT
-- ============================================

-- Add 125 credits ($6.25) to David Badurina's account
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
  WHERE au.email = 'infj@davidbadurina.com'
);

-- ============================================
-- STEP 3: LOG CREDIT TRANSACTION
-- ============================================

-- Log the credit purchase transaction
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description,
  metadata
) VALUES (
  (SELECT u.id FROM public.users u LEFT JOIN auth.users au ON u.id = au.id WHERE au.email = 'infj@davidbadurina.com'),
  'credit_added', 
  125.00, 
  'Credits purchased via Stripe - $6.25 payment',
  jsonb_build_object(
    'payment_amount', 6.25,
    'payment_currency', 'USD',
    'credits_purchased', 125.00,
    'payment_id', 'pi_3SDt1CA2eb3W4RrA06Q3ccPA',
    'payment_method', 'Visa card ending in 1597',
    'customer_email', 'infj@davidbadurina.com',
    'customer_name', 'David Badurina',
    'purchase_date', NOW()
  )
);

-- ============================================
-- STEP 4: VERIFY CREDIT AWARD
-- ============================================

SELECT 
  'AFTER CREDIT AWARD - Account Status' as status,
  au.email,
  au.raw_user_meta_data->>'full_name' as customer_name,
  u.credit_balance as current_credits,
  ROUND(u.credit_balance / 100, 2) as dollar_value,
  u.total_credits_purchased as lifetime_credits,
  ROUND(u.total_credits_purchased / 100, 2) as lifetime_dollar_value,
  u.last_credit_purchase
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.email = 'infj@davidbadurina.com';

-- ============================================
-- STEP 5: SHOW RECENT TRANSACTIONS
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
WHERE au.email = 'infj@davidbadurina.com'
ORDER BY ct.created_at DESC
LIMIT 5;

-- ============================================
-- STEP 6: FINAL SUMMARY
-- ============================================

SELECT 
  'CREDIT AWARD COMPLETE' as status,
  'infj@davidbadurina.com' as customer_email,
  'David Badurina' as customer_name,
  125.00 as credits_awarded,
  6.25 as dollar_amount_paid,
  NOW() as award_completed_at;
