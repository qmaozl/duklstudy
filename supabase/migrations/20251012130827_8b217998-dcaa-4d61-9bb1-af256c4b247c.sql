-- First, check if there are any existing NULL user_id records and handle them
-- We'll set a default system user for any orphaned records (if any exist)
-- In practice, these shouldn't exist due to RLS policies

-- For study_materials: Update any NULL user_ids
-- Note: This is a safety measure; RLS policies should prevent NULL insertions
UPDATE study_materials 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- For study_sessions: Update any NULL user_ids  
UPDATE study_sessions
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Now make user_id NOT NULL on both tables
ALTER TABLE study_materials 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE study_sessions
ALTER COLUMN user_id SET NOT NULL;

-- Add comments documenting the security requirement
COMMENT ON COLUMN study_materials.user_id IS 'Required owner of study materials. NOT NULL enforces data ownership and RLS policies.';
COMMENT ON COLUMN study_sessions.user_id IS 'Required owner of study session. NOT NULL enforces data ownership and RLS policies.';