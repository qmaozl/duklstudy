-- Add active sessions tracking for real-time study rooms
CREATE TABLE IF NOT EXISTS public.study_room_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pseudonym text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  last_heartbeat timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.study_room_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view active sessions in their rooms"
ON public.study_room_sessions
FOR SELECT
USING (
  group_id IN (
    SELECT group_id 
    FROM study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own sessions"
ON public.study_room_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.study_room_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.study_room_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_study_room_sessions_group_active 
ON public.study_room_sessions(group_id, is_active, last_heartbeat);

-- Enable realtime for active sessions
ALTER PUBLICATION supabase_realtime ADD TABLE study_room_sessions;
ALTER TABLE study_room_sessions REPLICA IDENTITY FULL;