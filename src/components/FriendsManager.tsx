import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Copy, Users, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  friend_id: string;
  profiles: {
    full_name: string;
    email: string;
    level: number;
    points: number;
  };
}

const FriendsManager = () => {
  const { user } = useAuth();
  const [friendCode, setFriendCode] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFriendCode();
      fetchFriends();
    }
  }, [user]);

  const fetchFriendCode = async () => {
    const { data, error } = await supabase
      .from('user_friend_codes')
      .select('friend_code')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setFriendCode(data.friend_code);
    }
  };

  const fetchFriends = async () => {
    // Get all friendships
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, friend_id')
      .eq('user_id', user?.id);

    if (!friendships) return;

    // Get friend profiles
    const friendIds = friendships.map(f => f.friend_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, level, points')
      .in('user_id', friendIds);

    if (profiles) {
      const enrichedFriends = friendships.map(friendship => {
        const profile = profiles.find(p => p.user_id === friendship.friend_id);
        return {
          id: friendship.id,
          friend_id: friendship.friend_id,
          profiles: profile || {
            full_name: 'Unknown',
            email: '',
            level: 1,
            points: 0,
          },
        };
      });
      setFriends(enrichedFriends);
    }
  };

  const copyFriendCode = () => {
    navigator.clipboard.writeText(friendCode);
    toast({
      title: 'Friend code copied!',
      description: 'Share this code with friends to add them.',
    });
  };

  const addFriend = async () => {
    if (!inputCode.trim()) return;
    
    setLoading(true);
    try {
      // Find user by friend code
      const { data: friendData, error: codeError } = await supabase
        .from('user_friend_codes')
        .select('user_id')
        .eq('friend_code', inputCode.trim())
        .single();

      if (codeError || !friendData) {
        toast({
          title: 'Invalid code',
          description: 'Friend code not found.',
          variant: 'destructive',
        });
        return;
      }

      if (friendData.user_id === user?.id) {
        toast({
          title: 'Cannot add yourself',
          description: 'You cannot add yourself as a friend.',
          variant: 'destructive',
        });
        return;
      }

      // Check if already friends
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', user?.id)
        .eq('friend_id', friendData.user_id)
        .single();

      if (existing) {
        toast({
          title: 'Already friends',
          description: 'This user is already your friend.',
        });
        return;
      }

      // Add friendship (both directions)
      await supabase.from('friendships').insert([
        { user_id: user?.id, friend_id: friendData.user_id },
        { user_id: friendData.user_id, friend_id: user?.id },
      ]);

      toast({
        title: 'Friend added!',
        description: 'Successfully added friend.',
      });
      
      setInputCode('');
      fetchFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: 'Error',
        description: 'Failed to add friend.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendshipId: string, friendId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await supabase
      .from('friendships')
      .delete()
      .eq('user_id', friendId)
      .eq('friend_id', user?.id);
    
    toast({
      title: 'Friend removed',
      description: 'Friendship ended.',
    });
    fetchFriends();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Friend Code Display */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Your Friend Code</p>
          <div className="flex gap-2">
            <Input value={friendCode} readOnly className="font-mono" />
            <Button onClick={copyFriendCode} variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add Friend */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Add Friend</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter friend code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="font-mono"
            />
            <Button onClick={addFriend} disabled={loading} size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Friends List */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Friends ({friends.length})</p>
          {friends.length > 0 ? (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{friend.profiles.full_name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>Level {friend.profiles.level}</span>
                      <span>•</span>
                      <span>{friend.profiles.points} pts</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFriend(friend.id, friend.friend_id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No friends yet. Add some using friend codes!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsManager;
