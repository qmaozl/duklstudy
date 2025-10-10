import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Trophy, MessageCircle, Clock, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  owner_id: string;
}

interface GroupMember {
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  total_minutes: number;
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const StudyGroup = () => {
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [leaderboard, setLeaderboard] = useState<GroupMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchLeaderboard();
      fetchChatMessages();
      subscribeToChat();
      subscribeToPresence();
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    const { data: memberData } = await supabase
      .from('study_group_members')
      .select('group_id')
      .eq('user_id', user?.id);

    if (memberData) {
      const groupIds = memberData.map(m => m.group_id);
      const { data: groupsData } = await supabase
        .from('study_groups')
        .select('*')
        .in('id', groupIds);

      if (groupsData) {
        setGroups(groupsData);
        if (groupsData.length > 0 && !selectedGroup) {
          setSelectedGroup(groupsData[0]);
        }
      }
    }
  };

  const fetchLeaderboard = async () => {
    if (!selectedGroup) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from('study_group_sessions')
      .select(`
        user_id,
        duration_minutes,
        profiles!study_group_sessions_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq('group_id', selectedGroup.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (data) {
      const aggregated = data.reduce((acc: any, session: any) => {
        const userId = session.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            profiles: session.profiles,
            total_minutes: 0
          };
        }
        acc[userId].total_minutes += session.duration_minutes;
        return acc;
      }, {});

      const leaderboardData = Object.values(aggregated)
        .sort((a: any, b: any) => b.total_minutes - a.total_minutes);

      setLeaderboard(leaderboardData as GroupMember[]);
    }
  };

  const fetchChatMessages = async () => {
    if (!selectedGroup) return;

    const { data } = await supabase
      .from('study_group_chat')
      .select(`
        id,
        user_id,
        message,
        created_at,
        profiles!study_group_chat_user_id_fkey (
          full_name
        )
      `)
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setChatMessages(data as any);
    }
  };

  const subscribeToChat = () => {
    if (!selectedGroup) return;

    const channel = supabase
      .channel(`group-chat-${selectedGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_group_chat',
          filter: `group_id=eq.${selectedGroup.id}`
        },
        (payload) => {
          fetchChatMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToPresence = () => {
    if (!selectedGroup) return;

    const channel = supabase.channel(`group-presence-${selectedGroup.id}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => [...prev, key]);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => prev.filter(id => id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user?.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;

    const { error } = await supabase
      .from('study_group_chat')
      .insert({
        group_id: selectedGroup.id,
        user_id: user?.id,
        message: newMessage.trim()
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } else {
      setNewMessage('');
    }
  };

  const createGroup = async () => {
    const { data, error } = await supabase
      .from('study_groups')
      .insert({
        name: newGroupName,
        description: newGroupDescription,
        owner_id: user?.id
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Study group created!'
      });
      setShowCreateDialog(false);
      setNewGroupName('');
      setNewGroupDescription('');
      fetchGroups();
    }
  };

  const joinGroup = async () => {
    const { data: groupData } = await supabase
      .from('study_groups')
      .select('*')
      .eq('invite_code', joinCode.trim())
      .single();

    if (!groupData) {
      toast({
        title: 'Error',
        description: 'Invalid invite code',
        variant: 'destructive'
      });
      return;
    }

    const { error } = await supabase
      .from('study_group_members')
      .insert({
        group_id: groupData.id,
        user_id: user?.id
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to join group',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: `Joined ${groupData.name}!`
      });
      setShowJoinDialog(false);
      setJoinCode('');
      fetchGroups();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Study Groups</h1>
          <div className="flex gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Study Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Group Name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                  <Button onClick={createGroup} className="w-full">
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">Join Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Study Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter Invite Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                  <Button onClick={joinGroup} className="w-full">
                    Join
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Group Selector */}
        {groups.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {groups.map(group => (
              <Button
                key={group.id}
                variant={selectedGroup?.id === group.id ? 'default' : 'outline'}
                onClick={() => setSelectedGroup(group)}
              >
                {group.name}
              </Button>
            ))}
          </div>
        )}

        {selectedGroup && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  30-Day Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((member, index) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}`}>
                          {index < 3 ? '' : `${index + 1}.`}
                        </div>
                        <div>
                          <div className="font-medium">{member.profiles.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {onlineUsers.includes(member.user_id) && (
                              <span className="text-green-500">● Online</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{member.total_minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Group Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Group Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto space-y-2 p-4 bg-muted/50 rounded-lg">
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded ${
                          msg.user_id === user?.id ? 'bg-primary text-primary-foreground ml-auto' : 'bg-background'
                        } max-w-[80%] ${msg.user_id === user?.id ? 'text-right' : ''}`}
                      >
                        <div className="text-xs opacity-70">{msg.profiles.full_name}</div>
                        <div>{msg.message}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage}>Send</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {groups.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                You're not in any study groups yet. Create or join one to get started!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudyGroup;
