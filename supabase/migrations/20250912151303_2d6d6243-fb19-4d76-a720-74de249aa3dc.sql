-- Create quiz results table for tracking user quiz attempts
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  study_material_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quiz results" 
ON public.quiz_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results" 
ON public.quiz_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_quiz_results_user_material ON public.quiz_results(user_id, study_material_id);

-- Create wrong answers table for tracking questions users got wrong
CREATE TABLE public.wrong_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  study_material_id UUID NOT NULL,
  question_data JSONB NOT NULL,
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  mastered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wrong_answers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own wrong answers" 
ON public.wrong_answers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wrong answers" 
ON public.wrong_answers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wrong answers" 
ON public.wrong_answers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_wrong_answers_updated_at
BEFORE UPDATE ON public.wrong_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();