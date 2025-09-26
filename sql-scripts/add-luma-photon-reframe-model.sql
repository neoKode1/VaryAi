-- Add luma-photon-reframe model to model_costs table
-- This model is used for image reframing and should have a low cost

INSERT INTO model_costs (
  model_name,
  cost_per_generation,
  allowed_tiers,
  is_active,
  created_at,
  updated_at
) VALUES (
  'luma-photon-reframe',
  0.01, -- $0.01 per generation (very low cost for reframing)
  ARRAY['free', 'premium', 'pro'], -- Available to all tiers
  true,
  NOW(),
  NOW()
) ON CONFLICT (model_name) DO UPDATE SET
  cost_per_generation = EXCLUDED.cost_per_generation,
  allowed_tiers = EXCLUDED.allowed_tiers,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the model was added
SELECT 
  model_name,
  cost_per_generation,
  allowed_tiers,
  is_active,
  created_at
FROM model_costs 
WHERE model_name = 'luma-photon-reframe';
