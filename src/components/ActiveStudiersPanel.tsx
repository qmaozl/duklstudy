import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ActiveUser {
  id: string;
  user_id: string;
  pseudonym: string;
  started_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ActiveStudiersPanelProps {
  groupId: string;
  className?: string;
}

const ActiveStudiersPanel: React.FC<ActiveStudiersPanelProps> = ({ groupId, className }) => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [timers, setTimers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!groupId) return;

    fetchActiveUsers();

    const channel = supabase
      .channel(`active-studiers-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_room_sessions',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          fetchActiveUsers();
        }
      )
      .subscribe();

    // Update timers every second
    const interval = setInterval(() => {
      setTimers(prevTimers => {
        const newTimers: { [key: string]: string } = {};
        activeUsers.forEach(user => {
          const started = new Date(user.started_at);
          const now = new Date();
          const totalSeconds = Math.floor((now.getTime() - started.getTime()) / 1000);
          
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          
          newTimers[user.id] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        });
        return newTimers;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [groupId, activeUsers]);

  const fetchActiveUsers = async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('study_room_sessions')
      .select('id, user_id, pseudonym, started_at')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .gte('last_heartbeat', fiveMinutesAgo)
      .order('started_at', { ascending: false });

    if (error || !data) return;

    // Fetch profiles
    const userIds = [...new Set(data.map(u => u.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const usersWithProfiles = data.map(user => ({
      ...user,
      profiles: profiles?.find(p => p.user_id === user.user_id) || {
        full_name: 'Anonymous',
        avatar_url: null
      }
    }));

    setActiveUsers(usersWithProfiles);
    
    // Initialize timers for new users
    const newTimers: { [key: string]: string } = {};
    usersWithProfiles.forEach(user => {
      const started = new Date(user.started_at);
      const now = new Date();
      const totalSeconds = Math.floor((now.getTime() - started.getTime()) / 1000);
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      newTimers[user.id] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    });
    setTimers(newTimers);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Studiers ({activeUsers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No one studying yet</p>
            <p className="text-xs">Be the first to start!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col items-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Avatar className="h-16 w-16 mb-3 ring-2 ring-primary/20">
                  <AvatarImage src={user.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.profiles?.full_name || 'AN')}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-sm text-center mb-1 truncate w-full text-foreground">
                  {user.profiles?.full_name || user.pseudonym}
                </p>
                <Badge variant="secondary" className="text-xs font-mono">
                  <Clock className="h-3 w-3 mr-1" />
                  {timers[user.id] || '00:00:00'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveStudiersPanel;
