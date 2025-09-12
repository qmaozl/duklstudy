-- Add streak and timing columns to quiz_results table
ALTER TABLE public.quiz_results 
ADD COLUMN answer_time_seconds INTEGER DEFAULT NULL,
ADD COLUMN streak_count INTEGER DEFAULT 0,
ADD COLUMN bonus_points INTEGER DEFAULT 0;

-- Create user quiz sessions table to track overall quiz performance
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  study_material_id UUID NOT NULL,
  current_question INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  questions_total INTEGER DEFAULT 0,
  session_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for quiz_sessions
CREATE POLICY "Users can view their own quiz sessions" 
ON public.quiz_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz sessions" 
ON public.quiz_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz sessions" 
ON public.quiz_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_quiz_sessions_updated_at
BEFORE UPDATE ON public.quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_quiz_sessions_user_material ON public.quiz_sessions(user_id, study_material_id);