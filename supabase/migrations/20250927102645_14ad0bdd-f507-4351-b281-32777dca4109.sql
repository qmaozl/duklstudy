-- Create study groups table
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'base64'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study group members table
CREATE TABLE public.study_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create study group leaderboard view
CREATE TABLE public.study_group_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_groups
CREATE POLICY "Users can view groups they are members of" 
ON public.study_groups 
FOR SELECT 
USING (
  id IN (
    SELECT group_id FROM public.study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups" 
ON public.study_groups 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" 
ON public.study_groups 
FOR UPDATE 
USING (auth.uid() = owner_id);

-- RLS policies for study_group_members
CREATE POLICY "Users can view members of their groups" 
ON public.study_group_members 
FOR SELECT 
USING (
  group_id IN (
    SELECT group_id FROM public.study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups" 
ON public.study_group_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for study_group_sessions
CREATE POLICY "Users can view sessions from their groups" 
ON public.study_group_sessions 
FOR SELECT 
USING (
  group_id IN (
    SELECT group_id FROM public.study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own group sessions" 
ON public.study_group_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updating timestamps
CREATE TRIGGER update_study_groups_updated_at
BEFORE UPDATE ON public.study_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();