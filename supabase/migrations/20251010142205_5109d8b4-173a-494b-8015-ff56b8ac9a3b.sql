-- Create study_group_chat table for real-time group messaging
CREATE TABLE public.study_group_chat (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_group_chat ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Members can view group chat messages"
ON public.study_group_chat
FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM study_group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages"
ON public.study_group_chat
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  group_id IN (
    SELECT group_id FROM study_group_members WHERE user_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_chat;

-- Create index for performance
CREATE INDEX idx_study_group_chat_group_id ON public.study_group_chat(group_id);
CREATE INDEX idx_study_group_chat_created_at ON public.study_group_chat(created_at DESC);