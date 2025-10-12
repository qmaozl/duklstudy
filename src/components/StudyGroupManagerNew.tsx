import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Copy, UserPlus, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import StudyRoomLive from './StudyRoomLive';
import { z } from 'zod';

interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  owner_id: string;
}

interface StudyGroupManagerNewProps {
  onGroupSelect?: (groupId: string | undefined) => void;
  onRoomJoin?: (isJoined: boolean) => void;
}

const StudyGroupManagerNew = forwardRef<{ leaveRoom: () => void }, StudyGroupManagerNewProps>(
  ({ onGroupSelect, onRoomJoin }, ref) => {
  const { user } = useAuth();
  const studyRoomRef = useRef<{ leaveRoom: () => void }>(null);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Expose leaveRoom via ref
  useImperativeHandle(ref, () => ({
    leaveRoom: () => {
      studyRoomRef.current?.leaveRoom();
    }
  }));

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  useEffect(() => {
    onGroupSelect?.(selectedGroup?.id);
  }, [selectedGroup, onGroupSelect]);

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

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    setLoading(true);
    
    try {
      // Validate inputs
      const schema = z.object({
        name: z.string().trim().min(1).max(100),
        description: z.string().trim().max(200).nullable().optional(),
      });
      const payload = schema.parse({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() ? newGroupDescription.trim() : null,
      });

      const { data, error } = await supabase.functions.invoke('create-study-group', {
        body: payload,
      });

      if (error || !data?.success) {
        console.error('Group creation error:', error || data);
        throw new Error(data?.details || 'Failed to create');
      }

      const group = data.group;

      toast({
        title: "Study room created!",
        description: `"${newGroupName}" is ready for group study sessions.`
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setIsCreateDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error creating room",
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
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('id, name')
        .eq('invite_code', joinCode.trim())
        .single();

      if (groupError || !group) {
        throw new Error('Invalid invite code');
      }

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

      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      toast({
        title: "Joined study room!",
        description: `Welcome to "${group.name}".`
      });

      setJoinCode('');
      setIsJoinDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error joining room",
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
      title: "Room code copied!",
      description: "Share this code with friends to invite them to your study room."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Room Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Private Study Rooms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Join study rooms to see who's studying, chat with friends, and compete on the leaderboard!
          </p>
          
          {/* Room Selection Buttons */}
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
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Private Study Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Room name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                  <Button 
                    onClick={createGroup} 
                    disabled={loading || !newGroupName.trim()}
                    className="w-full"
                  >
                    {loading ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Join Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Study Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter room code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                  <Button 
                    onClick={joinGroup} 
                    disabled={loading || !joinCode.trim()}
                    className="w-full"
                  >
                    {loading ? "Joining..." : "Join Room"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Selected Room Invite Code */}
          {selectedGroup && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <div className="flex-1">
                <p className="text-sm font-medium">Room Code</p>
                <p className="text-xs text-muted-foreground font-mono">{selectedGroup.invite_code}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyInviteCode(selectedGroup.invite_code)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Study Room */}
      {selectedGroup ? (
        <StudyRoomLive 
          ref={studyRoomRef}
          groupId={selectedGroup.id} 
          groupName={selectedGroup.name}
          onRoomJoin={onRoomJoin}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Create or join a study room to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

StudyGroupManagerNew.displayName = 'StudyGroupManagerNew';

export default StudyGroupManagerNew;
