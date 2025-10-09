import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Trophy, Copy, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  owner_id: string;
  member_count?: number;
}

interface GroupMember {
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  total_minutes: number;
}

const StudyGroupManager = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [leaderboard, setLeaderboard] = useState<GroupMember[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchLeaderboard(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    if (!user) return;

    const { data: memberGroups, error } = await supabase
      .from('study_group_members')
      .select(`
        group_id,
        study_groups(
          id,
          name,
          description,
          invite_code,
          owner_id
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching groups:', error);
      return;
    }

    const groupsData = memberGroups?.map(mg => mg.study_groups).filter(Boolean) as StudyGroup[];
    setGroups(groupsData || []);
    
    if (groupsData?.length > 0 && !selectedGroup) {
      setSelectedGroup(groupsData[0]);
    }
  };

  const fetchLeaderboard = async (groupId: string) => {
    // Get sessions and join with profiles
    const { data, error } = await supabase
      .from('study_group_sessions')
      .select('user_id, duration_minutes')
      .eq('group_id', groupId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return;
    }

    if (!data || data.length === 0) {
      setLeaderboard([]);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(data.map(session => session.user_id))];
    
    // Fetch profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    // Aggregate minutes by user
    const userMinutes: { [key: string]: GroupMember } = {};
    
    data.forEach(session => {
      if (!userMinutes[session.user_id]) {
        const userProfile = profiles?.find(p => p.user_id === session.user_id);
        userMinutes[session.user_id] = {
          user_id: session.user_id,
          profiles: {
            full_name: userProfile?.full_name || 'Unknown User',
            email: userProfile?.email || ''
          },
          total_minutes: 0
        };
      }
      userMinutes[session.user_id].total_minutes += session.duration_minutes;
    });

    const leaderboardData = Object.values(userMinutes)
      .sort((a, b) => b.total_minutes - a.total_minutes);

    setLeaderboard(leaderboardData);
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    setLoading(true);
    
    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          owner_id: user.id
        })
        .select()
        .single();

      if (groupError) {
        console.error('Group creation error:', groupError);
        throw groupError;
      }

      // The database trigger automatically adds the owner as a member

      toast({
        title: "Study group created!",
        description: `"${newGroupName}" is ready for studying together.`
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreateDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error creating group",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!user || !joinCode.trim()) return;

    setLoading(true);

    try {
      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('id, name')
        .eq('invite_code', joinCode.trim())
        .single();

      if (groupError || !group) {
        throw new Error('Invalid invite code');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('study_group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: `You're already in "${group.name}".`
        });
        setIsJoinDialogOpen(false);
        return;
      }

      // Join group
      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      toast({
        title: "Joined study group!",
        description: `Welcome to "${group.name}".`
      });

      setJoinCode('');
      setIsJoinDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error joining group",
        description: "Please check the invite code and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Invite code copied!",
      description: "Share this code with friends to invite them to your study group."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Study Groups
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Group Selection & Actions */}
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <Button
              key={group.id}
              variant={selectedGroup?.id === group.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGroup(group)}
            >
              {group.name}
            </Button>
          ))}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
                <Button 
                  onClick={createGroup} 
                  disabled={loading || !newGroupName.trim()}
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-1" />
                Join
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Study Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter invite code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button 
                  onClick={joinGroup} 
                  disabled={loading || !joinCode.trim()}
                  className="w-full"
                >
                  {loading ? "Joining..." : "Join Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selected Group Info */}
        {selectedGroup && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{selectedGroup.name}</h4>
                {selectedGroup.description && (
                  <p className="text-sm text-muted-foreground">{selectedGroup.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyInviteCode(selectedGroup.invite_code)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Invite
              </Button>
            </div>

            {/* Leaderboard */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-sm">30-Day Leaderboard</span>
              </div>
              
              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((member, index) => (
                    <div key={member.user_id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <span className="text-sm font-medium">
                          {member.profiles.full_name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {member.total_minutes}m
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No study sessions yet. Start studying to appear on the leaderboard!</p>
              )}
            </div>
          </div>
        )}

        {groups.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No study groups yet.</p>
            <p className="text-xs">Create or join a group to start studying together!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyGroupManager;