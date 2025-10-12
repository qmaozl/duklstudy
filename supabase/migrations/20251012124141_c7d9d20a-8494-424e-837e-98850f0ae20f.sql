-- Add RLS policy to allow users to view groups by invite code
-- This allows users to join groups using invite codes without being members first
CREATE POLICY "Users can view groups by invite code"
ON study_groups
FOR SELECT
USING (invite_code IS NOT NULL);