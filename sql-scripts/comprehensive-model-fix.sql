-- Comprehensive Model Fix - Add all missing models to the model_costs table
-- Run this in Supabase SQL Editor

-- Add WAN-25 Preview model
INSERT INTO public.model_costs (model_name, cost_per_generation, category, display_name, is_active, created_at, updated_at)
VALUES 
    ('wan-25-preview-image-to-video', 1.0, 'video', 'WAN-25 Preview', true, NOW(), NOW())
ON CONFLICT (model_name) 
DO UPDATE SET 
    cost_per_generation = EXCLUDED.cost_per_generation,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Add Qwen Image Edit Plus model
INSERT INTO public.model_costs (model_name, cost_per_generation, category, display_name, is_active, created_at, updated_at)
VALUES 
    ('qwen-image-edit-plus', 0.8, 'image', 'Qwen Image Edit Plus', true, NOW(), NOW())
ON CONFLICT (model_name) 
DO UPDATE SET 
    cost_per_generation = EXCLUDED.cost_per_generation,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Add Kling Video V2.5 Turbo Pro model
INSERT INTO public.model_costs (model_name, cost_per_generation, category, display_name, is_active, created_at, updated_at)
VALUES 
    ('kling-video-v2-5-turbo-pro-image-to-video', 1.8, 'video', 'Kling Video V2.5 Turbo Pro', true, NOW(), NOW())
ON CONFLICT (model_name) 
DO UPDATE SET 
    cost_per_generation = EXCLUDED.cost_per_generation,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Add any other potentially missing models that might be referenced in the codebase
INSERT INTO public.model_costs (model_name, cost_per_generation, category, display_name, is_active, created_at, updated_at)
VALUES 
    -- Image Models
    ('nano-banana', 0.5, 'image', 'Nano Banana', true, NOW(), NOW()),
    ('runway-t2i', 1.0, 'image', 'Runway Text-to-Image', true, NOW(), NOW()),
    ('seedream-4-edit', 0.8, 'image', 'Seedream 4 Edit', true, NOW(), NOW()),
    ('bytedance-seedream-4', 0.8, 'image', 'Seedream 4', true, NOW(), NOW()),
    ('gemini-25-flash-image-edit', 0.6, 'image', 'Gemini Flash Edit', true, NOW(), NOW()),
    ('luma-photon-reframe', 1.2, 'image', 'Luma Photon Reframe', true, NOW(), NOW()),
    ('flux-dev', 0.7, 'image', 'Flux Dev', true, NOW(), NOW()),
    ('seedream-3', 0.7, 'image', 'Seedream 3', true, NOW(), NOW()),
    ('seedance-1-pro', 0.9, 'image', 'Seedance 1 Pro', true, NOW(), NOW()),
    
    -- Video Models
    ('runway-video', 2.0, 'video', 'Runway Video', true, NOW(), NOW()),
    ('veo3-fast', 1.5, 'video', 'Veo3 Fast', true, NOW(), NOW()),
    ('minimax-2.0', 1.8, 'video', 'Minimax 2.0', true, NOW(), NOW()),
    ('minimax-video', 1.8, 'video', 'Minimax Video', true, NOW(), NOW()),
    ('kling-2.1-master', 1.6, 'video', 'Kling 2.1 Master', true, NOW(), NOW()),
    ('seedance-pro', 1.4, 'video', 'Seedance Pro', true, NOW(), NOW()),
    ('decart-lucy-14b', 1.7, 'video', 'Decart Lucy 14B', true, NOW(), NOW()),
    ('minimax-video-01', 1.8, 'video', 'Minimax Video 01', true, NOW(), NOW()),
    ('stable-video-diffusion-i2v', 1.3, 'video', 'Stable Video Diffusion I2V', true, NOW(), NOW()),
    ('modelscope-i2v', 1.2, 'video', 'ModelScope I2V', true, NOW(), NOW()),
    ('text2video-zero-i2v', 1.1, 'video', 'Text2Video Zero I2V', true, NOW(), NOW()),
    ('wan-v2-2-a14b-i2v-lora', 1.4, 'video', 'WAN V2.2 A14B I2V LoRA', true, NOW(), NOW()),
    ('cogvideo-i2v', 1.3, 'video', 'CogVideo I2V', true, NOW(), NOW()),
    ('zeroscope-t2v', 1.0, 'video', 'ZeroScope T2V', true, NOW(), NOW()),
    ('minimax-i2v-director', 1.9, 'video', 'Minimax I2V Director', true, NOW(), NOW()),
    ('hailuo-02-pro', 1.8, 'video', 'Hailuo 02 Pro', true, NOW(), NOW()),
    ('kling-video-pro', 1.7, 'video', 'Kling Video Pro', true, NOW(), NOW()),
    ('kling-ai-avatar', 2.5, 'video', 'Kling AI Avatar', true, NOW(), NOW())
ON CONFLICT (model_name) 
DO UPDATE SET 
    cost_per_generation = EXCLUDED.cost_per_generation,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify all models were added/updated
SELECT 
    model_name, 
    cost_per_generation, 
    category, 
    display_name, 
    is_active,
    created_at,
    updated_at
FROM public.model_costs 
WHERE model_name IN (
    'wan-25-preview-image-to-video',
    'qwen-image-edit-plus',
    'kling-video-v2-5-turbo-pro-image-to-video',
    'nano-banana',
    'runway-t2i',
    'seedream-4-edit',
    'bytedance-seedream-4',
    'gemini-25-flash-image-edit',
    'luma-photon-reframe',
    'flux-dev',
    'seedream-3',
    'seedance-1-pro',
    'runway-video',
    'veo3-fast',
    'minimax-2.0',
    'minimax-video',
    'kling-2.1-master',
    'seedance-pro',
    'decart-lucy-14b',
    'minimax-video-01',
    'stable-video-diffusion-i2v',
    'modelscope-i2v',
    'text2video-zero-i2v',
    'wan-v2-2-a14b-i2v-lora',
    'cogvideo-i2v',
    'zeroscope-t2v',
    'minimax-i2v-director',
    'hailuo-02-pro',
    'kling-video-pro',
    'kling-ai-avatar'
)
ORDER BY category, model_name;

-- Show summary counts
SELECT 
    category,
    COUNT(*) as model_count,
    SUM(cost_per_generation) as total_cost_per_generation
FROM public.model_costs 
WHERE is_active = true
GROUP BY category
ORDER BY category;
