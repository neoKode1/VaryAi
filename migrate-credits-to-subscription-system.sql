-- Migrate Credits to Subscription System
-- This script migrates legacy credits to the new subscription-based system

-- =====================================================
-- 1. ENSURE USER_CREDITS TABLE EXISTS WITH CORRECT SCHEMA
-- =====================================================

-- Create user_credits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_credits DECIMAL(10,4) DEFAULT 0.00 NOT NULL,
  used_credits DECIMAL(10,4) DEFAULT 0.00 NOT NULL,
  available_credits DECIMAL(10,4) GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  credit_type TEXT DEFAULT 'grandfathered' CHECK (credit_type IN ('grandfathered', 'purchased', 'bonus', 'refund', 'subscription')),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, credit_type)
);

-- =====================================================
-- 2. MIGRATE LEGACY CREDITS TO NEW SYSTEM
-- =====================================================

-- Migrate users with existing credit_balance to user_credits table
-- First, delete any existing grandfathered credits to avoid conflicts
DELETE FROM public.user_credits 
WHERE credit_type = 'grandfathered';

-- Then insert fresh grandfathered credits
INSERT INTO public.user_credits (user_id, total_credits, credit_type, expires_at)
SELECT 
    u.id as user_id,
    COALESCE(u.credit_balance, 0) as total_credits,
    'grandfathered' as credit_type,
    NOW() + INTERVAL '6 months' as expires_at
FROM public.users u
WHERE u.credit_balance > 0;

-- =====================================================
-- 3. CREATE CREDIT TRANSACTIONS FOR MIGRATION
-- =====================================================

-- Create credit_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit_added', 'credit_used', 'credit_refunded', 'credit_expired', 'credit_migrated')),
  amount DECIMAL(10,4) NOT NULL,
  model_name TEXT,
  generation_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log the migration transactions
INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description)
SELECT 
    u.id as user_id,
    'credit_migrated' as transaction_type,
    COALESCE(u.credit_balance, 0) as amount,
    'Migrated legacy credits to grandfathered status with 6-month expiration' as description
FROM public.users u
WHERE u.credit_balance > 0;

-- =====================================================
-- 4. UPDATE USER TIERS FOR SUBSCRIPTION SYSTEM
-- =====================================================

-- Update user tiers to reflect subscription system
UPDATE public.users 
SET tier = CASE 
    WHEN credit_balance > 100 THEN 'heavy'
    WHEN credit_balance > 50 THEN 'weeklyPro'
    ELSE 'pay_per_use'
END
WHERE tier IS NULL OR tier = 'free';

-- =====================================================
-- 5. CREATE HELPFUL FUNCTIONS
-- =====================================================

-- Function to get user's total available credits
CREATE OR REPLACE FUNCTION get_user_total_credits(p_user_id UUID)
RETURNS DECIMAL(10,4) AS $$
DECLARE
    total_credits DECIMAL(10,4) := 0;
BEGIN
    -- Get credits from user_credits table
    SELECT COALESCE(SUM(available_credits), 0) INTO total_credits
    FROM public.user_credits
    WHERE user_id = p_user_id 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- If no credits in user_credits, fall back to legacy credit_balance
    IF total_credits = 0 THEN
        SELECT COALESCE(credit_balance, 0) INTO total_credits
        FROM public.users
        WHERE id = p_user_id;
    END IF;
    
    RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VERIFY MIGRATION
-- =====================================================

-- Check migration results
SELECT 
    'Migration Summary' as report_type,
    COUNT(*) as total_users_with_credits,
    SUM(total_credits) as total_credits_migrated,
    AVG(total_credits) as average_credits_per_user
FROM public.user_credits
WHERE credit_type = 'grandfathered';

-- Show sample migrated users
SELECT 
    u.email,
    u.credit_balance as legacy_credits,
    uc.total_credits as new_credits,
    uc.expires_at,
    u.tier
FROM public.users u
LEFT JOIN public.user_credits uc ON u.id = uc.user_id AND uc.credit_type = 'grandfathered'
WHERE u.credit_balance > 0
ORDER BY u.credit_balance DESC
LIMIT 10;

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_credit_type ON public.user_credits(credit_type);
CREATE INDEX IF NOT EXISTS idx_user_credits_expires_at ON public.user_credits(expires_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at);
