-- Fix the infinite recursion in study_group_members RLS policy
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view members of their groups" ON study_group_members;

-- Create a security definer function to check if user is a group member
CREATE OR REPLACE FUNCTION public.is_group_member(group_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM study_group_members
    WHERE group_id = group_id_param
      AND user_id = user_id_param
  );
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view members of their groups"
ON study_group_members
FOR SELECT
TO authenticated
USING (public.is_group_member(group_id, auth.uid()));