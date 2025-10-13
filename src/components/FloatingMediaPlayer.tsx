import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, Maximize2, SkipForward, SkipBack, Repeat, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingMediaPlayerProps {
  isPlaying: boolean;
  isLooping: boolean;
  isShuffling: boolean;
  currentIndex: number;
  playlistLength: number;
  currentVideoTitle: string;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
}

export function FloatingMediaPlayer({
  isPlaying,
  isLooping,
  isShuffling,
  currentIndex,
  playlistLength,
  currentVideoTitle,
  onTogglePlay,
  onNext,
  onPrevious,
  onMaximize,
  onClose,
  onToggleLoop,
  onToggleShuffle
}: FloatingMediaPlayerProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 250 });
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

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div 
      className={cn(
        "fixed z-50 bg-background border-2 border-primary rounded-lg shadow-2xl",
        isDragging && "opacity-90"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div 
        className="bg-primary/10 px-3 py-2 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <p className="text-sm font-medium truncate">{currentVideoTitle || 'Playing Audio'}</p>
        <p className="text-xs text-muted-foreground">Drag to move</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={currentIndex <= 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMaximize}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-center gap-2">
          <Button
            variant={isLooping ? "default" : "ghost"}
            size="sm"
            onClick={onToggleLoop}
          >
            <Repeat className="h-4 w-4" />
          </Button>
          <Button
            variant={isShuffling ? "default" : "ghost"}
            size="sm"
            onClick={onToggleShuffle}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}