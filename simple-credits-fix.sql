-- Simple Credit System Fix
-- This adds the missing available_credits column to the existing user_credits table

-- Check if available_credits column exists, if not add it
DO $$ 
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_credits' 
        AND column_name = 'available_credits'
        AND table_schema = 'public'
    ) THEN
        -- Add the missing column as a generated column
        ALTER TABLE public.user_credits 
        ADD COLUMN available_credits DECIMAL(10,4) 
        GENERATED ALWAYS AS (total_credits - used_credits) STORED;
        
        RAISE NOTICE 'Added available_credits column to user_credits table';
    ELSE
        RAISE NOTICE 'available_credits column already exists';
    END IF;
END $$;

-- Ensure all users have credit records
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

-- Update existing credit records to match user balance
UPDATE public.user_credits 
SET total_credits = u.credit_balance,
    updated_at = NOW()
FROM public.users u
WHERE public.user_credits.user_id = u.id
AND public.user_credits.is_active = true
AND public.user_credits.total_credits != u.credit_balance;

-- Show final status
SELECT 
  'Credit System Fix Complete' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN credit_balance > 0 THEN 1 END) as users_with_credits,
  COUNT(CASE WHEN credit_balance = 0 THEN 1 END) as users_without_credits
FROM public.users;
