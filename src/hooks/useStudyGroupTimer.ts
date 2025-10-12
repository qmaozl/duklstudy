import { useTimer } from './useTimer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useStudyGroupTimer(groupId?: string) {
  const timer = useTimer();
  const { user } = useAuth();

  const stop = async () => {
    if (timer.seconds > 0 && user) {
      const minutes = Math.floor(timer.seconds / 60);
      if (minutes > 0) {
        try {
          // Save to study_sessions
          const sessionResult = await supabase.from('study_sessions').insert({
            user_id: user.id,
            duration_minutes: minutes,
            date: new Date().toISOString().split('T')[0]
          });

          if (sessionResult.error) {
            console.error('Error saving study session:', sessionResult.error);
            throw sessionResult.error;
          }

          // Only save to group sessions if a group is selected
          if (groupId) {
            const groupSessionResult = await supabase.from('study_group_sessions').insert({
              group_id: groupId,
              user_id: user.id,
              duration_minutes: minutes,
              date: new Date().toISOString().split('T')[0]
            });

            if (groupSessionResult.error) {
              console.error('Error saving group study session:', groupSessionResult.error);
              throw groupSessionResult.error;
            }
          }

          toast({
            title: "Study session saved!",
            description: groupId 
              ? `Great job! You studied for ${minutes} minute${minutes > 1 ? 's' : ''} and earned group points!`
              : `Great job! You studied for ${minutes} minute${minutes > 1 ? 's' : ''}!`,
          });
        } catch (error) {
          console.error('Error saving study session:', error);
          toast({
            title: "Error saving session",
            description: "Your study session couldn't be saved, but keep up the great work!",
            variant: "destructive"
          });
        }
      }
    }

    return timer.stop();
  };

  return {
    ...timer,
    stop
  };
}