-- Fix nano-banana pricing to match actual FAL AI costs
-- This should resolve the credit calculation issues

-- Update nano-banana cost from $0.01 to $0.0398 (actual FAL AI cost)
UPDATE public.model_costs 
SET 
    cost_per_generation = 0.0398,
    updated_at = NOW()
WHERE model_name = 'nano-banana';

-- Verify the update
SELECT 
    'NANO_BANANA_UPDATED' as status,
    model_name,
    cost_per_generation,
    is_active,
    updated_at
FROM public.model_costs 
WHERE model_name = 'nano-banana';

-- Show the difference this makes for credit calculations
SELECT 
    'CREDIT_CALCULATION_COMPARISON' as info,
    'Old cost per image' as metric,
    0.0100 as value
UNION ALL
SELECT 
    'CREDIT_CALCULATION_COMPARISON' as info,
    'New cost per image' as metric,
    0.0398 as value
UNION ALL
SELECT 
    'CREDIT_CALCULATION_COMPARISON' as info,
    'Images per $1.00 (old)' as metric,
    100 as value
UNION ALL
SELECT 
    'CREDIT_CALCULATION_COMPARISON' as info,
    'Images per $1.00 (new)' as metric,
    25 as value;
