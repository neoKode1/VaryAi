-- Check model_costs table configuration
-- This will help identify if the pricing is set up correctly

-- Check all model costs
SELECT 
    'MODEL_COSTS' as info,
    model_name,
    cost_per_generation,
    is_active,
    created_at,
    updated_at
FROM public.model_costs
WHERE model_name = 'nano-banana'
ORDER BY created_at DESC;

-- Check if nano-banana model exists and is active
SELECT 
    'NANO_BANANA_STATUS' as info,
    CASE 
        WHEN EXISTS(SELECT 1 FROM public.model_costs WHERE model_name = 'nano-banana' AND is_active = true) 
        THEN 'EXISTS_AND_ACTIVE'
        WHEN EXISTS(SELECT 1 FROM public.model_costs WHERE model_name = 'nano-banana' AND is_active = false)
        THEN 'EXISTS_BUT_INACTIVE'
        ELSE 'DOES_NOT_EXIST'
    END as status;

-- If nano-banana doesn't exist or is inactive, create/fix it
INSERT INTO public.model_costs (
    model_name,
    cost_per_generation,
    is_active,
    created_at,
    updated_at
)
SELECT 
    'nano-banana',
    0.0398,
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.model_costs 
    WHERE model_name = 'nano-banana' AND is_active = true
);

-- Update nano-banana if it exists but is inactive
UPDATE public.model_costs 
SET 
    is_active = true,
    cost_per_generation = 0.0398,
    updated_at = NOW()
WHERE model_name = 'nano-banana' AND is_active = false;

-- Final verification
SELECT 
    'FINAL_VERIFICATION' as info,
    model_name,
    cost_per_generation,
    is_active
FROM public.model_costs
WHERE model_name = 'nano-banana';
