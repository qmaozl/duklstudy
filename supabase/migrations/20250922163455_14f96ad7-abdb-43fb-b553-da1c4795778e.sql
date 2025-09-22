-- Create function to automatically update user level based on points
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  level_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 5000];
  new_level INTEGER := 1;
  threshold INTEGER;
BEGIN
  -- Calculate the new level based on points
  FOR i IN REVERSE array_length(level_thresholds, 1)..1 LOOP
    threshold := level_thresholds[i];
    IF NEW.points >= threshold THEN
      new_level := i;
      EXIT;
    END IF;
  END LOOP;
  
  -- Update the level if it changed
  IF NEW.level != new_level THEN
    NEW.level := new_level;
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update level when points change
DROP TRIGGER IF EXISTS update_level_on_points_change ON public.profiles;
CREATE TRIGGER update_level_on_points_change
  BEFORE UPDATE OF points ON public.profiles
  FOR EACH ROW
  WHEN (OLD.points IS DISTINCT FROM NEW.points)
  EXECUTE FUNCTION public.update_user_level();

-- Also trigger on insert to set initial level
DROP TRIGGER IF EXISTS set_initial_level ON public.profiles;
CREATE TRIGGER set_initial_level
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_level();

-- Give the current user some starter points to test the system (25 points for first login)
UPDATE public.profiles 
SET points = 25, updated_at = NOW()
WHERE points = 0 AND level = 1;