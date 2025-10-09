import React, { useRef, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Play, Pause, Square, RotateCcw, Clock, Zap, X } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { useStudyGroupTimer } from '@/hooks/useStudyGroupTimer';
import { cn } from '@/lib/utils';
import StudyGroupManager from '@/components/StudyGroupManager';
import { toast } from '@/hooks/use-toast';

const FocusTimer = () => {
  const { user, loading } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const timer = useStudyGroupTimer(selectedGroupId);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const playerRef = useRef<any>(null);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const endSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startSoundRef.current = new Audio('/audio/timer-start.mp3');
    endSoundRef.current = new Audio('/audio/timer-end.mp3');

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready');
    };
  }, []);

  useEffect(() => {
    if (timer.state === 'stopped' && timer.seconds === 0) {
      endSoundRef.current?.play().catch(e => console.error('Audio play failed:', e));
    }
  }, [timer.state, timer.seconds]);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleLoadVideo = () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    setCurrentVideoId(videoId);
    setShowPlayer(true);
    
    // Initialize or update player
    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
    } else {
      setTimeout(() => {
        playerRef.current = new (window as any).YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0
          }
        });
      }, 100);
    }
  };

  const handleClosePlayer = () => {
    if (playerRef.current && playerRef.current.pauseVideo) {
      playerRef.current.pauseVideo();
    }
    setShowPlayer(false);
  };

  const handleLockIn = () => {
    timer.start();
    startSoundRef.current?.play().catch(e => console.error('Audio play failed:', e));
  };

  const getTimerColor = () => {
    switch (timer.state) {
      case 'running': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTimerBorderColor = () => {
    switch (timer.state) {
      case 'running': return 'border-green-500/20 shadow-green-500/10';
      case 'paused': return 'border-yellow-500/20 shadow-yellow-500/10';
      default: return 'border-border';
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
        {/* Floating YouTube Player */}
        {showPlayer && currentVideoId && (
          <div className="fixed bottom-6 right-6 z-50 w-80 bg-background border-2 border-primary rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-primary/10 px-3 py-2">
              <span className="text-sm font-medium">Now Playing</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePlayer}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div id="youtube-player" className="w-full aspect-video"></div>
          </div>
        )}

        {/* YouTube Media Player */}
        <Card>
          <CardHeader>
            <CardTitle>Study Media Player</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Paste YouTube URL here..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleLoadVideo} disabled={!youtubeUrl.trim()}>
                Load Video
              </Button>
            </div>
            {showPlayer && (
              <p className="text-sm text-muted-foreground">
                Video is playing in the floating player at the bottom right
              </p>
            )}
          </CardContent>
        </Card>

        {/* Study Groups */}
        <StudyGroupManager />

        {/* Timer */}
        <Card className={cn("transition-all duration-300 shadow-soft", getTimerBorderColor())}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Focus Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className={cn("text-6xl font-geo font-bold transition-colors duration-300", getTimerColor())}>
                {timer.formattedTime}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {timer.state === 'running' && 'Keep going! You\'re in the zone 🔥'}
                {timer.state === 'paused' && 'Take a break, then get back to it! ⏸️'}
                {timer.state === 'stopped' && 'Ready to lock in? 🚀'}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {timer.state === 'stopped' && (
                <Button 
                  onClick={handleLockIn} 
                  size="lg" 
                  className="gradient-primary px-8 py-3 text-lg font-semibold"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Lock In!
                </Button>
              )}

              {timer.state === 'running' && (
                <>
                  <Button onClick={timer.pause} variant="outline" size="lg">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={timer.stop} variant="destructive" size="lg">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {timer.state === 'paused' && (
                <>
                  <Button onClick={timer.start} size="lg" className="gradient-primary">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={timer.stop} variant="destructive" size="lg">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {(timer.state === 'paused' || timer.state === 'stopped') && timer.seconds > 0 && (
                <Button onClick={timer.reset} variant="ghost" size="lg">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>

            {timer.seconds > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Current session: {Math.floor(timer.seconds / 60)} minutes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FocusTimer;
