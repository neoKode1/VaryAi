-- IMMEDIATE CREDIT RESET - EXECUTE THIS NOW
-- This is the simplified version to zero out all credits immediately

-- Step 1: Show current state
SELECT 
  'BEFORE RESET' as status,
  COUNT(*) as users_with_credits,
  SUM(COALESCE(credit_balance, 0)) as total_credits,
  ROUND(SUM(COALESCE(credit_balance, 0)) / 100, 2) as dollar_value
FROM users 
WHERE COALESCE(credit_balance, 0) > 0;

-- Step 2: Zero out all credits in users table
UPDATE users 
SET credit_balance = 0.00 
WHERE credit_balance > 0;

-- Step 3: Zero out all credits in user_credits table (if exists)
UPDATE user_credits 
SET total_credits = 0.00, used_credits = 0.00 
WHERE total_credits > 0 OR used_credits > 0;

-- Step 4: Verify reset
SELECT 
  'AFTER RESET' as status,
  COUNT(CASE WHEN credit_balance > 0 THEN 1 END) as users_still_with_credits,
  SUM(credit_balance) as total_remaining_credits
FROM users;

SELECT 'CREDIT RESET COMPLETE - ALL USERS NOW HAVE 0 CREDITS' as final_status;
