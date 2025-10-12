import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StudyRoomLiveProps {
  groupId: string;
  groupName: string;
  onRoomJoin?: (isJoined: boolean) => void;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_minutes: number;
  rank: number;
}

const StudyRoomLive = React.forwardRef<{ leaveRoom: () => void }, StudyRoomLiveProps>(
  ({ groupId, groupName, onRoomJoin }, ref) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mySessionId, setMySessionId] = useState<string | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !groupId) return;

    // Fetch initial data
    fetchLeaderboard();

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [user, groupId]);



  const fetchLeaderboard = async () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('study_group_sessions')
      .select('user_id, duration_minutes')
      .eq('group_id', groupId)
      .gte('date', oneWeekAgo);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return;
    }

    // Aggregate by user
    const userTotals: { [key: string]: number } = {};
    data?.forEach(session => {
      userTotals[session.user_id] = (userTotals[session.user_id] || 0) + session.duration_minutes;
    });

    // Fetch user profiles
    const userIds = Object.keys(userTotals);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const leaderboardData = Object.entries(userTotals)
      .map(([userId, minutes]) => ({
        user_id: userId,
        full_name: profiles?.find(p => p.user_id === userId)?.full_name || 'Anonymous',
        total_minutes: minutes,
        rank: 0
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    setLeaderboard(leaderboardData);
  };

  const joinRoom = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('study_room_sessions')
      .insert({
        group_id: groupId,
        user_id: user.id,
        pseudonym: '',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error joining room:', error);
      toast({
        title: 'Error joining room',
        description: 'Please try again',
        variant: 'destructive'
      });
      return;
    }

    setMySessionId(data.id);
    setIsInRoom(true);
    onRoomJoin?.(true);

    // Start heartbeat
    heartbeatInterval.current = setInterval(async () => {
      await supabase
        .from('study_room_sessions')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('id', data.id);
    }, 30000); // Every 30 seconds

    toast({
      title: 'Joined study room!',
      description: 'You are now in the study room'
    });
  };

  const leaveRoom = async () => {
    if (!mySessionId) return;

    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    await supabase
      .from('study_room_sessions')
      .update({ is_active: false })
      .eq('id', mySessionId);

    setMySessionId(null);
    setIsInRoom(false);
    onRoomJoin?.(false);

    toast({
      title: 'Left study room',
      description: 'Your session has been saved'
    });
  };

  // Expose leaveRoom via ref
  React.useImperativeHandle(ref, () => ({
    leaveRoom
  }));


  return (
    <div className="space-y-4">
      {/* Room Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {groupName} - Live Study Room
            </CardTitle>
            {!isInRoom ? (
              <Button onClick={joinRoom} className="gradient-primary">
                Join Room
              </Button>
            ) : (
              <Button onClick={leaveRoom} variant="destructive">
                Leave Room
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isInRoom && (
            <Badge variant="default">
              You're in the room
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Weekly Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No data yet. Start studying to appear here!
                  </p>
                ) : (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={entry.rank === 1 ? 'default' : 'secondary'}>
                          #{entry.rank}
                        </Badge>
                        <span className="text-sm font-medium">{entry.full_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {entry.total_minutes}m
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

StudyRoomLive.displayName = 'StudyRoomLive';

export default StudyRoomLive;
