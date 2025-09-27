import { useTimer } from './useTimer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useStudyGroupTimer(groupId?: string) {
  const timer = useTimer();
  const { user } = useAuth();

  const stop = async () => {
    if (timer.seconds > 0 && user && groupId) {
      const minutes = Math.floor(timer.seconds / 60);
      if (minutes > 0) {
        try {
          // Save to both regular study sessions and group sessions
          await Promise.all([
            supabase.from('study_sessions').insert({
              user_id: user.id,
              duration_minutes: minutes,
              date: new Date().toISOString().split('T')[0]
            }),
            supabase.from('study_group_sessions').insert({
              group_id: groupId,
              user_id: user.id,
              duration_minutes: minutes,
              date: new Date().toISOString().split('T')[0]
            })
          ]);

          toast({
            title: "Study session saved!",
            description: `Great job! You studied for ${minutes} minute${minutes > 1 ? 's' : ''} and earned group points!`,
          });
        } catch (error) {
          console.error('Error saving group study session:', error);
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