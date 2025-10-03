-- VARY AI PRICING REFERENCE SCRIPT
-- This script contains the official pricing structure for all models
-- Based on analytics data and current pricing configuration

-- ============================================
-- CREDIT SYSTEM OVERVIEW
-- ============================================

SELECT 
  'CREDIT SYSTEM OVERVIEW' as info,
  '1 vcred = 1 nano banana image' as basic_unit,
  '$0.0398 per nano banana image' as actual_cost,
  '1 credit = $0.05' as credit_value,
  '3 generations × 4 variations = 12 vcreds' as standard_generation;

-- ============================================
-- MODEL PRICING STRUCTURE
-- ============================================

-- Basic Models (1 vcred each)
SELECT 
  'BASIC MODELS - 1 VCRED EACH' as category,
  'nano-banana' as model,
  0.0398 as cost_per_image,
  1 as vcreds_required,
  'Image editing' as type;

SELECT 
  'BASIC MODELS - 1 VCRED EACH' as category,
  'runway-t2i' as model,
  0.0398 as cost_per_image,
  1 as vcreds_required,
  'Image generation' as type;

SELECT 
  'BASIC MODELS - 1 VCRED EACH' as category,
  'minimax-2.0' as model,
  0.0398 as cost_per_image,
  1 as vcreds_required,
  'Image generation' as type;

SELECT 
  'BASIC MODELS - 1 VCRED EACH' as category,
  'kling-2.1-master' as model,
  0.0398 as cost_per_image,
  1 as vcreds_required,
  'Image generation' as type;

SELECT 
  'BASIC MODELS - 1 VCRED EACH' as category,
  'flux-dev' as model,
  0.0398 as cost_per_image,
  1 as vcreds_required,
  'Image generation' as type;

SELECT 
  'BASIC MODELS - 1 VCRED EACH' as category,
  'gemini-25-flash-image-edit' as model,
  0.0398 as cost_per_image,
  1 as vcreds_required,
  'Image editing' as type;

-- Premium Models (4 vcreds each)
SELECT 
  'PREMIUM MODELS - 4 VCREDS EACH' as category,
  'veo3-fast' as model,
  0.15 as cost_per_second,
  4 as vcreds_required,
  'Video generation' as type;

SELECT 
  'PREMIUM MODELS - 4 VCREDS EACH' as category,
  'runway-video' as model,
  0.15 as cost_per_second,
  4 as vcreds_required,
  'Video generation' as type;

SELECT 
  'PREMIUM MODELS - 4 VCREDS EACH' as category,
  'minimax-video' as model,
  0.15 as cost_per_second,
  4 as vcreds_required,
  'Video generation' as type;

SELECT 
  'PREMIUM MODELS - 4 VCREDS EACH' as category,
  'kling-ai-avatar' as model,
  0.15 as cost_per_second,
  4 as vcreds_required,
  'Video generation' as type;

SELECT 
  'PREMIUM MODELS - 4 VCREDS EACH' as category,
  'seedance-pro' as model,
  0.15 as cost_per_second,
  4 as vcreds_required,
  'Video generation' as type;

-- Ultra-Premium Models (63+ vcreds each)
SELECT 
  'ULTRA-PREMIUM MODELS - 63+ VCREDS EACH' as category,
  'seedance-pro' as model,
  2.50 as cost_per_generation,
  63 as vcreds_required,
  'Ultra-premium video' as type;

SELECT 
  'ULTRA-PREMIUM MODELS - 63+ VCREDS EACH' as category,
  'seedance-pro-t2v' as model,
  2.50 as cost_per_generation,
  63 as vcreds_required,
  'Ultra-premium video' as type;

-- ============================================
-- GENERATION CAPACITY CALCULATIONS
-- ============================================

-- Standard user with 12 vcreds
SELECT 
  'STANDARD USER (12 VCREDS)' as user_type,
  12 as total_vcreds,
  12 as nano_banana_images,
  3 as premium_videos,
  0 as ultra_premium_generations,
  '3 generations × 4 variations' as description;

-- Premium user with 200 vcreds
SELECT 
  'PREMIUM USER (200 VCREDS)' as user_type,
  200 as total_vcreds,
  200 as nano_banana_images,
  50 as premium_videos,
  3 as ultra_premium_generations,
  'Extensive testing capacity' as description;

-- Infinite user (999999 vcreds)
SELECT 
  'INFINITE USER (999999 VCREDS)' as user_type,
  999999 as total_vcreds,
  999999 as nano_banana_images,
  249999 as premium_videos,
  15873 as ultra_premium_generations,
  'Unlimited capacity' as description;

-- ============================================
-- CREDIT DISTRIBUTION RECOMMENDATIONS
-- ============================================

SELECT 
  'CREDIT DISTRIBUTION RECOMMENDATIONS' as info,
  'All remaining users' as target,
  12 as recommended_vcreds,
  '3 generations (12 nano banana images)' as capacity,
  'Sufficient for basic testing' as reason;

SELECT 
  'CREDIT DISTRIBUTION RECOMMENDATIONS' as info,
  'adilamahone@gmail.com' as target,
  999999 as recommended_vcreds,
  'Infinite capacity' as capacity,
  'Special user with unlimited access' as reason;

-- ============================================
-- PRICING HISTORY FROM ANALYTICS
-- ============================================

-- Based on FAL AI usage data
SELECT 
  'PRICING HISTORY FROM ANALYTICS' as info,
  'nano-banana' as model,
  0.0398 as actual_cost_per_image,
  '2025-09-01 to 2025-09-30' as period,
  'FAL AI usage data' as source;

SELECT 
  'PRICING HISTORY FROM ANALYTICS' as info,
  'veo3-fast' as model,
  0.15 as actual_cost_per_second,
  '2025-09-01 to 2025-09-30' as period,
  'FAL AI usage data' as source;

-- ============================================
-- FINAL PRICING SUMMARY
-- ============================================

SELECT 
  'FINAL PRICING SUMMARY' as status,
  '1 vcred = 1 nano banana image' as basic_rule,
  '4 vcreds = 1 premium video' as premium_rule,
  '63 vcreds = 1 ultra-premium generation' as ultra_premium_rule,
  'All pricing based on actual FAL AI costs' as source,
  NOW() as reference_date;
