-- Check the actual structure of the user_credits table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
