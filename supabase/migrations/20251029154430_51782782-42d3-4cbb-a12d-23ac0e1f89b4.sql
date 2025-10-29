-- Add sharing capabilities to user_playlists
ALTER TABLE public.user_playlists
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_id UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS playlist_name TEXT DEFAULT 'My Playlist',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for efficient share_id lookups
CREATE INDEX IF NOT EXISTS idx_user_playlists_share_id ON public.user_playlists(share_id) WHERE is_public = true;

-- Enable RLS
ALTER TABLE public.user_playlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own playlists
CREATE POLICY "Users can view own playlists"
ON public.user_playlists
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own playlists
CREATE POLICY "Users can insert own playlists"
ON public.user_playlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own playlists
CREATE POLICY "Users can update own playlists"
ON public.user_playlists
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own playlists
CREATE POLICY "Users can delete own playlists"
ON public.user_playlists
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Anyone can view public playlists
CREATE POLICY "Anyone can view public playlists"
ON public.user_playlists
FOR SELECT
USING (is_public = true);