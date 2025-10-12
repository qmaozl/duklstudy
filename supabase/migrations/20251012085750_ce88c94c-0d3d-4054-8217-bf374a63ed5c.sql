-- Ensure owner_id defaults to current user id for study_groups
ALTER TABLE public.study_groups ALTER COLUMN owner_id SET DEFAULT auth.uid();