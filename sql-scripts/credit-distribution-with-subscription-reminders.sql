-- Credit Distribution with Subscription Reminders
-- Distributes $14.58 across users with subscription reminder system
-- New users get 12 images or 3 videos (3 generations)

-- Step 1: Create notification system for low credits
CREATE OR REPLACE FUNCTION notify_low_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user's credits are below threshold
  IF NEW.credit_balance <= 2.0 AND OLD.credit_balance > 2.0 THEN
    -- Insert notification for low credits
    INSERT INTO public.notifications (
      user_id, 
      type, 
      title, 
      message, 
      is_read, 
      created_at
    ) VALUES (
      NEW.id,
      'credit_warning',
      'Low Credits Warning',
      'You have less than $2.00 in credits remaining. Subscribe now to continue generating without interruption!',
      false,
      NOW()
    );
  END IF;
  
  -- Check if user's credits are critically low
  IF NEW.credit_balance <= 0.50 AND OLD.credit_balance > 0.50 THEN
    -- Insert critical notification
    INSERT INTO public.notifications (
      user_id, 
      type, 
      title, 
      message, 
      is_read, 
      created_at
    ) VALUES (
      NEW.id,
      'credit_critical',
      'Critical: Credits Almost Depleted',
      'You have less than $0.50 in credits! Subscribe immediately to avoid service interruption.',
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger for credit balance changes
DROP TRIGGER IF EXISTS credit_balance_notification_trigger ON public.users;
CREATE TRIGGER credit_balance_notification_trigger
  AFTER UPDATE OF credit_balance ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_credits();

-- Step 3: Credit Distribution Plan
WITH user_ranking AS (
  SELECT 
    id,
    email,
    created_at,
    credit_balance,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as user_rank
  FROM public.users
  ORDER BY created_at ASC
),
distribution_plan AS (
  SELECT 
    id,
    email,
    created_at,
    credit_balance,
    user_rank,
    CASE 
      -- Prioritized users (first 25) - highest credits
      WHEN user_rank <= 25 THEN 0.3000  -- $0.30 each (30 images or 7-8 videos)
      -- Second tier users (26-50)
      WHEN user_rank <= 50 THEN 0.2000  -- $0.20 each (20 images or 5 videos)
      -- Third tier users (51-75)
      WHEN user_rank <= 75 THEN 0.1500  -- $0.15 each (15 images or 3-4 videos)
      -- Fourth tier users (76-100)
      WHEN user_rank <= 100 THEN 0.1000 -- $0.10 each (10 images or 2-3 videos)
      -- Fifth tier users (101-125)
      WHEN user_rank <= 125 THEN 0.0750 -- $0.075 each (7-8 images or 1-2 videos)
      -- Sixth tier users (126-150)
      WHEN user_rank <= 150 THEN 0.0500 -- $0.05 each (5 images or 1 video)
      -- New users (151+) - standard allocation
      ELSE 0.1200 -- $0.12 each (12 images or 3 videos)
    END as credits_to_add
  FROM user_ranking
),
total_cost_calculation AS (
  SELECT SUM(credits_to_add) as total_cost
  FROM distribution_plan
)
-- Step 4: Show the distribution plan
SELECT 
  'DISTRIBUTION PLAN' as section,
  user_rank,
  email,
  credit_balance as current_balance,
  credits_to_add,
  (credit_balance + credits_to_add) as new_balance,
  CASE 
    WHEN user_rank <= 25 THEN 'Priority Tier 1 (30 images, 7-8 videos)'
    WHEN user_rank <= 50 THEN 'Tier 2 (20 images, 5 videos)'
    WHEN user_rank <= 75 THEN 'Tier 3 (15 images, 3-4 videos)'
    WHEN user_rank <= 100 THEN 'Tier 4 (10 images, 2-3 videos)'
    WHEN user_rank <= 125 THEN 'Tier 5 (7-8 images, 1-2 videos)'
    WHEN user_rank <= 150 THEN 'Tier 6 (5 images, 1 video)'
    ELSE 'New User Standard (12 images, 3 videos)'
  END as tier_description
FROM distribution_plan
ORDER BY user_rank;

-- Step 5: Show summary statistics
SELECT 
  'SUMMARY' as section,
  COUNT(*) as total_users,
  COUNT(CASE WHEN credits_to_add > 0 THEN 1 END) as users_getting_credits,
  SUM(credits_to_add) as total_credits_to_distribute,
  ROUND(AVG(credits_to_add), 4) as average_credits_per_user,
  COUNT(CASE WHEN user_rank <= 25 THEN 1 END) as priority_users
FROM distribution_plan;

-- Step 6: Show tier breakdown
SELECT 
  'TIER BREAKDOWN' as section,
  CASE 
    WHEN user_rank <= 25 THEN 'Priority Tier 1 (Users 1-25)'
    WHEN user_rank <= 50 THEN 'Tier 2 (Users 26-50)'
    WHEN user_rank <= 75 THEN 'Tier 3 (Users 51-75)'
    WHEN user_rank <= 100 THEN 'Tier 4 (Users 76-100)'
    WHEN user_rank <= 125 THEN 'Tier 5 (Users 101-125)'
    WHEN user_rank <= 150 THEN 'Tier 6 (Users 126-150)'
    ELSE 'New Users (Users 151+)'
  END as tier,
  COUNT(*) as user_count,
  ROUND(SUM(credits_to_add), 4) as total_credits_for_tier,
  ROUND(AVG(credits_to_add), 4) as credits_per_user
FROM distribution_plan
GROUP BY 
  CASE 
    WHEN user_rank <= 25 THEN 'Priority Tier 1 (Users 1-25)'
    WHEN user_rank <= 50 THEN 'Tier 2 (Users 26-50)'
    WHEN user_rank <= 75 THEN 'Tier 3 (Users 51-75)'
    WHEN user_rank <= 100 THEN 'Tier 4 (Users 76-100)'
    WHEN user_rank <= 125 THEN 'Tier 5 (Users 101-125)'
    WHEN user_rank <= 150 THEN 'Tier 6 (Users 126-150)'
    ELSE 'New Users (Users 151+)'
  END
ORDER BY MIN(user_rank);

-- Step 7: ACTUAL DISTRIBUTION (Uncomment to execute)
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
  'Tier-based distribution - ' || 
  CASE 
    WHEN dp.user_rank <= 25 THEN 'Priority Tier 1'
    WHEN dp.user_rank <= 50 THEN 'Tier 2'
    WHEN dp.user_rank <= 75 THEN 'Tier 3'
    WHEN dp.user_rank <= 100 THEN 'Tier 4'
    WHEN dp.user_rank <= 125 THEN 'Tier 5'
    WHEN dp.user_rank <= 150 THEN 'Tier 6'
    ELSE 'New User Standard'
  END,
  jsonb_build_object(
    'distribution_type', 'tier_based',
    'user_rank', dp.user_rank,
    'tier', 
    CASE 
      WHEN dp.user_rank <= 25 THEN 1
      WHEN dp.user_rank <= 50 THEN 2
      WHEN dp.user_rank <= 75 THEN 3
      WHEN dp.user_rank <= 100 THEN 4
      WHEN dp.user_rank <= 125 THEN 5
      WHEN dp.user_rank <= 150 THEN 6
      ELSE 7
    END,
    'subscription_reminder_enabled', true
  )
FROM distribution_plan dp
WHERE dp.credits_to_add > 0;

-- Send initial subscription reminder notifications to users with low credits
INSERT INTO public.notifications (user_id, type, title, message, is_read, created_at)
SELECT 
  u.id,
  'subscription_reminder',
  'Subscribe to Continue Generating',
  'Your credits are running low! Subscribe now to enjoy unlimited generation without interruptions.',
  false,
  NOW()
FROM public.users u
WHERE u.credit_balance <= 1.00
  AND u.id NOT IN (SELECT user_id FROM public.subscriptions WHERE status = 'active');

-- Verify the distribution
SELECT 
  'VERIFICATION' as section,
  COUNT(*) as total_users_updated,
  SUM(credits_to_add) as total_credits_distributed,
  ROUND(AVG(credits_to_add), 4) as average_credits_per_user
FROM distribution_plan
WHERE credits_to_add > 0;
*/

-- Step 8: Create scheduled reminder function (runs daily)
CREATE OR REPLACE FUNCTION daily_subscription_reminders()
RETURNS void AS $$
BEGIN
  -- Send reminders to users with low credits who haven't subscribed
  INSERT INTO public.notifications (user_id, type, title, message, is_read, created_at)
  SELECT 
    u.id,
    'daily_reminder',
    'Don''t Let Your Credits Run Out!',
    'You have $' || ROUND(u.credit_balance, 2) || ' remaining. Subscribe now to continue generating!',
    false,
    NOW()
  FROM public.users u
  WHERE u.credit_balance <= 1.50
    AND u.credit_balance > 0
    AND u.id NOT IN (SELECT user_id FROM public.subscriptions WHERE status = 'active')
    AND u.id NOT IN (
      SELECT user_id FROM public.notifications 
      WHERE type = 'daily_reminder' 
      AND created_at > NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql;
