-- ZERO OUT ALL USER CREDITS - SUBSCRIPTION MIGRATION
-- This script resets all user credits to zero to force subscription migration
-- Execute this script in Supabase SQL Editor with service role permissions

-- ============================================
-- STEP 1: BACKUP CURRENT CREDIT STATE
-- ============================================

-- Create a backup table to track what credits were reset
CREATE TABLE IF NOT EXISTS credit_reset_backup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  previous_credit_balance DECIMAL(10,2) DEFAULT 0.00,
  previous_user_credits_total DECIMAL(10,4) DEFAULT 0.00,
  previous_user_credits_used DECIMAL(10,4) DEFAULT 0.00,
  reset_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reset_reason TEXT DEFAULT 'Subscription migration - all users must subscribe'
);

-- ============================================
-- STEP 2: BACKUP CURRENT CREDIT DATA
-- ============================================

-- Insert current credit data into backup table
INSERT INTO credit_reset_backup (
  user_id, 
  email, 
  previous_credit_balance,
  previous_user_credits_total,
  previous_user_credits_used
)
SELECT 
  u.id,
  au.email,
  COALESCE(u.credit_balance, 0),
  COALESCE(uc.total_credits, 0),
  COALESCE(uc.used_credits, 0)
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
LEFT JOIN public.user_credits uc ON u.id = uc.user_id AND uc.is_active = true
WHERE COALESCE(u.credit_balance, 0) > 0 
   OR COALESCE(uc.total_credits, 0) > 0;

-- ============================================
-- STEP 3: SHOW CURRENT CREDIT SUMMARY
-- ============================================

SELECT 
  'BEFORE RESET - Credit Summary' as status,
  COUNT(*) as total_users_with_credits,
  SUM(COALESCE(u.credit_balance, 0)) as total_users_credits,
  SUM(COALESCE(uc.total_credits, 0)) as total_user_credits_table,
  ROUND(SUM(COALESCE(u.credit_balance, 0)) / 100, 2) as estimated_dollar_value
FROM public.users u
LEFT JOIN public.user_credits uc ON u.id = uc.user_id AND uc.is_active = true
WHERE COALESCE(u.credit_balance, 0) > 0 
   OR COALESCE(uc.total_credits, 0) > 0;

-- ============================================
-- STEP 4: ZERO OUT CREDITS IN USERS TABLE
-- ============================================

-- Reset all credit_balance values to 0 in users table
UPDATE public.users 
SET credit_balance = 0.00
WHERE credit_balance > 0;

-- ============================================
-- STEP 5: ZERO OUT CREDITS IN USER_CREDITS TABLE
-- ============================================

-- Reset all active credit records to zero
UPDATE public.user_credits 
SET 
  total_credits = 0.00,
  used_credits = 0.00,
  updated_at = NOW()
WHERE is_active = true 
  AND (total_credits > 0 OR used_credits > 0);

-- ============================================
-- STEP 6: ADD TRANSACTION LOGS FOR CREDIT RESET
-- ============================================

-- Log the credit reset as transactions (if credit_transactions table exists)
INSERT INTO public.credit_transactions (
  user_id,
  transaction_type,
  amount,
  description,
  metadata
)
SELECT 
  user_id,
  'credit_expired',
  0.00 - previous_credit_balance, -- Negative amount to show credits removed
  'All credits zeroed for subscription migration',
  jsonb_build_object(
    'reset_reason', 'Subscription migration',
    'previous_balance', previous_credit_balance,
    'reset_timestamp', NOW()
  )
FROM credit_reset_backup
WHERE previous_credit_balance > 0;

-- ============================================
-- STEP 7: VERIFICATION - CONFIRM ALL CREDITS ARE ZERO
-- ============================================

-- Check users table
SELECT 
  'AFTER RESET - Users Table Check' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN credit_balance > 0 THEN 1 END) as users_with_credits,
  COUNT(CASE WHEN credit_balance = 0 THEN 1 END) as users_with_zero_credits,
  SUM(credit_balance) as total_remaining_credits
FROM public.users;

-- Check user_credits table
SELECT 
  'AFTER RESET - User Credits Table Check' as status,
  COUNT(*) as total_credit_records,
  COUNT(CASE WHEN total_credits > 0 THEN 1 END) as records_with_total_credits,
  COUNT(CASE WHEN used_credits > 0 THEN 1 END) as records_with_used_credits,
  SUM(total_credits) as total_remaining_credits,
  SUM(used_credits) as total_used_credits
FROM public.user_credits 
WHERE is_active = true;

-- ============================================
-- STEP 8: FINAL SUMMARY
-- ============================================

SELECT 
  'CREDIT RESET COMPLETE' as status,
  (SELECT COUNT(*) FROM credit_reset_backup) as users_affected,
  (SELECT SUM(previous_credit_balance) FROM credit_reset_backup) as total_credits_reset,
  (SELECT ROUND(SUM(previous_credit_balance) / 100, 2) FROM credit_reset_backup) as estimated_dollar_value_reset,
  NOW() as reset_completed_at;

-- ============================================
-- STEP 9: SHOW BACKUP DATA FOR REFERENCE
-- ============================================

SELECT 
  'BACKUP DATA - Users Affected' as info,
  user_id,
  email,
  previous_credit_balance,
  previous_user_credits_total,
  reset_timestamp
FROM credit_reset_backup
ORDER BY previous_credit_balance DESC
LIMIT 20;

-- ============================================
-- NOTES FOR ADMIN
-- ============================================

/*
IMPORTANT NOTES:

1. All user credits have been reset to zero
2. Users will now be required to subscribe to use the service
3. Backup data is stored in 'credit_reset_backup' table
4. Transaction logs have been created in 'credit_transactions' table
5. Users can be notified that their credits have been reset and they need to subscribe

NEXT STEPS:
- Notify users about the credit reset
- Ensure subscription system is working properly
- Monitor for any user complaints or issues
- Consider offering a small welcome bonus for new subscribers

TO RESTORE CREDITS (if needed):
- Use the credit_reset_backup table to restore individual user credits
- Update both users.credit_balance and user_credits tables accordingly
*/
