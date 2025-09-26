-- Replace wan-v2-2-a14b-i2v-lora with wan-2.2-animate in model_costs table
-- This script updates the model configuration to use the new Wan 2.2 Animate model

-- 1. Remove the old model
DELETE FROM model_costs WHERE model_name = 'wan-v2-2-a14b-i2v-lora';

-- 2. Add the new model
INSERT INTO model_costs (model_name, cost_per_generation, category, display_name, allowed_tiers, is_active, created_at, updated_at) VALUES
('wan-2.2-animate', 0.04, 'video', 'Wan 2.2 Animate', '["premium", "pro"]'::jsonb, true, NOW(), NOW());

-- 3. Verify the change
SELECT 
  model_name,
  cost_per_generation,
  category,
  display_name,
  allowed_tiers,
  is_active
FROM model_costs 
WHERE model_name IN ('wan-v2-2-a14b-i2v-lora', 'wan-2.2-animate')
ORDER BY model_name;

-- 4. Show all video models to confirm the update
SELECT 
  model_name,
  cost_per_generation,
  display_name,
  allowed_tiers
FROM model_costs 
WHERE category = 'video'
ORDER BY model_name;
