-- Add all models that appear in the dropdowns to model_costs table
-- This ensures all models available to users are properly configured in the credit system

-- Image Models (1 credit each - basic models)
INSERT INTO model_costs (model_name, cost_per_generation, allowed_tiers, is_active, created_at, updated_at) VALUES
('runway-t2i', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('nano-banana', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('fal-ai/bytedance/seedream/v4/edit', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('bytedance/seedream-4', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('gemini-25-flash-image-edit', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('qwen-image-edit-plus', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),
('luma-photon-reframe', 0.01, ARRAY['free', 'premium', 'pro'], true, NOW(), NOW()),

-- Video Models (4 credits each - premium models)
('veo3-fast', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('minimax-2.0', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('kling-2.1-master', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('kling-ai-avatar', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('decart-lucy-14b', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('stable-video-diffusion-i2v', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('modelscope-i2v', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('text2video-zero-i2v', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW()),
('runway-video', 0.04, ARRAY['premium', 'pro'], true, NOW(), NOW())

ON CONFLICT (model_name) DO UPDATE SET
  cost_per_generation = EXCLUDED.cost_per_generation,
  allowed_tiers = EXCLUDED.allowed_tiers,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify all dropdown models are present and active
SELECT 
  model_name,
  cost_per_generation,
  allowed_tiers,
  is_active,
  created_at
FROM model_costs 
WHERE model_name IN (
  'runway-t2i',
  'nano-banana',
  'fal-ai/bytedance/seedream/v4/edit',
  'bytedance/seedream-4',
  'gemini-25-flash-image-edit',
  'qwen-image-edit-plus',
  'luma-photon-reframe',
  'veo3-fast',
  'minimax-2.0',
  'kling-2.1-master',
  'kling-ai-avatar',
  'decart-lucy-14b',
  'stable-video-diffusion-i2v',
  'modelscope-i2v',
  'text2video-zero-i2v',
  'runway-video'
)
AND is_active = true
ORDER BY cost_per_generation, model_name;
