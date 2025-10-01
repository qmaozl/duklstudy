-- Add subject column to study_sessions table
ALTER TABLE public.study_sessions
ADD COLUMN subject text;

-- Create tasks table for Cram Master
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('test', 'exam', 'homework', 'project')),
  subject text NOT NULL,
  due_date date NOT NULL,
  priority_order integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks
CREATE POLICY "Users can view their own tasks"
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);

-- Create study_streaks table
CREATE TABLE public.study_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_study_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on study_streaks
ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_streaks
CREATE POLICY "Users can view their own streak"
ON public.study_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
ON public.study_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
ON public.study_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Create scheduled_tasks table for generated schedules
CREATE TABLE public.scheduled_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  duration_minutes integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on scheduled_tasks
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_tasks
CREATE POLICY "Users can view their own scheduled tasks"
ON public.scheduled_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled tasks"
ON public.scheduled_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled tasks"
ON public.scheduled_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled tasks"
ON public.scheduled_tasks FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for tasks updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for study_streaks updated_at
CREATE TRIGGER update_study_streaks_updated_at
BEFORE UPDATE ON public.study_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();