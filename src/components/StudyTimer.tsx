import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, RotateCcw, Clock, Zap } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';
import StudyModeSelector, { StudyMode } from './StudyModeSelector';
import FullscreenStudyMode from './FullscreenStudyMode';
import StudyGroupManager from './StudyGroupManager';
import TransitionOverlay from './TransitionOverlay';

const StudyTimer = () => {
  const { seconds, state, start, pause, stop, reset, formattedTime } = useTimer();
  const [selectedMode, setSelectedMode] = useState<StudyMode>('ocean');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [targetMinutes, setTargetMinutes] = useState(25); // Default 25-minute session
  const [showTransition, setShowTransition] = useState(false);
  const [showExitTransition, setShowExitTransition] = useState(false);

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
    setShowTransition(true);
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setShowExitTransition(true);
  };

  const handleExitTransitionComplete = () => {
    setIsFullscreen(false);
    setShowExitTransition(false);
  };

  const handlePlayPause = () => {
    if (state === 'running') {
      pause();
    } else {
      start();
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Main Timer Card */}
        <Card className={cn("transition-all duration-300 shadow-soft", getTimerBorderColor())}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Focus Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Study Groups */}
            <StudyGroupManager />

            {/* Timer Display */}
            <div className="text-center">
              <div className={cn("text-6xl font-geo font-bold transition-colors duration-300", getTimerColor())}>
                {formattedTime}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {state === 'running' && 'Keep going! You\'re in the zone 🔥'}
                {state === 'paused' && 'Take a break, then get back to it! ⏸️'}
                {state === 'stopped' && 'Ready to lock in? 🚀'}
              </p>
            </div>

            {/* Study Mode Selection */}
            {state === 'stopped' && (
              <StudyModeSelector 
                selectedMode={selectedMode}
                onModeSelect={setSelectedMode}
              />
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-2">
              {state === 'stopped' && (
                <Button 
                  onClick={handleLockIn} 
                  size="lg" 
                  className="gradient-primary px-8 py-3 text-lg font-semibold"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Lock In!
                </Button>
              )}

              {state === 'running' && !isFullscreen && (
                <>
                  <Button onClick={pause} variant="outline" size="lg">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={stop} variant="destructive" size="lg">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {state === 'paused' && (
                <>
                  <Button onClick={start} size="lg" className="gradient-primary">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={stop} variant="destructive" size="lg">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}

              {(state === 'paused' || state === 'stopped') && seconds > 0 && (
                <Button onClick={reset} variant="ghost" size="lg">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>

            {/* Study Session Info */}
            {seconds > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Current session: {Math.floor(seconds / 60)} minutes</p>
                {targetMinutes > 0 && (
                  <p>Target: {targetMinutes} minutes</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transition Overlays */}
      <TransitionOverlay
        isActive={showTransition}
        onComplete={handleTransitionComplete}
        variant="enter"
        message="Lock In!"
      />
      <TransitionOverlay
        isActive={showExitTransition}
        onComplete={handleExitTransitionComplete}
        variant="exit"
        message="Lock Out? :("
      />

      {/* Fullscreen Study Mode */}
      <FullscreenStudyMode
        mode={selectedMode}
        isActive={isFullscreen && state !== 'stopped'}
        seconds={seconds}
        totalSeconds={targetMinutes * 60}
        onPlayPause={handlePlayPause}
        onExit={handleExitFullscreen}
        isPaused={state === 'paused'}
      />
    </>
  );
};

export default StudyTimer;