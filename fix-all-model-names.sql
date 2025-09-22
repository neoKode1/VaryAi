-- Fix all model names to match FAL AI schemas
-- Run this in Supabase SQL Editor

-- Update model names to match FAL AI schemas exactly
UPDATE public.model_costs 
SET model_name = 'fal-ai/nano-banana/edit',
    updated_at = NOW()
WHERE model_name = 'nano-banana-edit';

UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream/v4/edit',
    updated_at = NOW()
WHERE model_name = 'seedream-4-edit';

UPDATE public.model_costs 
SET model_name = 'fal-ai/gemini-25-flash-image/edit',
    updated_at = NOW()
WHERE model_name = 'gemini-25-flash-image-edit';

UPDATE public.model_costs 
SET model_name = 'fal-ai/kling-video/v1/standard/ai-avatar',
    updated_at = NOW()
WHERE model_name = 'kling-ai-avatar';

UPDATE public.model_costs 
SET model_name = 'fal-ai/veo3/fast/image-to-video',
    updated_at = NOW()
WHERE model_name = 'veo3-fast-image-to-video';

-- Update bytedance-seedream-4 to use the correct FAL AI name for text-to-image
UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream/v4',
    updated_at = NOW()
WHERE model_name = 'bytedance-seedream-4';

-- Verify all changes
SELECT 
    model_name,
    cost_per_generation,
    category,
    display_name,
    is_active
FROM public.model_costs 
WHERE model_name LIKE '%fal-ai%' OR model_name LIKE '%seedream%' OR model_name LIKE '%nano-banana%' OR model_name LIKE '%gemini%' OR model_name LIKE '%kling%' OR model_name LIKE '%veo%'
ORDER BY model_name;
