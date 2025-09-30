import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
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

  const modeConfig = {
    ocean: {
      className: 'ocean-animated',
      audio: { wav: '/audio/ocean-waves.wav', mp3: '/audio/ocean-waves.mp3' }
    },
    rain: {
      className: 'rain-animated',
      audio: { wav: '/audio/rain.wav', mp3: '/audio/rain.mp3' }
    },
    whitenoise: {
      className: 'white-noise-stars',
      audio: { wav: '/audio/white-noise.wav', mp3: '/audio/white-noise.mp3' }
    }
  } as const;

  const config = modeConfig[mode];
  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
  const backgroundStyle =
    mode === 'ocean'
      ? { backgroundImage: "url(/images/sea.jpg)" }
      : mode === 'rain'
      ? { backgroundImage: "url(/images/rain.jpg)" }
      : undefined;

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
        "fixed top-0 left-0 right-0 bottom-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 animate-fade-in",
        config.className
      )}
      style={{
        ...backgroundStyle,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
    >
      {!audioRef && (
        <audio ref={internalAudioRef} preload="auto" autoPlay playsInline>
          <source src={config.audio.mp3} type="audio/mpeg" />
        </audio>
      )}
      
      {/* Exit Button */}
      <Button
        onClick={onExit}
        variant="ghost"
        className={cn(
          "absolute top-6 left-1/2 -translate-x-1/2",
          mode === 'whitenoise'
            ? "text-[hsl(0_0%_0%)]/80 hover:text-[hsl(0_0%_0%)] hover:bg-black/10"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
      >
        Lock Out? :(
      </Button>

      {/* Timer Display */}
      <div className="text-center mb-8 animate-scale-in">
        <div className={cn(
          "text-8xl font-geo font-light drop-shadow-lg mb-4 transition-all duration-500",
          mode === 'whitenoise' ? "text-[hsl(0_0%_0%)]" : "text-white"
        )}>
          {formatTime(seconds)}
        </div>
        {totalSeconds > 0 && (
          <div className={cn("text-xl animate-fade-in", mode === 'whitenoise' ? "text-[hsl(0_0%_15%)]" : "text-white/80") }>
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