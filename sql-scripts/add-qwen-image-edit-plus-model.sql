-- Add Qwen Image Edit Plus model to the model_costs table
-- Run this in Supabase SQL Editor

INSERT INTO public.model_costs (model_name, cost_per_generation, category, display_name, is_active, created_at, updated_at)
VALUES 
    ('qwen-image-edit-plus', 0.8, 'image', 'Qwen Image Edit Plus', true, NOW(), NOW())
ON CONFLICT (model_name) 
DO UPDATE SET 
    cost_per_generation = EXCLUDED.cost_per_generation,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify the model was added
SELECT * FROM public.model_costs WHERE model_name = 'qwen-image-edit-plus';
