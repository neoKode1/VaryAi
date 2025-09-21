-- COMPLETE AUTHENTICATION AND CREDIT SYSTEM FIX
-- This script is completely self-contained and handles all cleanup automatically
-- No manual intervention required - just run this one script

-- =====================================================
-- 1. SAFE CLEANUP - Remove conflicting tables and policies
-- =====================================================

-- Drop all existing credit-related policies first
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_credits', 'credit_transactions', 'credit_usage_log')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Drop existing credit-related functions
DROP FUNCTION IF EXISTS public.check_user_generation_permission(UUID);
DROP FUNCTION IF EXISTS public.use_user_credits_for_generation(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.use_user_credits(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.add_user_credits(UUID, DECIMAL, TEXT);

-- Drop existing credit-related tables (CASCADE handles dependencies)
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.credit_usage_log CASCADE;
DROP TABLE IF EXISTS public.grandfathering_batch CASCADE;

-- =====================================================
-- 2. CREATE CLEAN CREDIT SYSTEM TABLES
-- =====================================================

-- Create user_credits table with correct schema
CREATE TABLE public.user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_credits DECIMAL(10,4) DEFAULT 0.00 NOT NULL,
  used_credits DECIMAL(10,4) DEFAULT 0.00 NOT NULL,
  available_credits DECIMAL(10,4) GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  credit_type TEXT DEFAULT 'grandfathered' CHECK (credit_type IN ('grandfathered', 'purchased', 'bonus', 'refund')),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, credit_type)
);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit_added', 'credit_used', 'credit_refunded', 'credit_expired')),
  amount DECIMAL(10,4) NOT NULL,
  model_name TEXT,
  generation_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_usage_log table
CREATE TABLE public.credit_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model_name TEXT NOT NULL,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('image', 'video', 'character_variation')),
  credits_used DECIMAL(10,4) NOT NULL,
  generation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ENSURE USERS TABLE HAS ALL REQUIRED COLUMNS
-- =====================================================

-- Add all required columns to users table (IF NOT EXISTS handles duplicates)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS low_balance_threshold INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS last_credit_purchase TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_credits_purchased DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'pay_per_use',
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_generation_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 4. CREATE PERFORMANCE INDEXES
-- =====================================================

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_user_credits_user_id;
DROP INDEX IF EXISTS idx_user_credits_active;
DROP INDEX IF EXISTS idx_credit_transactions_user_id;
DROP INDEX IF EXISTS idx_credit_transactions_type;
DROP INDEX IF EXISTS idx_credit_usage_log_user_id;
DROP INDEX IF EXISTS idx_credit_usage_log_model;
DROP INDEX IF EXISTS idx_users_credit_balance;

-- Create new indexes
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_user_credits_active ON public.user_credits(is_active);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX idx_credit_usage_log_user_id ON public.credit_usage_log(user_id);
CREATE INDEX idx_credit_usage_log_model ON public.credit_usage_log(model_name);
CREATE INDEX idx_users_credit_balance ON public.users(credit_balance);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE SECURE RLS POLICIES
-- =====================================================

-- User credits policies
CREATE POLICY "Users can view own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits" ON public.user_credits
    FOR ALL USING (auth.role() = 'service_role');

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions" ON public.credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Credit usage log policies
CREATE POLICY "Users can view own usage" ON public.credit_usage_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage" ON public.credit_usage_log
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. CREATE CREDIT SYSTEM FUNCTIONS
-- =====================================================

-- Function to check user generation permission
CREATE OR REPLACE FUNCTION public.check_user_generation_permission(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_data RECORD;
  v_available_credits DECIMAL(10,4);
  v_result JSONB;
BEGIN
  -- Get user data
  SELECT credit_balance, is_admin, email, first_generation_at
  INTO v_user_data
  FROM public.users
  WHERE id = p_user_id;
  
  -- If user not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'user_not_found',
      'message', 'User not found'
    );
  END IF;
  
  -- Admin users have unlimited access
  IF v_user_data.is_admin OR v_user_data.email = '1deeptechnology@gmail.com' THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'admin_user',
      'message', 'Admin user has unlimited access',
      'available_credits', 999999
    );
  END IF;
  
  -- Get available credits from user_credits table
  SELECT COALESCE(available_credits, 0)
  INTO v_available_credits
  FROM public.user_credits
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no credit record exists, check users.credit_balance as fallback
  IF v_available_credits IS NULL THEN
    v_available_credits := COALESCE(v_user_data.credit_balance, 0);
  END IF;
  
  -- Check if user has any credits
  IF v_available_credits <= 0 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'insufficient_credits',
      'message', 'Insufficient credits for generation',
      'available_credits', v_available_credits
    );
  END IF;
  
  -- User has sufficient credits
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'sufficient_credits',
    'message', 'User has sufficient credits',
    'available_credits', v_available_credits
  );
END;
$$;

-- Function to use credits for generation
CREATE OR REPLACE FUNCTION public.use_user_credits_for_generation(
  p_user_id UUID,
  p_model_name TEXT,
  p_generation_type TEXT,
  p_generation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_model_cost DECIMAL(10,4);
  v_available_credits DECIMAL(10,4);
  v_user_data RECORD;
  v_result JSONB;
BEGIN
  -- Get user data
  SELECT credit_balance, is_admin, email
  INTO v_user_data
  FROM public.users
  WHERE id = p_user_id;
  
  -- If user not found
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'credits_used', 0,
      'remaining_balance', 0,
      'error', 'User not found'
    );
  END IF;
  
  -- Admin users don't use credits
  IF v_user_data.is_admin OR v_user_data.email = '1deeptechnology@gmail.com' THEN
    RETURN jsonb_build_object(
      'success', true,
      'credits_used', 0,
      'remaining_balance', 999999,
      'message', 'Admin user - no credits deducted'
    );
  END IF;
  
  -- Get model cost
  SELECT cost_per_generation INTO v_model_cost
  FROM public.model_costs
  WHERE model_name = p_model_name AND is_active = true;
  
  -- If model not found, use default cost
  IF v_model_cost IS NULL THEN
    v_model_cost := 1.0; -- Default cost
  END IF;
  
  -- Get available credits
  SELECT COALESCE(available_credits, 0)
  INTO v_available_credits
  FROM public.user_credits
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no credit record exists, check users.credit_balance as fallback
  IF v_available_credits IS NULL THEN
    v_available_credits := COALESCE(v_user_data.credit_balance, 0);
  END IF;
  
  -- Check if user has sufficient credits
  IF v_available_credits < v_model_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'credits_used', 0,
      'remaining_balance', v_available_credits,
      'error', 'Insufficient credits'
    );
  END IF;
  
  -- Deduct credits from user_credits table
  UPDATE public.user_credits
  SET used_credits = used_credits + v_model_cost,
      updated_at = NOW()
  WHERE user_id = p_user_id AND is_active = true
  AND id = (
    SELECT id FROM public.user_credits 
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY created_at DESC 
    LIMIT 1
  );
  
  -- If no user_credits record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_credits (user_id, total_credits, used_credits, credit_type)
    VALUES (p_user_id, v_available_credits, v_model_cost, 'grandfathered');
  END IF;
  
  -- Update users.credit_balance as well
  UPDATE public.users
  SET credit_balance = credit_balance - v_model_cost,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the usage
  INSERT INTO public.credit_usage_log (
    user_id,
    model_name,
    generation_type,
    credits_used,
    generation_id
  ) VALUES (
    p_user_id,
    p_model_name,
    p_generation_type,
    v_model_cost,
    p_generation_id
  );
  
  -- Log the transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    model_name,
    generation_id,
    description
  ) VALUES (
    p_user_id,
    'credit_used',
    v_model_cost,
    p_model_name,
    p_generation_id,
    'Credits used for ' || p_model_name || ' generation'
  );
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'credits_used', v_model_cost,
    'remaining_balance', v_available_credits - v_model_cost,
    'message', 'Credits successfully deducted'
  );
END;
$$;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.check_user_generation_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_user_credits_for_generation TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_generation_permission TO service_role;
GRANT EXECUTE ON FUNCTION public.use_user_credits_for_generation TO service_role;

-- =====================================================
-- 9. MIGRATE EXISTING USERS TO NEW CREDIT SYSTEM
-- =====================================================

-- Create credit records for all existing users
INSERT INTO public.user_credits (user_id, total_credits, used_credits, credit_type)
SELECT 
  u.id,
  COALESCE(u.credit_balance, 0),
  0,
  'grandfathered'
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_credits uc 
  WHERE uc.user_id = u.id AND uc.is_active = true
)
ON CONFLICT (user_id, credit_type) DO NOTHING;

-- =====================================================
-- 10. VERIFICATION AND STATUS REPORT
-- =====================================================

-- Show final status
DO $$
DECLARE
  user_count INTEGER;
  credit_count INTEGER;
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO credit_count FROM public.user_credits;
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE is_admin = true;
  
  RAISE NOTICE '=== CREDIT SYSTEM FIX COMPLETED ===';
  RAISE NOTICE 'Total users: %', user_count;
  RAISE NOTICE 'Users with credit records: %', credit_count;
  RAISE NOTICE 'Admin users: %', admin_count;
  RAISE NOTICE '=== SYSTEM READY FOR USE ===';
END $$;
