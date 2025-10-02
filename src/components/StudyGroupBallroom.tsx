import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StudyGroupBallroomProps {
  groupId: string;
}

interface MusicEntry {
  id: string;
  youtube_url: string;
  is_playing: boolean;
  added_by: string;
}

const StudyGroupBallroom = ({ groupId }: StudyGroupBallroomProps) => {
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [currentMusic, setCurrentMusic] = useState<MusicEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentMusic();
    
    // Subscribe to music changes
    const channel = supabase
      .channel(`music-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_group_music',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchCurrentMusic();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const fetchCurrentMusic = async () => {
    const { data } = await supabase
      .from('study_group_music')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_playing', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setCurrentMusic(data);
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const addMusic = async () => {
    if (!youtubeUrl.trim()) return;

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube URL.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    // Stop current music
    if (currentMusic) {
      await supabase
        .from('study_group_music')
        .update({ is_playing: false })
        .eq('id', currentMusic.id);
    }

    // Add new music
    const { error } = await supabase
      .from('study_group_music')
      .insert({
        group_id: groupId,
        youtube_url: youtubeUrl,
        added_by: user?.id,
        is_playing: true,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add music.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Music added!',
        description: 'Now playing in the ballroom.',
      });
      setYoutubeUrl('');
    }

    setLoading(false);
  };

  const videoId = currentMusic ? extractVideoId(currentMusic.youtube_url) : null;

  return (
    <div className="space-y-4">
      {/* DJ Table */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Music className="h-5 w-5" />
          DJ Table
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Paste YouTube URL here..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addMusic} disabled={loading || !youtubeUrl}>
            <Play className="h-4 w-4 mr-2" />
            Play
          </Button>
        </div>
      </Card>

      {/* Large Screen Display */}
      {videoId && (
        <Card className="p-4 bg-card">
          <div className="aspect-video rounded-lg overflow-hidden mb-4">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </Card>
      )}

      {/* Music Playback Bar (Spotify-style) */}
      {currentMusic && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t flex items-center px-4 gap-4 z-40">
          <div className="w-16 h-16 bg-primary/20 rounded flex items-center justify-center">
            <Music className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Now Playing</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentMusic.youtube_url}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-1 bg-muted rounded-full">
              <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroupBallroom;
