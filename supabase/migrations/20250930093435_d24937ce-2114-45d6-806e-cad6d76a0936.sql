-- Fix profiles table security issue
-- Make user_id NOT NULL to prevent any profiles without proper ownership
-- This ensures RLS policies work correctly and email addresses cannot be harvested

-- First, ensure all existing rows have a user_id (if any exist)
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;