-- Remove the problematic default and ensure the policy is correct
ALTER TABLE public.study_groups ALTER COLUMN owner_id DROP DEFAULT;

-- Double check our INSERT policy is working correctly
DROP POLICY IF EXISTS "Users can create groups" ON public.study_groups;

CREATE POLICY "Users can create groups" 
ON public.study_groups 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);