-- Allow users to view profiles of other users in the same study group
CREATE POLICY "Users can view profiles of study group members"
ON profiles
FOR SELECT
USING (
  user_id IN (
    SELECT DISTINCT sgm2.user_id
    FROM study_group_members sgm1
    JOIN study_group_members sgm2 ON sgm1.group_id = sgm2.group_id
    WHERE sgm1.user_id = auth.uid()
  )
);