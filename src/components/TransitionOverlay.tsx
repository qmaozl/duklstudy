import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TransitionOverlayProps {
  isActive: boolean;
  onComplete: () => void;
  variant?: 'enter' | 'exit';
  message?: string;
}

const TransitionOverlay = ({ isActive, onComplete, variant = 'enter', message = 'Lock In!' }: TransitionOverlayProps) => {
  const [visible, setVisible] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Keep latest onComplete without re-triggering timers
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isActive) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const messageTimeout = setTimeout(() => {
      onCompleteRef.current?.();
    }, 1000);

    const hideTimeout = setTimeout(() => {
      setVisible(false);
    }, 1400);

    return () => {
      clearTimeout(messageTimeout);
      clearTimeout(hideTimeout);
    };
  }, [isActive]);

  if (!isActive || !visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700',
        variant === 'enter' ? 'bg-[hsl(0_0%_0%)]' : 'bg-[hsl(var(--destructive))]',
        'animate-fade-in'
      )}
    >
      <div className="text-3xl md:text-4xl font-geo text-white/95 animate-scale-in">
        {message}
      </div>
    </div>
  );
};

export default TransitionOverlay;