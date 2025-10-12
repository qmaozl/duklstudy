-- Fix the INSERT policy for study_groups to use WITH CHECK instead of USING
DROP POLICY IF EXISTS "Users can create groups" ON public.study_groups;

CREATE POLICY "Users can create groups" 
ON public.study_groups 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);