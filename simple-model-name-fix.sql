-- Simple model name fix - handle duplicates systematically
-- Run this in Supabase SQL Editor

-- First, let's see all the duplicates we need to handle
SELECT model_name, COUNT(*) as count
FROM public.model_costs 
WHERE model_name IN (
    'stable-video-diffusion-image-to-video',
    'stable-video-diffusion-i2v',
    'modelscope-image-to-video', 
    'modelscope-i2v',
    'text2video-zero-image-to-video',
    'text2video-zero-i2v',
    'cogvideo-image-to-video',
    'cogvideo-i2v',
    'wan-v2-2-a14b-image-to-video-lora',
    'wan-v2-2-a14b-i2v-lora',
    'zeroscope-text-to-video',
    'zeroscope-t2v'
)
GROUP BY model_name
HAVING COUNT(*) > 1;

-- Remove ALL duplicates by keeping only the first created entry for each model
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY model_name ORDER BY created_at ASC) as rn
    FROM public.model_costs 
    WHERE model_name IN (
        'stable-video-diffusion-image-to-video',
        'stable-video-diffusion-i2v',
        'modelscope-image-to-video', 
        'modelscope-i2v',
        'text2video-zero-image-to-video',
        'text2video-zero-i2v',
        'cogvideo-image-to-video',
        'cogvideo-i2v',
        'wan-v2-2-a14b-image-to-video-lora',
        'wan-v2-2-a14b-i2v-lora',
        'zeroscope-text-to-video',
        'zeroscope-t2v'
    )
)
DELETE FROM public.model_costs 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Now update the remaining models to use correct FAL AI names
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
SET model_name = 'fal-ai/qwen-image-edit',
    updated_at = NOW()
WHERE model_name = 'qwen-image-edit';

-- Text-to-Image Models
UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream/v4',
    updated_at = NOW()
WHERE model_name = 'bytedance-seedream-4';

UPDATE public.model_costs 
SET model_name = 'fal-ai/fast-sdxl',
    updated_at = NOW()
WHERE model_name = 'fast-sdxl';

UPDATE public.model_costs 
SET model_name = 'fal-ai/stable-diffusion-v3-5-large',
    updated_at = NOW()
WHERE model_name = 'stable-diffusion-v35-large';

UPDATE public.model_costs 
SET model_name = 'fal-ai/flux-krea',
    updated_at = NOW()
WHERE model_name = 'flux-krea';

UPDATE public.model_costs 
SET model_name = 'fal-ai/flux-pro-kontext',
    updated_at = NOW()
WHERE model_name = 'flux-pro-kontext';

UPDATE public.model_costs 
SET model_name = 'fal-ai/imagen4-preview',
    updated_at = NOW()
WHERE model_name = 'imagen4-preview';

UPDATE public.model_costs 
SET model_name = 'fal-ai/flux-dev-text-to-image',
    updated_at = NOW()
WHERE model_name = 'flux-dev';

UPDATE public.model_costs 
SET model_name = 'fal-ai/flux-1.0-text-to-image',
    updated_at = NOW()
WHERE model_name = 'flux-1.0-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/flux-1.1-pro-text-to-image',
    updated_at = NOW()
WHERE model_name = 'flux-1.1-pro-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/flux-schnell-text-to-image',
    updated_at = NOW()
WHERE model_name = 'flux-schnell-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/stable-diffusion-v2-text-to-image',
    updated_at = NOW()
WHERE model_name = 'stable-diffusion-v2-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/stable-diffusion-v3-text-to-image',
    updated_at = NOW()
WHERE model_name = 'stable-diffusion-v3-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/stable-diffusion-xl-text-to-image',
    updated_at = NOW()
WHERE model_name = 'stable-diffusion-xl-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/dall-e-3-text-to-image',
    updated_at = NOW()
WHERE model_name = 'dall-e-3-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/imagen-3-text-to-image',
    updated_at = NOW()
WHERE model_name = 'imagen-3-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/midjourney-v6-text-to-image',
    updated_at = NOW()
WHERE model_name = 'midjourney-v6-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance-dreamina-v3-1-text-to-image',
    updated_at = NOW()
WHERE model_name = 'bytedance-dreamina-v3-1-text-to-image';

UPDATE public.model_costs 
SET model_name = 'fal-ai/bytedance/seedream-3',
    updated_at = NOW()
WHERE model_name = 'bytedance/seedream-3';

-- Image-to-Video Models
UPDATE public.model_costs 
SET model_name = 'fal-ai/kling-video/v2.1/master/image-to-video',
    updated_at = NOW()
WHERE model_name = 'kling-2.1-master';

UPDATE public.model_costs 
SET model_name = 'fal-ai/minimax/hailuo-02/pro/image-to-video',
    updated_at = NOW()
WHERE model_name = 'minimax-hailuo-02-pro-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/veo3/fast/image-to-video',
    updated_at = NOW()
WHERE model_name = 'veo3-fast-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/veo3/image-to-video',
    updated_at = NOW()
WHERE model_name = 'veo3-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/wan-v2-2-a14b/image-to-video-lora',
    updated_at = NOW()
WHERE model_name = 'wan-v2-2-a14b-image-to-video-lora';

UPDATE public.model_costs 
SET model_name = 'fal-ai/stable-video-diffusion/image-to-video',
    updated_at = NOW()
WHERE model_name = 'stable-video-diffusion-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/modelscope/image-to-video',
    updated_at = NOW()
WHERE model_name = 'modelscope-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/text2video-zero/image-to-video',
    updated_at = NOW()
WHERE model_name = 'text2video-zero-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/cogvideo/image-to-video',
    updated_at = NOW()
WHERE model_name = 'cogvideo-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/minimax/video-01-director/image-to-video',
    updated_at = NOW()
WHERE model_name = 'minimax-i2v-director';

UPDATE public.model_costs 
SET model_name = 'fal-ai/kling-video/v1.6/pro/image-to-video',
    updated_at = NOW()
WHERE model_name = 'kling-video-pro';

UPDATE public.model_costs 
SET model_name = 'fal-ai/decart/lucy-14b/image-to-video',
    updated_at = NOW()
WHERE model_name = 'decart-lucy-14b';

UPDATE public.model_costs 
SET model_name = 'fal-ai/minimax/video-01',
    updated_at = NOW()
WHERE model_name = 'minimax-video-01';

-- Text-to-Video Models
UPDATE public.model_costs 
SET model_name = 'fal-ai/kling-video/v2.1/master/text-to-video',
    updated_at = NOW()
WHERE model_name = 'kling-2.1-master-t2v';

UPDATE public.model_costs 
SET model_name = 'fal-ai/veo3/fast/text-to-video',
    updated_at = NOW()
WHERE model_name = 'veo3-fast-t2v';

UPDATE public.model_costs 
SET model_name = 'fal-ai/veo3/text-to-video',
    updated_at = NOW()
WHERE model_name = 'veo-3-text-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/runway-gen-3/text-to-video',
    updated_at = NOW()
WHERE model_name = 'runway-gen-3-text-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/runway-gen-3/image-to-video',
    updated_at = NOW()
WHERE model_name = 'runway-gen-3-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/pika-labs/text-to-video',
    updated_at = NOW()
WHERE model_name = 'pika-labs-text-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/pika-labs/image-to-video',
    updated_at = NOW()
WHERE model_name = 'pika-labs-image-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/stable-video-diffusion/text-to-video',
    updated_at = NOW()
WHERE model_name = 'stable-video-diffusion-text-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/modelscope/text-to-video',
    updated_at = NOW()
WHERE model_name = 'modelscope-text-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/text2video-zero/text-to-video',
    updated_at = NOW()
WHERE model_name = 'text2video-zero-text-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/cogvideo/text-to-video',
    updated_at = NOW()
WHERE model_name = 'cogvideo-text-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/zeroscope/text-to-video',
    updated_at = NOW()
WHERE model_name = 'zeroscope-text-to-video';

UPDATE public.model_costs 
SET model_name = 'fal-ai/zeroscope/text-to-video',
    updated_at = NOW()
WHERE model_name = 'zeroscope-t2v';

-- Special Models
UPDATE public.model_costs 
SET model_name = 'fal-ai/kling-video/v1/standard/ai-avatar',
    updated_at = NOW()
WHERE model_name = 'kling-ai-avatar';

UPDATE public.model_costs 
SET model_name = 'fal-ai/luma-photon/reframe',
    updated_at = NOW()
WHERE model_name = 'luma-photon-reframe';

UPDATE public.model_costs 
SET model_name = 'fal-ai/image-editing/reframe',
    updated_at = NOW()
WHERE model_name = 'image-editing-reframe';

-- Text-to-Speech Models
UPDATE public.model_costs 
SET model_name = 'fal-ai/elevenlabs-tts-multilingual-v2',
    updated_at = NOW()
WHERE model_name = 'elevenlabs-tts-multilingual-v2';

-- Lip Sync Models
UPDATE public.model_costs 
SET model_name = 'fal-ai/wav2lip',
    updated_at = NOW()
WHERE model_name = 'wav2lip';

UPDATE public.model_costs 
SET model_name = 'fal-ai/latentsync',
    updated_at = NOW()
WHERE model_name = 'latentsync';

UPDATE public.model_costs 
SET model_name = 'fal-ai/sync-fondo',
    updated_at = NOW()
WHERE model_name = 'sync-fondo';

UPDATE public.model_costs 
SET model_name = 'fal-ai/musetalk',
    updated_at = NOW()
WHERE model_name = 'musetalk';

UPDATE public.model_costs 
SET model_name = 'fal-ai/sync/lipsync-2-pro',
    updated_at = NOW()
WHERE model_name = 'sync/lipsync-2-pro';

-- Verify all changes
SELECT 
    model_name,
    cost_per_generation,
    category,
    display_name,
    is_active
FROM public.model_costs 
WHERE model_name LIKE '%fal-ai%'
ORDER BY model_name;
