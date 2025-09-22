-- Final model name fix - simple approach for small database
-- Run this in Supabase SQL Editor

-- Step 1: Show us what we're working with
SELECT 
    model_name,
    COUNT(*) as count
FROM public.model_costs 
GROUP BY model_name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Delete ALL duplicates (keep only the first one created)
DELETE FROM public.model_costs 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY model_name ORDER BY created_at ASC) as rn
        FROM public.model_costs
    ) ranked
    WHERE rn > 1
);

-- Step 3: Update the most critical models first (the ones causing errors)
UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream/v4/edit',
    updated_at = NOW()
WHERE model_name = 'seedream-4-edit';

UPDATE public.model_costs 
SET model_name = 'fal-ai/nano-banana/edit',
    updated_at = NOW()
WHERE model_name = 'nano-banana-edit';

UPDATE public.model_costs 
SET model_name = 'fal-ai/gemini-25-flash-image/edit',
    updated_at = NOW()
WHERE model_name = 'gemini-25-flash-image-edit';

-- Step 4: Update text-to-image models
UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream/v4',
    updated_at = NOW()
WHERE model_name = 'bytedance-seedream-4';

UPDATE public.model_costs 
SET model_name = 'fal-ai/fast-sdxl',
    updated_at = NOW()
WHERE model_name = 'fast-sdxl';

UPDATE public.model_costs 
SET model_name = 'fal-ai/flux-dev-text-to-image',
    updated_at = NOW()
WHERE model_name = 'flux-dev';

-- Step 5: Update video models (one at a time to avoid conflicts)
UPDATE public.model_costs 
SET model_name = 'fal-ai/kling-video/v2.1/master/image-to-video',
    updated_at = NOW()
WHERE model_name = 'kling-2.1-master';

UPDATE public.model_costs 
SET model_name = 'fal-ai/veo3/fast/image-to-video',
    updated_at = NOW()
WHERE model_name = 'veo3-fast-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/kling-video/v1/standard/ai-avatar',
    updated_at = NOW()
WHERE model_name = 'kling-ai-avatar';

-- Step 6: Handle the problematic zeroscope models
-- First, let's see what we have
SELECT model_name, COUNT(*) FROM public.model_costs 
WHERE model_name LIKE '%zeroscope%' 
GROUP BY model_name;

-- Update zeroscope models (only if they exist)
UPDATE public.model_costs 
SET model_name = 'fal-ai/zeroscope/text-to-video',
    updated_at = NOW()
WHERE model_name = 'zeroscope-text-to-video';

-- If zeroscope-t2v exists and zeroscope-text-to-video doesn't, update it
UPDATE public.model_costs 
SET model_name = 'fal-ai/zeroscope/text-to-video',
    updated_at = NOW()
WHERE model_name = 'zeroscope-t2v'
AND NOT EXISTS (
    SELECT 1 FROM public.model_costs 
    WHERE model_name = 'fal-ai/zeroscope/text-to-video'
);

-- Step 7: Verify the results
SELECT 
    model_name,
    cost_per_generation,
    category,
    display_name,
    is_active
FROM public.model_costs 
WHERE model_name LIKE '%fal-ai%' OR model_name LIKE '%seedream%' OR model_name LIKE '%nano-banana%'
ORDER BY model_name;
