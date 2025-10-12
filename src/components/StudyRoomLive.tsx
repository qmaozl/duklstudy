import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Trophy, Send, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StudyRoomLiveProps {
  groupId: string;
  groupName: string;
}

interface ActiveUser {
  id: string;
  pseudonym: string;
  started_at: string;
  user_id: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface LeaderboardEntry {
  pseudonym: string;
  total_minutes: number;
  rank: number;
}

const PSEUDONYM_ADJECTIVES = ['Focused', 'Determined', 'Brilliant', 'Diligent', 'Studious', 'Sharp', 'Quick', 'Smart'];
const PSEUDONYM_NOUNS = ['Scholar', 'Learner', 'Student', 'Thinker', 'Mind', 'Brain', 'Genius', 'Ace'];

const generatePseudonym = () => {
  const adj = PSEUDONYM_ADJECTIVES[Math.floor(Math.random() * PSEUDONYM_ADJECTIVES.length)];
  const noun = PSEUDONYM_NOUNS[Math.floor(Math.random() * PSEUDONYM_NOUNS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj} ${noun} ${num}`;
};

const StudyRoomLive: React.FC<StudyRoomLiveProps> = ({ groupId, groupName }) => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [mySessionId, setMySessionId] = useState<string | null>(null);
  const [myPseudonym, setMyPseudonym] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !groupId) return;

    // Fetch initial data
    fetchActiveUsers();
    fetchChatMessages();
    fetchLeaderboard();

    // Subscribe to real-time updates
    const activeUsersChannel = supabase
      .channel(`study-room-${groupId}`)
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

    const chatChannel = supabase
      .channel(`chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_group_chat',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          fetchChatMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activeUsersChannel);
      supabase.removeChannel(chatChannel);
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [user, groupId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchActiveUsers = async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('study_room_sessions')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .gte('last_heartbeat', fiveMinutesAgo)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching active users:', error);
      return;
    }

    setActiveUsers(data || []);
  };

  const fetchChatMessages = async () => {
    const { data, error } = await supabase
      .from('study_group_chat')
      .select('id, user_id, message, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching chat messages:', error);
      return;
    }

    if (!data) {
      setChatMessages([]);
      return;
    }

    // Fetch profiles separately
    const userIds = [...new Set(data.map(msg => msg.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const messagesWithProfiles = data.map(msg => ({
      ...msg,
      profiles: profiles?.find(p => p.user_id === msg.user_id) || { full_name: 'Anonymous' }
    }));

    setChatMessages(messagesWithProfiles);
  };

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

    // Aggregate by user and create pseudonyms
    const userTotals: { [key: string]: number } = {};
    data?.forEach(session => {
      userTotals[session.user_id] = (userTotals[session.user_id] || 0) + session.duration_minutes;
    });

    const leaderboardData = Object.entries(userTotals)
      .map(([userId, minutes], index) => ({
        pseudonym: generatePseudonym(),
        total_minutes: minutes,
        rank: index + 1
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    setLeaderboard(leaderboardData);
  };

  const joinRoom = async () => {
    if (!user) return;

    const pseudonym = generatePseudonym();
    setMyPseudonym(pseudonym);

    const { data, error } = await supabase
      .from('study_room_sessions')
      .insert({
        group_id: groupId,
        user_id: user.id,
        pseudonym: pseudonym,
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

    // Start heartbeat
    heartbeatInterval.current = setInterval(async () => {
      await supabase
        .from('study_room_sessions')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('id', data.id);
    }, 30000); // Every 30 seconds

    toast({
      title: 'Joined study room!',
      description: `You're now studying as "${pseudonym}"`
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
    setMyPseudonym('');

    toast({
      title: 'Left study room',
      description: 'Your session has been saved'
    });
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    const { error } = await supabase
      .from('study_group_chat')
      .insert({
        group_id: groupId,
        user_id: user.id,
        message: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
  };

  const getStudyTime = (startedAt: string) => {
    const started = new Date(startedAt);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - started.getTime()) / 60000);
    
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{activeUsers.length} studying now</span>
            {isInRoom && (
              <Badge variant="default" className="ml-2">
                You: {myPseudonym}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Users */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Active Studiers</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {activeUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No one studying yet. Be the first!
                  </p>
                ) : (
                  activeUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <span className="text-sm font-medium">{user.pseudonym}</span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {getStudyTime(user.started_at)}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Group Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-medium text-primary">
                      {msg.profiles?.full_name || 'Anonymous'}:
                    </span>{' '}
                    <span>{msg.message}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!isInRoom}
              />
              <Button onClick={sendMessage} size="icon" disabled={!isInRoom || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="lg:col-span-1">
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
                        <span className="text-sm font-medium">{entry.pseudonym}</span>
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
};

export default StudyRoomLive;
