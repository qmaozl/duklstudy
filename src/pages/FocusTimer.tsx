import React, { useRef, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, RotateCcw, Clock, Zap, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/hooks/useTimer';
import StudyModeSelector, { StudyMode } from '@/components/StudyModeSelector';
import FullscreenStudyMode from '@/components/FullscreenStudyMode';
import { useMediaPlayerContext } from '@/contexts/MediaPlayerContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ambientSounds: Record<StudyMode, { videoId: string; name: string }> = {
  ocean: { videoId: 'bn9F19Hi1Lk', name: 'Ocean Waves' },
  rain: { videoId: 'q76bMs-NwRk', name: 'Rain' },
  whitenoise: { videoId: 'nMfPqeZjc2c', name: 'White Noise' }
};

const FocusTimer = () => {
  const { user, loading } = useAuth();
  const { seconds, state, start, pause, stop, reset, formattedTime } = useTimer('Focus Session');
  const [selectedMode, setSelectedMode] = useState<StudyMode>('ocean');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMinimized, setShowMinimized] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const endSoundRef = useRef<HTMLAudioElement | null>(null);
  const { setCurrentVideo, setIsPlaying, setIsLooping, currentVideo } = useMediaPlayerContext();

  // Set page title
  useEffect(() => {
    document.title = 'Focus Timer - Dukl';
    return () => {
      document.title = 'Dukl';
    };
  }, []);

  useEffect(() => {
    startSoundRef.current = new Audio('/audio/timer-start.mp3');
    endSoundRef.current = new Audio('/audio/timer-end.mp3');
  }, []);

  useEffect(() => {
    if (state === 'stopped' && seconds === 0) {
      endSoundRef.current?.play().catch(e => console.error('Audio play failed:', e));
      setIsFullscreen(false);
    }
  }, [state, seconds]);

  const getTimerColor = () => {
    switch (state) {
      case 'running': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTimerBorderColor = () => {
    switch (state) {
      case 'running': return 'border-green-500/20 shadow-green-500/10';
      case 'paused': return 'border-yellow-500/20 shadow-yellow-500/10';
      default: return 'border-border';
    }
  };

  const handleLockIn = () => {
    start();
    setIsFullscreen(true);
    startSoundRef.current?.play().catch(e => console.error('Audio play failed:', e));
  };

  const handlePlayPause = () => {
    if (state === 'running') {
      pause();
    } else {
      start();
    }
  };

  const handleStop = () => {
    if (currentVideo) {
      setShowStopDialog(true);
    } else {
      stop();
    }
  };

  const handleStopConfirm = (stopAmbient: boolean) => {
    stop();
    if (stopAmbient) {
      setIsPlaying(false);
      setCurrentVideo(null);
    }
    setShowStopDialog(false);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleMinimize = () => {
    setIsFullscreen(false);
    setShowMinimized(true);
  };

  const handleMaximize = () => {
    setShowMinimized(false);
    setIsFullscreen(true);
  };

  const handleModeSelect = (mode: StudyMode) => {
    setSelectedMode(mode);
    // Set up ambient sound for the selected mode
    const sound = ambientSounds[mode];
    if (sound) {
      setCurrentVideo(sound.videoId);
      setIsLooping(true);
      setIsPlaying(true);
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
      <div className="p-6 space-y-6 mt-16 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Timer Card */}
          <Card className={cn("transition-all duration-300 shadow-soft", getTimerBorderColor())}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Clock className="h-6 w-6" />
              Focus Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className={cn("text-8xl font-geo font-bold transition-colors duration-300", getTimerColor())}>
                {formattedTime}
              </div>
              <p className="text-base text-muted-foreground mt-4">
                {state === 'running' && 'Keep going! You\'re in the zone 🔥'}
                {state === 'paused' && 'Take a break, then get back to it! ⏸️'}
                {state === 'stopped' && 'Ready to lock in? 🚀'}
              </p>
            </div>

            {/* Study Mode Selection with Ambient Sounds */}
            {state === 'stopped' && (
              <StudyModeSelector 
                selectedMode={selectedMode}
                onModeSelect={handleModeSelect}
              />
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-2 flex-wrap">
              {state === 'stopped' && (
                <Button 
                  onClick={handleLockIn} 
                  size="lg" 
                  className="gradient-primary px-10 py-6 text-xl font-semibold"
                >
                  <Zap className="h-6 w-6 mr-2" />
                  Lock In!
                </Button>
              )}

              {state === 'running' && !isFullscreen && (
                <>
                  <Button onClick={pause} variant="outline" size="lg">
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={handleStop} variant="destructive" size="lg">
                    <Square className="h-5 w-5 mr-2" />
                    Stop
                  </Button>
                  <Button onClick={handleMinimize} variant="ghost" size="lg">
                    <Minimize2 className="h-5 w-5 mr-2" />
                    Minimize
                  </Button>
                </>
              )}

              {state === 'paused' && (
                <>
                  <Button onClick={start} size="lg" className="gradient-primary">
                    <Play className="h-5 w-5 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={handleStop} variant="destructive" size="lg">
                    <Square className="h-5 w-5 mr-2" />
                    Stop
                  </Button>
                  <Button onClick={handleMinimize} variant="ghost" size="lg">
                    <Minimize2 className="h-5 w-5 mr-2" />
                    Minimize
                  </Button>
                </>
              )}

              {(state === 'paused' || state === 'stopped') && seconds > 0 && (
                <Button onClick={reset} variant="ghost" size="lg">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset
                </Button>
              )}
            </div>

            {/* Study Session Info */}
            {seconds > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Current session: {Math.floor(seconds / 60)} minutes</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Fullscreen Study Mode */}
      <FullscreenStudyMode
        mode={selectedMode}
        isActive={isFullscreen && state !== 'stopped'}
        seconds={seconds}
        totalSeconds={60 * 60} // 60 minutes default
        onPlayPause={handlePlayPause}
        onExit={handleExitFullscreen}
        isPaused={state === 'paused'}
      />

      {/* Minimized Floating Timer */}
      {showMinimized && state !== 'stopped' && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-lg w-48">
            <CardContent className="p-4 space-y-2">
              <div className={cn("text-2xl font-bold text-center", getTimerColor())}>
                {formattedTime}
              </div>
              <div className="flex gap-1 justify-center">
                <Button size="sm" variant="outline" onClick={handlePlayPause}>
                  {state === 'running' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleStop}>
                  <Square className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleMaximize}>
                  <Clock className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stop Confirmation Dialog */}
      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Timer</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to stop the ambient sounds as well?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleStopConfirm(false)}>
              Keep Playing
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStopConfirm(true)}>
              Stop Sounds
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default FocusTimer;
