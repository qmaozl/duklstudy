import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Trophy, MessageSquare } from 'lucide-react';
import TwitchStyleChat from './TwitchStyleChat';
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

const StudyRoomLive = React.forwardRef<{ leaveRoom: () => void; setActiveStudying: (active: boolean) => Promise<void> }, StudyRoomLiveProps>(
  ({ groupId, groupName, onRoomJoin }, ref) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mySessionId, setMySessionId] = useState<string | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // Restore room session from localStorage on mount
  useEffect(() => {
    if (!user || !groupId) return;

    const storageKey = `room_session_${groupId}_${user.id}`;
    const savedSession = localStorage.getItem(storageKey);
    
    if (savedSession) {
      try {
        const { sessionId, inRoom } = JSON.parse(savedSession);
        setMySessionId(sessionId);
        setIsInRoom(inRoom);
        onRoomJoin?.(inRoom);
        
        // Restart heartbeat for existing session
        if (inRoom && sessionId) {
          heartbeatInterval.current = setInterval(async () => {
            await supabase
              .from('study_room_sessions')
              .update({ last_heartbeat: new Date().toISOString() })
              .eq('id', sessionId);
          }, 30000);
        }
      } catch (e) {
        console.error('Error restoring session:', e);
        localStorage.removeItem(storageKey);
      }
    }

    // Fetch initial data
    fetchLeaderboard();

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      // Don't leave room on unmount - only when user explicitly leaves
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
        is_active: false
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

    // Save session to localStorage
    const storageKey = `room_session_${groupId}_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify({
      sessionId: data.id,
      inRoom: true
    }));

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
    if (!mySessionId || !user) return;

    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    await supabase
      .from('study_room_sessions')
      .update({ is_active: false })
      .eq('id', mySessionId);

    // Clear session from localStorage
    const storageKey = `room_session_${groupId}_${user.id}`;
    localStorage.removeItem(storageKey);

    setMySessionId(null);
    setIsInRoom(false);
    onRoomJoin?.(false);

    toast({
      title: 'Left study room',
      description: 'Your session has been saved'
    });
  };

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    leaveRoom,
    setActiveStudying: async (active: boolean) => {
      if (!mySessionId) return;
      const update: Record<string, any> = { is_active: active };
      if (active) update.started_at = new Date().toISOString();
      await supabase
        .from('study_room_sessions')
        .update(update)
        .eq('id', mySessionId);
    }
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
            <div className="flex gap-2">
              {isInRoom && (
                <Button 
                  onClick={() => setShowChat(!showChat)} 
                  variant="outline"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chat */}
        {showChat && isInRoom && (
          <Card className="lg:col-span-1">
            <TwitchStyleChat 
              groupId={groupId} 
              isInRoom={isInRoom}
              onClose={() => setShowChat(false)}
            />
          </Card>
        )}

        {/* Leaderboard */}
        <Card className={showChat ? "lg:col-span-1" : "lg:col-span-2"}>
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
