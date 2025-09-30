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

    // Show message for 800ms before fading
    const messageTimeout = setTimeout(() => {
      setFadingOut(true);
    }, 800);

    // Mount background during fade
    const completeTimeout = setTimeout(() => {
      onCompleteRef.current?.();
    }, 1300);

    // Remove overlay completely after fade completes
    const hideTimeout = setTimeout(() => {
      setVisible(false);
    }, 2000);

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
        'transition-opacity duration-700',
        fadingOut ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className={cn(
        "text-3xl md:text-4xl font-geo text-white/95",
        "transition-transform duration-500",
        fadingOut ? "scale-95 opacity-0" : "scale-100 opacity-100"
      )}>
        {message}
      </div>
    </div>
  );
};

export default TransitionOverlay;