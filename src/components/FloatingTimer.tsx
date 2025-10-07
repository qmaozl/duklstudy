import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FloatingTimerProps {
  seconds: number;
  state: 'stopped' | 'running' | 'paused';
  formattedTime: string;
  onPlayPause: () => void;
  onStop: () => void;
  onExpand: () => void;
  onClose: () => void;
}

export function FloatingTimer({
  seconds,
  state,
  formattedTime,
  onPlayPause,
  onStop,
  onExpand,
  onClose
}: FloatingTimerProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 280, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const getTimerColor = () => {
    switch (state) {
      case 'running': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card
      className={cn(
        "fixed z-50 shadow-2xl border-2 cursor-move select-none backdrop-blur-md bg-background/95",
        state === 'running' && "border-green-500/50",
        state === 'paused' && "border-yellow-500/50",
        isDragging && "opacity-90"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '260px'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">FOCUS TIMER</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onExpand}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Timer Display */}
        <div className={cn("text-4xl font-bold text-center font-geo", getTimerColor())}>
          {formattedTime}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onPlayPause}
            className="h-8"
          >
            {state === 'running' ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onStop}
            className="h-8"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {state === 'running' && '🔥 Stay focused!'}
          {state === 'paused' && '⏸️ Paused'}
          {state === 'stopped' && '⏹️ Stopped'}
        </p>
      </div>
    </Card>
  );
}
