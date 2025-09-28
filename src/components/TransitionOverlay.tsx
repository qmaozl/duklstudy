import React, { useState, useEffect } from 'react';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransitionOverlayProps {
  isActive: boolean;
  onComplete: () => void;
}

const TransitionOverlay = ({ isActive, onComplete }: TransitionOverlayProps) => {
  const [phase, setPhase] = useState<'fade' | 'rocket' | 'shake' | 'complete'>('fade');

  useEffect(() => {
    if (!isActive) return;

    const timeline = async () => {
      // Phase 1: Fade to black (1s)
      setPhase('fade');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Phase 2: Rocket appears and takes off (2s)
      setPhase('rocket');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Phase 3: Shake effect (1s)
      setPhase('shake');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Phase 4: Complete transition
      setPhase('complete');
      onComplete();
    };

    timeline();
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-1000",
        phase === 'fade' ? 'bg-black/100' : 'bg-black/0 pointer-events-none',
        phase === 'shake' && 'animate-[shake_1s_ease-in-out]'
      )}
      style={{
        animation: phase === 'shake' ? 'shake 1s ease-in-out' : undefined
      }}
    >
      {/* Rocket Animation */}
      {(phase === 'rocket' || phase === 'shake') && (
        <div className="relative">
          <div 
            className={cn(
              "transition-all duration-2000 ease-out",
              phase === 'rocket' ? 'animate-[rocketTakeoff_2s_ease-out]' : '',
              phase === 'shake' ? 'opacity-0' : 'opacity-100'
            )}
          >
            <Rocket 
              size={80} 
              className="text-white transform rotate-45 filter drop-shadow-lg" 
            />
            {/* Rocket trail */}
            <div className="absolute -bottom-2 -left-2 w-2 h-20 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full opacity-80 animate-pulse" />
            <div className="absolute -bottom-1 -left-1 w-1 h-16 bg-gradient-to-t from-red-500 via-orange-400 to-transparent rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitionOverlay;