import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTimerContext } from '@/contexts/TimerContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, RotateCcw, Clock, Zap, Minimize2, MessageSquare, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdBanner } from '@/components/AdBanner';
import StudyGroupManagerNew from '@/components/StudyGroupManagerNew';
import TwitchStyleChat from '@/components/TwitchStyleChat';
import ActiveStudiersPanel from '@/components/ActiveStudiersPanel';

const StudyGroup = () => {
  const { user, loading } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [isInRoom, setIsInRoom] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const studyGroupManagerRef = useRef<{ leaveRoom: () => void; setActiveStudying: (active: boolean) => Promise<void> }>(null);
  const { timer, setGroupId, setIsMinimized } = useTimerContext();
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const endSoundRef = useRef<HTMLAudioElement | null>(null);

  // Set page title
  useEffect(() => {
    document.title = 'Study Group - Dukl';
    return () => {
      document.title = 'Dukl';
    };
  }, []);

  // Sync group ID with context and open chat when group selected
  useEffect(() => {
    setGroupId(selectedGroupId);
    if (selectedGroupId) {
      setIsChatOpen(true);
    }
  }, [selectedGroupId, setGroupId]);

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
    if (isInRoom) {
      studyGroupManagerRef.current?.setActiveStudying(true);
    }
    startSoundRef.current?.play().catch(e => console.error('Audio play failed:', e));
  };

  const handlePause = () => {
    timer.pause();
    if (isInRoom) {
      studyGroupManagerRef.current?.setActiveStudying(false);
    }
  };

  const handleResume = () => {
    timer.start();
    if (isInRoom) {
      studyGroupManagerRef.current?.setActiveStudying(true);
    }
  };

  const handleStop = useCallback(async () => {
    await timer.stop();
    if (isInRoom) {
      studyGroupManagerRef.current?.setActiveStudying(false);
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
      {selectedGroupId && isChatOpen && (
        <TwitchStyleChat 
          groupId={selectedGroupId} 
          isInRoom={isInRoom}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* Reopen Chat Button - Fixed Right Bottom */}
      {selectedGroupId && !isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed right-6 bottom-6 z-40 shadow-lg rounded-full h-14 w-14 p-0"
          size="lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      <div className={cn("p-6 space-y-6 transition-all mt-16 min-h-screen", isChatOpen && selectedGroupId ? "pr-[22rem]" : "")}>
        {/* Top Banner Ad */}
        <AdBanner format="horizontal" />

        {/* Contextual Onboarding Info */}
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="p-4 flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Study with Friends for Accountability 🤝</h3>
              <p className="text-sm text-muted-foreground">
                Join or create study rooms to see who's online and stay motivated together. Use the group timer to track your sessions and chat with your study buddies!
              </p>
            </div>
          </CardContent>
        </Card>

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

        {/* Group Timer */}
        <Card className={cn("transition-all duration-300 shadow-soft", getTimerBorderColor())}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Group Study Timer
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track your study time with your group
            </p>
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
                  <Button onClick={handlePause} variant="outline" size="lg">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={handleStop} variant="destructive" size="lg">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                  <Button onClick={() => setIsMinimized(true)} variant="ghost" size="lg">
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minimize
                  </Button>
                </>
              )}

              {timer.state === 'paused' && (
                <>
                  <Button onClick={handleResume} size="lg" className="gradient-primary">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={handleStop} variant="destructive" size="lg">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                  <Button onClick={() => setIsMinimized(true)} variant="ghost" size="lg">
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minimize
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

export default StudyGroup;
