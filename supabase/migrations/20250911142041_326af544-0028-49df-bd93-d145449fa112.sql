-- Fix security issue: Add user ownership to database table and proper RLS policies

-- Add user_id column to track ownership
ALTER TABLE public.database 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all access to database table" ON public.database;

-- Create proper RLS policies with user-based access control
CREATE POLICY "Users can view their own database content" 
ON public.database 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own database content" 
ON public.database 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own database content" 
ON public.database 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own database content" 
ON public.database 
FOR DELETE 
USING (auth.uid() = user_id);