-- Fix Seedream 4 Edit model name to match FAL AI model name
-- Run this in Supabase SQL Editor

-- Update the model name from 'seedream-4-edit' to 'fal-ai/bytedance/seedream/v4/edit'
UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream/v4/edit',
    updated_at = NOW()
WHERE model_name = 'seedream-4-edit';

-- Also update the bytedance-seedream-4 to use the correct FAL AI name for text-to-image
UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream/v4',
    updated_at = NOW()
WHERE model_name = 'bytedance-seedream-4';

-- Verify the changes
SELECT 
    model_name,
    cost_per_generation,
    category,
    display_name,
    is_active
FROM public.model_costs 
WHERE model_name LIKE '%seedream%'
ORDER BY model_name;
