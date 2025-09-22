-- Quarter-Based Credit Distribution Script
-- Distributes $17.42 across users in quarters with decreasing amounts
-- First 25 users get most credits, last users get least (encourages subscription)

-- Step 1: Get total user count and create distribution plan
WITH user_ranking AS (
  SELECT 
    id,
    email,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as user_rank
  FROM public.users
  ORDER BY created_at ASC
),
distribution_plan AS (
  SELECT 
    id,
    email,
    created_at,
    user_rank,
    CASE 
      WHEN user_rank <= 25 THEN 0.3484  -- First quarter: 34 images, 6 videos
      WHEN user_rank <= 50 THEN 0.2323  -- Second quarter: 23 images, 4 videos  
      WHEN user_rank <= 75 THEN 0.1742  -- Third quarter: 17 images, 3 videos
      WHEN user_rank <= 100 THEN 0.1394 -- Fourth quarter: 13 images, 2 videos
      WHEN user_rank <= 125 THEN 0.1161 -- Fifth quarter: 11 images, 2 videos
      WHEN user_rank <= 150 THEN 0.0871 -- Sixth quarter: 8 images, 1 video
      ELSE 0.0000 -- Beyond 150 users: no credits (must subscribe)
    END as credits_to_add
  FROM user_ranking
),
total_cost_calculation AS (
  SELECT SUM(credits_to_add) as total_cost
  FROM distribution_plan
)
-- Step 2: Show the distribution plan
SELECT 
  'DISTRIBUTION PLAN' as section,
  user_rank,
  email,
  credits_to_add,
  CASE 
    WHEN user_rank <= 25 THEN 'First Quarter (34 images, 6 videos)'
    WHEN user_rank <= 50 THEN 'Second Quarter (23 images, 4 videos)'
    WHEN user_rank <= 75 THEN 'Third Quarter (17 images, 3 videos)'
    WHEN user_rank <= 100 THEN 'Fourth Quarter (13 images, 2 videos)'
    WHEN user_rank <= 125 THEN 'Fifth Quarter (11 images, 2 videos)'
    WHEN user_rank <= 150 THEN 'Sixth Quarter (8 images, 1 video)'
    ELSE 'No Credits (Must Subscribe)'
  END as quarter_description
FROM distribution_plan
ORDER BY user_rank;

-- Step 3: Show summary statistics
SELECT 
  'SUMMARY' as section,
  COUNT(*) as total_users,
  COUNT(CASE WHEN credits_to_add > 0 THEN 1 END) as users_getting_credits,
  COUNT(CASE WHEN credits_to_add = 0 THEN 1 END) as users_must_subscribe,
  SUM(credits_to_add) as total_credits_to_distribute,
  ROUND(AVG(credits_to_add), 4) as average_credits_per_user
FROM distribution_plan;

-- Step 4: Show quarter breakdown
SELECT 
  'QUARTER BREAKDOWN' as section,
  CASE 
    WHEN user_rank <= 25 THEN 'Quarter 1 (Users 1-25)'
    WHEN user_rank <= 50 THEN 'Quarter 2 (Users 26-50)'
    WHEN user_rank <= 75 THEN 'Quarter 3 (Users 51-75)'
    WHEN user_rank <= 100 THEN 'Quarter 4 (Users 76-100)'
    WHEN user_rank <= 125 THEN 'Quarter 5 (Users 101-125)'
    WHEN user_rank <= 150 THEN 'Quarter 6 (Users 126-150)'
    ELSE 'No Credits (Users 151+)'
  END as quarter,
  COUNT(*) as user_count,
  ROUND(SUM(credits_to_add), 4) as total_credits_for_quarter,
  ROUND(AVG(credits_to_add), 4) as credits_per_user
FROM distribution_plan
GROUP BY 
  CASE 
    WHEN user_rank <= 25 THEN 'Quarter 1 (Users 1-25)'
    WHEN user_rank <= 50 THEN 'Quarter 2 (Users 26-50)'
    WHEN user_rank <= 75 THEN 'Quarter 3 (Users 51-75)'
    WHEN user_rank <= 100 THEN 'Quarter 4 (Users 76-100)'
    WHEN user_rank <= 125 THEN 'Quarter 5 (Users 101-125)'
    WHEN user_rank <= 150 THEN 'Quarter 6 (Users 126-150)'
    ELSE 'No Credits (Users 151+)'
  END
ORDER BY MIN(user_rank);

-- Step 5: ACTUAL DISTRIBUTION (Uncomment to execute)
/*
-- Update user credit balances
UPDATE public.users 
SET 
  credit_balance = credit_balance + dp.credits_to_add,
  total_credits_purchased = COALESCE(total_credits_purchased, 0) + dp.credits_to_add,
  updated_at = NOW()
FROM distribution_plan dp
WHERE users.id = dp.id 
  AND dp.credits_to_add > 0;

-- Create credit transactions for audit trail
INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description, metadata)
SELECT 
  dp.id,
  'credit_added',
  dp.credits_to_add,
  'Quarter-based distribution - Quarter ' || 
  CASE 
    WHEN dp.user_rank <= 25 THEN '1'
    WHEN dp.user_rank <= 50 THEN '2'
    WHEN dp.user_rank <= 75 THEN '3'
    WHEN dp.user_rank <= 100 THEN '4'
    WHEN dp.user_rank <= 125 THEN '5'
    WHEN dp.user_rank <= 150 THEN '6'
    ELSE 'None'
  END,
  jsonb_build_object(
    'distribution_type', 'quarter_based',
    'user_rank', dp.user_rank,
    'quarter', 
    CASE 
      WHEN dp.user_rank <= 25 THEN 1
      WHEN dp.user_rank <= 50 THEN 2
      WHEN dp.user_rank <= 75 THEN 3
      WHEN dp.user_rank <= 100 THEN 4
      WHEN dp.user_rank <= 125 THEN 5
      WHEN dp.user_rank <= 150 THEN 6
      ELSE 0
    END
  )
FROM distribution_plan dp
WHERE dp.credits_to_add > 0;

-- Verify the distribution
SELECT 
  'VERIFICATION' as section,
  COUNT(*) as total_users_updated,
  SUM(credits_to_add) as total_credits_distributed,
  ROUND(AVG(credits_to_add), 4) as average_credits_per_user
FROM distribution_plan
WHERE credits_to_add > 0;
*/
