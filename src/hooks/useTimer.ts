import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type TimerState = 'stopped' | 'running' | 'paused';

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [state, setState] = useState<TimerState>('stopped');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state === 'running') {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  const start = useCallback(() => {
    if (state === 'stopped') {
      setStartTime(new Date());
    }
    setState('running');
  }, [state]);

  const pause = useCallback(() => {
    setState('paused');
  }, []);

  const stop = useCallback(async () => {
    if (seconds > 0 && user) {
      const minutes = Math.floor(seconds / 60);
      if (minutes > 0) {
        try {
          const { error } = await supabase
            .from('study_sessions')
            .insert({
              user_id: user.id,
              duration_minutes: minutes,
              date: new Date().toISOString().split('T')[0]
            });

          if (error) throw error;

          toast({
            title: "Study session saved!",
            description: `Great job! You studied for ${minutes} minute${minutes > 1 ? 's' : ''}.`,
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

    setSeconds(0);
    setState('stopped');
    setStartTime(null);
  }, [seconds, user]);

  const reset = useCallback(() => {
    setSeconds(0);
    setState('stopped');
    setStartTime(null);
  }, []);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    seconds,
    state,
    startTime,
    start,
    pause,
    stop,
    reset,
    formatTime,
    formattedTime: formatTime(seconds)
  };
}