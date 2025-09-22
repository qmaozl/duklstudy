import { supabase } from '@/integrations/supabase/client';

// Level thresholds for progression
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 5000];

// Calculate level from points
export const calculateLevel = (points: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

// Award points to user and update level
export const awardPoints = async (userId: string, points: number, reason: string = '') => {
  try {
    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, level')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { success: false, error: profileError.message };
    }

    const newPoints = (profile?.points || 0) + points;
    const newLevel = calculateLevel(newPoints);
    const leveledUp = newLevel > (profile?.level || 1);

    // Update profile with new points and level
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        points: newPoints,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Awarded ${points} points to user ${userId}. Reason: ${reason}`);
    
    return {
      success: true,
      newPoints,
      newLevel,
      leveledUp,
      pointsAwarded: points
    };
  } catch (error) {
    console.error('Error in awardPoints:', error);
    return { success: false, error: 'Failed to award points' };
  }
};

// Point rewards for different activities
export const POINT_REWARDS = {
  STUDY_MATERIAL_GENERATED: 10,
  QUIZ_QUESTION_CORRECT: 5,
  QUIZ_COMPLETED: 20,
  FLASHCARD_REVIEWED: 2,
  STUDY_SESSION_COMPLETED: 15,
  FIRST_LOGIN: 25,
  DAILY_STREAK: 10,
};