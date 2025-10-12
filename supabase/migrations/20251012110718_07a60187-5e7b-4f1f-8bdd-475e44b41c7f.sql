-- Create user_playlists table
CREATE TABLE public.user_playlists (
  user_id UUID PRIMARY KEY,
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own playlist"
  ON public.user_playlists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own playlist"
  ON public.user_playlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlist"
  ON public.user_playlists
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_playlists_updated_at
  BEFORE UPDATE ON public.user_playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();