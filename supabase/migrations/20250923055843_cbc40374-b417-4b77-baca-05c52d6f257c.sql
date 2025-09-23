-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;