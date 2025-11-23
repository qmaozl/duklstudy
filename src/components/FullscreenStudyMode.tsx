import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudyMode } from './StudyModeSelector';

interface FullscreenStudyModeProps {
  mode: StudyMode;
  isActive: boolean;
  seconds: number;
  totalSeconds: number;
  onPlayPause: () => void;
  onExit: () => void;
  isPaused: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

const FullscreenStudyMode = ({ 
  mode, 
  isActive, 
  seconds, 
  totalSeconds,
  onPlayPause, 
  onExit, 
  isPaused,
  audioRef
}: FullscreenStudyModeProps) => {
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRef = audioRef ?? internalAudioRef;
  const [isPlaying, setIsPlaying] = useState(!isPaused);
  const [audioPosition, setAudioPosition] = useState(0);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  const modeConfig = {
    ocean: {
      className: 'white-noise-stars',
      audio: { mp3: '/audio/ocean-waves.mp3' }
    },
    rain: {
      className: 'white-noise-stars',
      audio: { mp3: '/audio/rain.mp3' }
    },
    whitenoise: {
      className: 'white-noise-stars',
      audio: { mp3: '/audio/white-noise.mp3' }
    }
  } as const;

  const config = modeConfig[mode];
  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

  useEffect(() => {
    const audio = mediaRef.current;
    if (!audio) return;
    
    audio.loop = true;
    audio.volume = 0.5;
    audio.muted = false;
    audio.preload = 'auto';
    
    if (isActive && !isPaused) {
      // Force load and play
      audio.load();
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playing successfully');
            setIsPlaying(true);
          })
          .catch((e) => {
            console.warn('Autoplay blocked, clicking play button will start audio:', e);
            setIsPlaying(false);
          });
      }
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isActive, mode, isPaused]);

  useEffect(() => {
    const audio = mediaRef.current;
    if (!audio) return;

    if (isPaused) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPaused]);

  useEffect(() => {
    const audio = mediaRef.current;
    if (!audio) return;

    const updatePosition = () => {
      if (audio.duration) {
        setAudioPosition((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updatePosition);
    return () => audio.removeEventListener('timeupdate', updatePosition);
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = mediaRef.current;
    if (!audio) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    if (audio.duration) {
      audio.currentTime = percentage * audio.duration;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreenMode) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreenMode(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreenMode(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden",
        config.className
      )}
    >
      {!audioRef && (
        <audio ref={internalAudioRef} preload="auto" autoPlay playsInline>
          <source src={config.audio.mp3} type="audio/mpeg" />
        </audio>
      )}
      
      {/* Fullscreen Toggle Button */}
      <Button
        onClick={toggleFullscreen}
        variant="ghost"
        size="icon"
        className="absolute top-8 right-8 text-[hsl(0_0%_0%)]/80 hover:text-[hsl(0_0%_0%)] hover:bg-black/10"
      >
        {isFullscreenMode ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
      </Button>

      {/* Exit Button */}
      <Button
        onClick={onExit}
        variant="ghost"
        size="lg"
        className="absolute top-8 left-8 text-lg font-semibold text-[hsl(0_0%_0%)] hover:bg-black/10"
      >
        Exit
      </Button>

      {/* Timer Display */}
      <div className="text-center mb-8 animate-scale-in">
        <div className="text-9xl font-geo font-light drop-shadow-2xl mb-6 transition-all duration-500 text-[hsl(0_0%_0%)]">
          {formatTime(seconds)}
        </div>
        {totalSeconds > 0 && (
          <div className="text-2xl font-medium animate-fade-in text-[hsl(0_0%_15%)]">
            Target: {formatTime(totalSeconds)}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={onPlayPause}
          size="lg"
          className={cn(
            "px-8 py-6 text-lg font-semibold rounded-full shadow-lg",
            isPaused 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-yellow-600 hover:bg-yellow-700 text-white"
          )}
        >
          {isPaused ? (
            <>
              <Play className="h-6 w-6 mr-2" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-6 w-6 mr-2" />
              Pause
            </>
          )}
        </Button>
      </div>

      {/* Audio Progress Bar */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 animate-slide-in-right">
        <div className="bg-black/80 backdrop-blur rounded-full px-6 py-3 flex items-center space-x-4 transition-all duration-300 hover:bg-black/90">
          <div 
            className="w-64 h-2 bg-gray-600 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${audioPosition}%` }}
            />
            
            {totalSeconds > 0 && (
              <div 
                className="absolute top-0 left-0 h-full bg-primary/40 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenStudyMode;