-- Diagnostic queries to understand the current state of your database
-- Run these queries in Supabase SQL Editor to get the information we need

-- 1. Check all models that have duplicates
SELECT 
    model_name, 
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids,
    STRING_AGG(created_at::text, ', ') as created_dates
FROM public.model_costs 
GROUP BY model_name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Check all models that contain "zeroscope" (to see the specific issue)
SELECT 
    id,
    model_name,
    cost_per_generation,
    category,
    display_name,
    is_active,
    created_at
FROM public.model_costs 
WHERE model_name LIKE '%zeroscope%'
ORDER BY created_at;

-- 3. Check all models that will map to the same FAL AI endpoint
SELECT 
    model_name,
    cost_per_generation,
    category,
    display_name,
    is_active,
    created_at
FROM public.model_costs 
WHERE model_name IN (
    'zeroscope-text-to-video',
    'zeroscope-t2v',
    'stable-video-diffusion-image-to-video',
    'stable-video-diffusion-i2v',
    'modelscope-image-to-video', 
    'modelscope-i2v',
    'text2video-zero-image-to-video',
    'text2video-zero-i2v',
    'cogvideo-image-to-video',
    'cogvideo-i2v',
    'wan-v2-2-a14b-image-to-video-lora',
    'wan-v2-2-a14b-i2v-lora'
)
ORDER BY model_name, created_at;

-- 4. Check if any FAL AI model names already exist
SELECT 
    model_name,
    cost_per_generation,
    category,
    display_name,
    is_active,
    created_at
FROM public.model_costs 
WHERE model_name LIKE 'fal-ai/%'
ORDER BY model_name;

-- 5. Get total count of models
SELECT COUNT(*) as total_models FROM public.model_costs;

-- 6. Get count of unique model names
SELECT COUNT(DISTINCT model_name) as unique_model_names FROM public.model_costs;
