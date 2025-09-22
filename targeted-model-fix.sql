-- Targeted fix for remaining model issues
-- Run this in Supabase SQL Editor

-- Step 1: Remove the old bytedance/seedream-4 since we have the FAL AI version
DELETE FROM public.model_costs 
WHERE model_name = 'bytedance/seedream-4';

-- Step 2: Update remaining models to FAL AI format
UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream-3',
    updated_at = NOW()
WHERE model_name = 'bytedance/seedream-3';

UPDATE public.model_costs 
SET model_name = 'fal-ai/seedream-3',
    updated_at = NOW()
WHERE model_name = 'seedream-3';

UPDATE public.model_costs 
SET model_name = 'fal-ai/nano-banana',
    updated_at = NOW()
WHERE model_name = 'nano-banana';

-- Step 3: Fix category inconsistencies for better organization
UPDATE public.model_costs 
SET category = 'image',
    updated_at = NOW()
WHERE model_name = 'fal-ai/nano-banana/edit';

UPDATE public.model_costs 
SET category = 'image',
    updated_at = NOW()
WHERE model_name = 'fal-ai/gemini-25-flash-image/edit';

UPDATE public.model_costs 
SET category = 'image',
    updated_at = NOW()
WHERE model_name = 'fal-ai/bytedance/seedream/v4/edit';

-- Step 4: Verify the final state
SELECT 
    model_name,
    cost_per_generation,
    category,
    display_name,
    is_active
FROM public.model_costs 
WHERE model_name LIKE '%fal-ai%' OR model_name LIKE '%seedream%' OR model_name LIKE '%nano-banana%'
ORDER BY model_name;

-- Step 5: Check for any remaining duplicates
SELECT 
    model_name,
    COUNT(*) as count
FROM public.model_costs 
GROUP BY model_name
HAVING COUNT(*) > 1
ORDER BY count DESC;
