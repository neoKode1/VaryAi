-- Add all missing models to model_costs table
-- This script ensures all models used in the application are properly configured

-- Image Models
INSERT INTO model_costs (model_name, cost_per_generation, allowed_tiers, is_active, created_at, updated_at) VALUES
('nano-banana', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('runway-t2i', 0.02, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('flux-dev', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('gemini-25-flash-image-edit', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('qwen-image-edit-plus', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('luma-photon-reframe', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),

-- Video Models
('runway-video', 0.05, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('veo3-fast', 0.10, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('minimax-2.0', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('minimax-video', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('kling-2.1-master', 0.10, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('kling-ai-avatar', 0.15, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('seedance-pro', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('decart-lucy-14b', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('minimax-i2v-director', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('hailuo-02-pro', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('kling-video-pro', 0.10, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('seedream-3', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('seedance-1-pro', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('bytedance/seedream-4', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('fal-ai/bytedance/seedream/v4/edit', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),

-- Mid-Tier Image-to-Video Models
('minimax-video-01', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('stable-video-diffusion-i2v', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('modelscope-i2v', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('text2video-zero-i2v', 0.08, ARRAY['premium', 'pro'], true, NOW(), NOW()),

-- Lower-Tier Image-to-Video Models
('wan-v2-2-a14b-i2v-lora', 0.10, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('wan-25-preview-image-to-video', 0.10, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('kling-video-v2-5-turbo-pro-image-to-video', 0.10, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('cogvideo-i2v', 0.10, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('zeroscope-t2v', 0.10, ARRAY['premium', 'pro'], true, NOW(), NOW())

ON CONFLICT (model_name) DO UPDATE SET
  cost_per_generation = EXCLUDED.cost_per_generation,
  allowed_tiers = EXCLUDED.allowed_tiers,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify all models were added
SELECT 
  model_name,
  cost_per_generation,
  allowed_tiers,
  is_active,
  created_at
FROM model_costs 
WHERE is_active = true
ORDER BY cost_per_generation, model_name;
