-- FIX IMAGE_UPLOADS TABLE - ADD MISSING STORAGE_BUCKET COLUMN
-- This fixes the error: Could not find the 'storage_bucket' column of 'image_uploads' in the schema cache

-- ============================================
-- STEP 1: CHECK CURRENT TABLE STRUCTURE
-- ============================================

SELECT 
  'CURRENT TABLE STRUCTURE' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'image_uploads' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- STEP 2: ADD STORAGE_BUCKET COLUMN IF MISSING
-- ============================================

-- Add storage_bucket column if it doesn't exist
ALTER TABLE public.image_uploads 
ADD COLUMN IF NOT EXISTS storage_bucket TEXT DEFAULT 'images';

-- ============================================
-- STEP 3: UPDATE EXISTING RECORDS
-- ============================================

-- Update existing records to have the correct bucket
UPDATE public.image_uploads 
SET storage_bucket = 'images' 
WHERE storage_bucket IS NULL;

-- ============================================
-- STEP 4: CREATE INDEX FOR PERFORMANCE
-- ============================================

-- Create index on storage_bucket for better performance
CREATE INDEX IF NOT EXISTS idx_image_uploads_storage_bucket 
ON public.image_uploads(storage_bucket);

-- ============================================
-- STEP 5: VERIFY THE FIX
-- ============================================

SELECT 
  'AFTER FIX - TABLE STRUCTURE' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'image_uploads' 
  AND table_schema = 'public'
  AND column_name = 'storage_bucket';

-- ============================================
-- STEP 6: CHECK EXISTING DATA
-- ============================================

SELECT 
  'EXISTING DATA CHECK' as info,
  COUNT(*) as total_records,
  COUNT(CASE WHEN storage_bucket IS NOT NULL THEN 1 END) as records_with_bucket,
  COUNT(CASE WHEN storage_bucket IS NULL THEN 1 END) as records_without_bucket
FROM public.image_uploads;

-- ============================================
-- STEP 7: FINAL STATUS
-- ============================================

SELECT 
  'STORAGE_BUCKET COLUMN FIX COMPLETE' as status,
  'Column added successfully' as message,
  'image_uploads table now supports storage_bucket field' as details,
  NOW() as fixed_at;
