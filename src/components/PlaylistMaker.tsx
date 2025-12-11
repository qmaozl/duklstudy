import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, X, Maximize2, Trash2, Plus, SkipForward, SkipBack, Repeat, Shuffle, Minimize2, Share2, Copy, Globe, Lock, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMediaPlayerContext } from '@/contexts/MediaPlayerContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [localPlaylist, setLocalPlaylist] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState('My Playlist');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
        .select('videos, is_public, share_id, playlist_name')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const videos = data.videos as unknown as PlaylistItem[];
        setLocalPlaylist(videos || []);
        setIsPublic(data.is_public || false);
        setShareId(data.share_id || null);
        setPlaylistName(data.playlist_name || 'My Playlist');
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
          videos: localPlaylist as any,
          is_public: isPublic,
          playlist_name: playlistName
        }], {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving playlist:', error);
      }
    };

    savePlaylist();
  }, [localPlaylist, user, isLoading, isPublic, playlistName]);

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

    // Fetch video title from YouTube API
    let videoTitle = `Video ${localPlaylist.length + 1}`;
    let videoThumbnail = `https://img.youtube.com/vi/${videoId}/default.jpg`;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-video-details', {
        body: { videoId }
      });

      if (data?.success && data.video) {
        videoTitle = data.video.title;
        videoThumbnail = data.video.thumbnail;
      }
    } catch (error) {
      console.error('Error fetching video details:', error);
    }

    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      videoId,
      title: videoTitle,
      thumbnail: videoThumbnail
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
    
    setShowVideo(false);
    setIsMinimized(true);
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

  const togglePublic = async () => {
    const newPublicState = !isPublic;
    setIsPublic(newPublicState);
    
    if (newPublicState) {
      toast({
        title: "Playlist is now public",
        description: "Anyone with the link can view your playlist"
      });
    } else {
      toast({
        title: "Playlist is now private",
        description: "Only you can view your playlist"
      });
    }
  };

  const copyShareLink = () => {
    if (!shareId) return;
    const shareUrl = `${window.location.origin}/shared-playlist/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share this link with others to show your playlist"
    });
  };

  // Filter playlist by search query
  const filteredPlaylist = localPlaylist.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
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

      {/* Compact Add Video Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Playlist name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-40 font-medium"
            />
            <div className="flex-1 flex gap-2 min-w-[280px]">
              <Input
                placeholder="Paste YouTube URL..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addToPlaylist()}
                className="flex-1"
              />
              <Button onClick={addToPlaylist} disabled={!youtubeUrl.trim()} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePublic}
                className="gap-1"
              >
                {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {isPublic ? 'Public' : 'Private'}
              </Button>
              {isPublic && shareId && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={copyShareLink}
                  className="gap-1"
                >
                  <Share2 className="h-3 w-3" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Playlist Section - Takes remaining space */}
      <Card className="flex-1">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">Your Playlist ({localPlaylist.length})</CardTitle>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div>
            {filteredPlaylist.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                {localPlaylist.length === 0 
                  ? "No videos in playlist. Add some to get started!"
                  : "No videos match your search."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlaylist.map((item) => {
                  const originalIndex = localPlaylist.findIndex(p => p.id === item.id);
                  return (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-lg border bg-card hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer overflow-hidden group"
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest('button')) {
                        playVideo(item.videoId, originalIndex);
                      }
                    }}
                  >
                    {/* Thumbnail with delete button overlay */}
                    <div className="relative aspect-video">
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromPlaylist(item.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {currentVideoId === item.videoId && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Play className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    {/* Text below thumbnail */}
                    <div className="p-2 text-center">
                      <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Track #{originalIndex + 1}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaylistMaker;