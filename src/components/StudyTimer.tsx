import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, RotateCcw, Clock } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';

const StudyTimer = () => {
  const { seconds, state, start, pause, stop, reset, formattedTime } = useTimer();

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

  return (
    <Card className={cn("transition-all duration-300 shadow-soft", getTimerBorderColor())}>
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Study Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className={cn("text-6xl font-mono font-bold transition-colors duration-300", getTimerColor())}>
            {formattedTime}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {state === 'running' && 'Keep going! You\'re in the zone 🔥'}
            {state === 'paused' && 'Take a break, then get back to it! ⏸️'}
            {state === 'stopped' && 'Ready to start studying? 🚀'}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-2">
          {state === 'stopped' && (
            <Button onClick={start} size="lg" className="gradient-primary">
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}

          {state === 'running' && (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyTimer;