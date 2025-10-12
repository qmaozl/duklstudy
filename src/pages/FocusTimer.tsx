import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, RotateCcw, Clock, Zap } from 'lucide-react';
import { useStudyGroupTimer } from '@/hooks/useStudyGroupTimer';
import { cn } from '@/lib/utils';
import StudyGroupManagerNew from '@/components/StudyGroupManagerNew';
import TwitchStyleChat from '@/components/TwitchStyleChat';
import PlaylistMaker from '@/components/PlaylistMaker';
import ActiveStudiersPanel from '@/components/ActiveStudiersPanel';

const FocusTimer = () => {
  const { user, loading } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [isInRoom, setIsInRoom] = useState(false);
  const studyGroupManagerRef = useRef<{ leaveRoom: () => void }>(null);
  const timer = useStudyGroupTimer(selectedGroupId);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const endSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startSoundRef.current = new Audio('/audio/timer-start.mp3');
    endSoundRef.current = new Audio('/audio/timer-end.mp3');
  }, []);

  useEffect(() => {
    if (timer.state === 'stopped' && timer.seconds === 0) {
      endSoundRef.current?.play().catch(e => console.error('Audio play failed:', e));
    }
  }, [timer.state, timer.seconds]);

  const handleLockIn = () => {
    timer.start();
    startSoundRef.current?.play().catch(e => console.error('Audio play failed:', e));
  };

  const handleStop = useCallback(async () => {
    await timer.stop();
    // Leave room when timer stops to reset Active Studiers display
    if (isInRoom) {
      studyGroupManagerRef.current?.leaveRoom();
    }
  }, [timer, isInRoom]);

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
      {/* Twitch-Style Chat - Fixed Right */}
      {selectedGroupId && (
        <TwitchStyleChat groupId={selectedGroupId} isInRoom={isInRoom} />
      )}

      <div className="p-6 space-y-6 pr-[22rem]">
        {/* Study Rooms */}
        <StudyGroupManagerNew 
          ref={studyGroupManagerRef}
          onGroupSelect={setSelectedGroupId}
          onRoomJoin={setIsInRoom}
        />

        {/* Active Studiers Panel */}
        {selectedGroupId && (
          <ActiveStudiersPanel groupId={selectedGroupId} />
        )}

        {/* Playlist Maker */}
        <PlaylistMaker />

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
                  <Button onClick={handleStop} variant="destructive" size="lg">
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
                  <Button onClick={handleStop} variant="destructive" size="lg">
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
