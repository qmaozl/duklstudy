import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Copy, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
}

interface PlaylistData {
  playlist_name: string;
  videos: PlaylistItem[];
  user_id: string;
}

const SharedPlaylist = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const loadSharedPlaylist = async () => {
      if (!shareId) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('user_playlists')
        .select('playlist_name, videos, user_id')
        .eq('share_id', shareId)
        .eq('is_public', true)
        .single();

      if (error || !data) {
        toast({
          title: "Playlist not found",
          description: "This playlist doesn't exist or is no longer public",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setPlaylist(data as unknown as PlaylistData);
      setLoading(false);
    };

    loadSharedPlaylist();
  }, [shareId, navigate]);

  const copyToMyPlaylist = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to copy this playlist",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!playlist) return;

    setCopying(true);
    try {
      // Get current user's playlist
      const { data: currentData } = await supabase
        .from('user_playlists')
        .select('videos')
        .eq('user_id', user.id)
        .single();

      const currentVideos = (currentData?.videos as unknown as PlaylistItem[]) || [];
      const newVideos = playlist.videos.filter(
        video => !currentVideos.some(cv => cv.videoId === video.videoId)
      );

      // Merge playlists
      const mergedVideos = [...currentVideos, ...newVideos];

      const { error } = await supabase
        .from('user_playlists')
        .upsert([{
          user_id: user.id,
          videos: mergedVideos as any
        }], {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Playlist copied!",
        description: `Added ${newVideos.length} new videos to your playlist`
      });

      navigate('/playlist-maker');
    } catch (error) {
      console.error('Error copying playlist:', error);
      toast({
        title: "Failed to copy",
        description: "Could not copy the playlist. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCopying(false);
    }
  };

  const playVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={copyToMyPlaylist}
            disabled={copying}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {copying ? 'Copying...' : 'Copy to My Playlist'}
          </Button>
        </div>

        {/* Playlist Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{playlist.playlist_name}</CardTitle>
            <p className="text-muted-foreground">
              {playlist.videos.length} videos • Shared playlist
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {playlist.videos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  This playlist is empty
                </div>
              ) : (
                <div className="space-y-3">
                  {playlist.videos.map((video, index) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{video.title}</p>
                        <p className="text-sm text-muted-foreground">Track #{index + 1}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playVideo(video.videoId)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedPlaylist;