-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscribers table for subscription tracking
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT DEFAULT 'free', -- free, pro, premium
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create study_sessions table for timer tracking
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create study_materials table for generated content
CREATE TABLE public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'image', 'youtube'
  original_content TEXT,
  corrected_text TEXT,
  key_concepts TEXT[], -- Array of key concepts
  summary TEXT,
  flashcards JSONB, -- Array of {question, answer} objects
  quiz JSONB, -- Quiz object with questions and answers
  sources TEXT[], -- Array of suggested sources
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can update subscriptions" ON public.subscribers
FOR UPDATE USING (true);

CREATE POLICY "Edge functions can insert subscriptions" ON public.subscribers
FOR INSERT WITH CHECK (true);

-- Create RLS policies for study_sessions
CREATE POLICY "Users can view their own sessions" ON public.study_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.study_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for study_materials
CREATE POLICY "Users can view their own materials" ON public.study_materials
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials" ON public.study_materials
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials" ON public.study_materials
FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO public.subscribers (user_id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_materials_updated_at
  BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();