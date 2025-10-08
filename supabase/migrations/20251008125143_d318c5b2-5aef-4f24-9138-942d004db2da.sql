-- Add action column to scheduled_tasks table
ALTER TABLE scheduled_tasks ADD COLUMN action text;

COMMENT ON COLUMN scheduled_tasks.action IS 'AI-recommended study action/recommendation';