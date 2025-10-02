-- Phase 1: Add difficulty ranking to tasks
ALTER TABLE tasks ADD COLUMN difficulty integer DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5);

-- Phase 3: Create friends system with unique friend codes
CREATE TABLE user_friend_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_friend_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friend code"
  ON user_friend_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own friend code"
  ON user_friend_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Friends relationship table
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id);

-- Phase 4: Add user avatar preferences
ALTER TABLE profiles ADD COLUMN avatar_gender text DEFAULT 'male' CHECK (avatar_gender IN ('male', 'female'));
ALTER TABLE profiles ADD COLUMN ui_mode text DEFAULT 'standard' CHECK (ui_mode IN ('standard', 'game'));

-- Phase 5: Study group enhancements for ballroom features
CREATE TABLE study_group_music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  youtube_url text NOT NULL,
  added_by uuid NOT NULL REFERENCES auth.users(id),
  is_playing boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_group_music ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group music"
  ON study_group_music FOR SELECT
  USING (group_id IN (
    SELECT group_id FROM study_group_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Members can add music"
  ON study_group_music FOR INSERT
  WITH CHECK (
    auth.uid() = added_by AND
    group_id IN (SELECT group_id FROM study_group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update music status"
  ON study_group_music FOR UPDATE
  USING (group_id IN (
    SELECT group_id FROM study_group_members WHERE user_id = auth.uid()
  ));

-- Function to auto-create friend code on profile creation
CREATE OR REPLACE FUNCTION create_user_friend_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_friend_codes (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_created_friend_code
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_friend_code();