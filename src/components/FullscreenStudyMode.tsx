import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudyMode } from './StudyModeSelector';
import oceanBackground from '@/assets/ocean-background.jpg';
import rainBackground from '@/assets/rain-background.jpg';

interface FullscreenStudyModeProps {
  mode: StudyMode;
  isActive: boolean;
  seconds: number;
  totalSeconds: number;
  onPlayPause: () => void;
  onExit: () => void;
  isPaused: boolean;
}

const FullscreenStudyMode = ({ 
  mode, 
  isActive, 
  seconds, 
  totalSeconds,
  onPlayPause, 
  onExit, 
  isPaused 
}: FullscreenStudyModeProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(!isPaused);
  const [audioPosition, setAudioPosition] = useState(0);

  const modeConfig = {
    ocean: {
      background: `url(${oceanBackground})`,
      audioSrc: '/audio/ocean-waves.mp3',
      className: 'bg-gradient-to-b from-blue-900/20 to-blue-600/30'
    },
    rain: {
      background: `url(${rainBackground})`,
      audioSrc: '/audio/rain.mp3',
      className: 'bg-gradient-to-b from-slate-900/40 to-slate-600/30'
    },
    whitenoise: {
      background: '#ffffff',
      audioSrc: '/audio/white-noise.mp3',
      className: 'bg-white white-noise-stars'
    }
  };

  const config = modeConfig[mode];
  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

  useEffect(() => {
    if (isActive && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      
      if (!isPaused) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isActive, mode]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  }, [isPaused]);

  useEffect(() => {
    const audio = audioRef.current;
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
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    if (audioRef.current.duration) {
      audioRef.current.currentTime = percentage * audioRef.current.duration;
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
        "fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 animate-fade-in",
        config.className
      )}
      style={{
        backgroundImage: config.background,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <audio ref={audioRef} src={config.audioSrc} />
      
      {/* Exit Button */}
      <Button
        onClick={onExit}
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/10"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Timer Display */}
      <div className="text-center mb-8 animate-scale-in">
        <div className="text-8xl font-geo font-light text-white drop-shadow-lg mb-4 transition-all duration-500">
          {formatTime(seconds)}
        </div>
        {totalSeconds > 0 && (
          <div className="text-xl text-white/80 animate-fade-in">
            Target: {formatTime(totalSeconds)}
          </div>
        )}
      </div>

      {/* Audio Control Bar */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 animate-slide-in-right">
        <div className="bg-black/80 backdrop-blur rounded-full px-6 py-3 flex items-center space-x-4 transition-all duration-300 hover:bg-black/90">
          {/* Progress Bar */}
          <div 
            className="w-64 h-2 bg-gray-600 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${audioPosition}%` }}
            />
            
            {/* Timer Progress Overlay */}
            {totalSeconds > 0 && (
              <div 
                className="absolute top-0 left-0 h-full bg-primary/40 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>

          {/* Play/Pause Button */}
          <Button
            onClick={onPlayPause}
            size="icon"
            className="w-12 h-12 rounded-full bg-white text-black hover:bg-white/90"
          >
            {isPaused ? (
              <Play className="h-5 w-5 ml-0.5" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenStudyMode;