import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, X, Maximize2, Trash2, Plus, SkipForward, SkipBack, Repeat, Shuffle, Minimize2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMediaPlayerContext } from '@/contexts/MediaPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
}

interface PlaylistMakerProps {
  onVideoPlay?: (videoId: string) => void;
}

const PlaylistMaker: React.FC<PlaylistMakerProps> = ({ onVideoPlay }) => {
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [localPlaylist, setLocalPlaylist] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    playerRef,
    currentVideo: currentVideoId,
    setCurrentVideo: setCurrentVideoId,
    isPlaying,
    setIsPlaying,
    isLooping,
    setIsLooping,
    isShuffling,
    setIsShuffling,
    currentIndex,
    setCurrentIndex,
    playlist,
    setPlaylist,
    isMinimized,
    setIsMinimized,
    currentVideoTitle,
    setCurrentVideoTitle,
    currentVideoThumbnail,
    setCurrentVideoThumbnail
  } = useMediaPlayerContext();

  // Load playlist from database on mount
  useEffect(() => {
    if (!user) return;
    
    const loadPlaylist = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_playlists')
        .select('videos')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const videos = data.videos as unknown as PlaylistItem[];
        setLocalPlaylist(videos || []);
      }
      setIsLoading(false);
    };

    loadPlaylist();
  }, [user]);

  // Save playlist to database whenever it changes
  useEffect(() => {
    if (!user || isLoading) return;

    const savePlaylist = async () => {
      const { error } = await supabase
        .from('user_playlists')
        .upsert([{
          user_id: user.id,
          videos: localPlaylist as any
        }], {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving playlist:', error);
      }
    };

    savePlaylist();
  }, [localPlaylist, user, isLoading]);

  useEffect(() => {
    // Sync local playlist with global context
    setPlaylist(localPlaylist);
  }, [localPlaylist, setPlaylist]);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const addToPlaylist = async () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    // Check if already in playlist
    if (localPlaylist.some(item => item.videoId === videoId)) {
      toast({
        title: "Already in playlist",
        description: "This video is already in your playlist",
        variant: "destructive"
      });
      return;
    }

    // Fetch video title from YouTube
    let videoTitle = `Video ${localPlaylist.length + 1}`;
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      if (data.title) {
        videoTitle = data.title;
      }
    } catch (error) {
      console.error('Error fetching video title:', error);
    }

    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      videoId,
      title: videoTitle,
      thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`
    };

    setLocalPlaylist([...localPlaylist, newItem]);
    setYoutubeUrl('');
    
    toast({
      title: "Added to playlist",
      description: "Video added successfully"
    });
  };

  const playVideo = (videoId: string, index?: number) => {
    const finalizePlay = () => {
      try {
        playerRef.current?.unMute?.();
        playerRef.current?.setVolume?.(100);
        playerRef.current?.loadVideoById?.(videoId);
        playerRef.current?.playVideo?.();
      } catch (e) {
        console.warn('Player not ready yet, will retry', e);
      }
    };

    setCurrentVideoId(videoId);
    
    const idx = index !== undefined ? index : localPlaylist.findIndex(item => item.videoId === videoId);
    setCurrentIndex(idx);
    
    // Set video title and thumbnail
    if (idx >= 0 && idx < localPlaylist.length) {
      setCurrentVideoTitle(localPlaylist[idx].title);
      setCurrentVideoThumbnail(localPlaylist[idx].thumbnail);
    }
    
    setShowVideo(true);
    setIsMinimized(false);
    setIsPlaying(true);

    if (playerRef.current?.loadVideoById) {
      finalizePlay();
    } else {
      // Retry shortly until the player is ready
      let attempts = 0;
      const t = setInterval(() => {
        attempts++;
        if (playerRef.current?.loadVideoById || attempts > 15) {
          clearInterval(t);
          finalizePlay();
        }
      }, 150);
    }

    onVideoPlay?.(videoId);
  };

  const playNextVideo = () => {
    if (localPlaylist.length === 0) return;

    let nextIndex: number;
    if (isShuffling) {
      nextIndex = Math.floor(Math.random() * localPlaylist.length);
    } else {
      nextIndex = (currentIndex + 1) % localPlaylist.length;
    }

    playVideo(localPlaylist[nextIndex].videoId, nextIndex);
  };

  const playPreviousVideo = () => {
    if (localPlaylist.length === 0 || currentIndex <= 0) return;
    const prevIndex = currentIndex - 1;
    playVideo(localPlaylist[prevIndex].videoId, prevIndex);
  };

  const closeVideoPopup = () => {
    setShowVideo(false);
    setIsMinimized(true);
  };

  const reopenVideo = () => {
    setShowVideo(true);
    setIsMinimized(false);
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const stopPlayback = () => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
    }
    setCurrentVideoId(null);
    setShowVideo(false);
    setIsMinimized(false);
    setIsPlaying(false);
  };

  const removeFromPlaylist = (id: string) => {
    setLocalPlaylist(localPlaylist.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Video Display Overlay - Only shows when not minimized */}
      {currentVideoId && showVideo && (
        <div className="fixed bottom-6 right-[21rem] z-50 w-[28rem] bg-background border-2 border-primary rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-primary/10 px-3 py-2">
            <span className="text-sm font-medium">Now Playing</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeVideoPopup}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={stopPlayback}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <img 
              src={currentVideoThumbnail} 
              alt={currentVideoTitle}
              className="w-full rounded"
            />
            <p className="text-sm font-medium text-center truncate">{currentVideoTitle}</p>
          </div>
        </div>
      )}

      {/* Main Playlist Maker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Add Video Section */}
        <Card>
          <CardHeader>
            <CardTitle>Playlist Maker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Paste YouTube Music URL..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addToPlaylist()}
                className="flex-1"
              />
              <Button onClick={addToPlaylist} disabled={!youtubeUrl.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {currentVideoId && !showVideo && (
              <p className="text-sm text-muted-foreground">
                Click a video from your playlist to play
              </p>
            )}
          </CardContent>
        </Card>

        {/* Playlist Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Playlist ({localPlaylist.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {localPlaylist.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No videos in playlist. Add some to get started!
                </div>
              ) : (
                <div className="space-y-2">
                  {localPlaylist.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Track #{index + 1}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playVideo(item.videoId, index)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromPlaylist(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default PlaylistMaker;
