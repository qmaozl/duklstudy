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
  const [fadingOut, setFadingOut] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Keep latest onComplete without re-triggering timers
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isActive) {
      setVisible(false);
      setFadingOut(false);
      return;
    }

    setVisible(true);
    setFadingOut(false);

    // Show message for 1000ms before starting fade
    const messageTimeout = setTimeout(() => {
      setFadingOut(true);
    }, 1000);

    // Complete transition during fade
    const completeTimeout = setTimeout(() => {
      onCompleteRef.current?.();
    }, 1500);

    // Remove overlay after fade completes (total 2500ms)
    const hideTimeout = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => {
      clearTimeout(messageTimeout);
      clearTimeout(completeTimeout);
      clearTimeout(hideTimeout);
    };
  }, [isActive]);

  if (!isActive || !visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center',
        variant === 'enter' ? 'bg-[hsl(0_0%_0%)]' : 'bg-[hsl(var(--destructive))]',
        'transition-opacity duration-1000',
        fadingOut ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className={cn(
        "text-3xl md:text-4xl font-geo text-white/95",
        "transition-all duration-700",
        fadingOut ? "scale-95 opacity-0" : "scale-100 opacity-100"
      )}>
        {message}
      </div>
    </div>
  );
};

export default TransitionOverlay;