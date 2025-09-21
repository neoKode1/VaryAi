-- Fixed Credit System SQL (No ON CONFLICT issues)
-- This version handles the missing columns without conflict constraints

-- Step 1: Add missing columns to user_credits table
ALTER TABLE public.user_credits 
ADD COLUMN IF NOT EXISTS total_credits DECIMAL(10,4) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS used_credits DECIMAL(10,4) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS available_credits DECIMAL(10,4) GENERATED ALWAYS AS (total_credits - used_credits) STORED,
ADD COLUMN IF NOT EXISTS credit_type TEXT DEFAULT 'grandfathered',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Clear existing user_credits records (to avoid conflicts)
DELETE FROM public.user_credits;

-- Step 3: Create fresh credit records for all users
INSERT INTO public.user_credits (user_id, total_credits, used_credits, credit_type, is_active)
SELECT 
  u.id,
  COALESCE(u.credit_balance, 0),
  0,
  'grandfathered',
  true
FROM public.users u;

-- Step 4: Show final status
SELECT 
  'Credit System Fix Complete' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN credit_balance > 0 THEN 1 END) as users_with_credits,
  COUNT(CASE WHEN credit_balance = 0 THEN 1 END) as users_without_credits
FROM public.users;

-- Step 5: Verify user_credits table
SELECT 
  'User Credits Table Status' as check_type,
  COUNT(*) as total_credit_records,
  COUNT(CASE WHEN available_credits > 0 THEN 1 END) as records_with_credits,
  COUNT(CASE WHEN available_credits = 0 THEN 1 END) as records_without_credits
FROM public.user_credits;
