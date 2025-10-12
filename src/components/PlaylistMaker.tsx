import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, X, Maximize2, Trash2, Plus, SkipForward, SkipBack, Repeat, Shuffle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showVideo, setShowVideo] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: window.innerWidth - 450, y: window.innerHeight - 250 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready');
    };
  }, []);

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
    if (playlist.some(item => item.videoId === videoId)) {
      toast({
        title: "Already in playlist",
        description: "This video is already in your playlist",
        variant: "destructive"
      });
      return;
    }

    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      videoId,
      title: `Video ${playlist.length + 1}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`
    };

    setPlaylist([...playlist, newItem]);
    setYoutubeUrl('');
    
    toast({
      title: "Added to playlist",
      description: "Video added successfully"
    });
  };

  const playVideo = (videoId: string, index?: number) => {
    setCurrentVideoId(videoId);
    if (index !== undefined) {
      setCurrentIndex(index);
    } else {
      const idx = playlist.findIndex(item => item.videoId === videoId);
      setCurrentIndex(idx);
    }
    setShowVideo(true);
    setIsAudioOnly(false);
    setIsPlaying(true);

    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.playVideo();
    } else {
      setTimeout(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          playerRef.current = new (window as any).YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0
            },
            events: {
              onReady: (event: any) => {
                event.target.playVideo();
              },
              onStateChange: (event: any) => {
                setIsPlaying(event.data === 1);
                // When video ends
                if (event.data === 0) {
                  handleVideoEnd();
                }
              }
            }
          });
        }
      }, 100);
    }

    onVideoPlay?.(videoId);
  };

  const handleVideoEnd = () => {
    if (isLooping) {
      // Replay current video
      playerRef.current?.playVideo();
    } else if (playlist.length > 0) {
      // Play next video
      playNextVideo();
    }
  };

  const playNextVideo = () => {
    if (playlist.length === 0) return;

    let nextIndex: number;
    if (isShuffling) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    playVideo(playlist[nextIndex].videoId, nextIndex);
  };

  const playPreviousVideo = () => {
    if (playlist.length === 0 || currentIndex <= 0) return;
    const prevIndex = currentIndex - 1;
    playVideo(playlist[prevIndex].videoId, prevIndex);
  };

  const closeVideoPopup = () => {
    setShowVideo(false);
    setIsAudioOnly(true);
    // Keep playing audio
  };

  const reopenVideo = () => {
    setShowVideo(true);
    setIsAudioOnly(false);
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
    setIsAudioOnly(false);
    setIsPlaying(false);
  };

  const removeFromPlaylist = (id: string) => {
    setPlaylist(playlist.filter(item => item.id !== id));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setDragPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div className="space-y-4">
      {/* Video Popup - Always mounted but conditionally visible */}
      {currentVideoId && (
        <div className={cn(
          "fixed bottom-6 right-[21rem] z-50 w-[28rem] bg-background border-2 border-primary rounded-lg shadow-2xl overflow-hidden transition-opacity duration-200",
          showVideo ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between bg-primary/10 px-3 py-2">
            <span className="text-sm font-medium">Now Playing</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeVideoPopup}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div id="youtube-player" className="w-full aspect-video"></div>
        </div>
      )}

      {/* Audio-Only Controller - Draggable */}
      {isAudioOnly && currentVideoId && (
        <div 
          className="fixed z-50 bg-background border-2 border-primary rounded-lg shadow-2xl"
          style={{
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
            width: '320px',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <div 
            className="bg-primary/10 px-3 py-2 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <p className="text-sm font-medium">Playing Audio</p>
            <p className="text-xs text-muted-foreground">Drag to move</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={playPreviousVideo}
                disabled={currentIndex <= 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={playNextVideo}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={reopenVideo}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={stopPlayback}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant={isLooping ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsLooping(!isLooping)}
              >
                <Repeat className="h-4 w-4" />
              </Button>
              <Button
                variant={isShuffling ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsShuffling(!isShuffling)}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
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
            {currentVideoId && !showVideo && !isAudioOnly && (
              <p className="text-sm text-muted-foreground">
                Click a video from your playlist to play
              </p>
            )}
          </CardContent>
        </Card>

        {/* Playlist Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Playlist ({playlist.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {playlist.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No videos in playlist. Add some to get started!
                </div>
              ) : (
                <div className="space-y-2">
                  {playlist.map((item, index) => (
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
