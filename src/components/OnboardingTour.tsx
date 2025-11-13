import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="study-rooms"]',
    title: 'Study Rooms 🎯',
    description: 'Join live study sessions with friends. Chat, collaborate, and stay motivated together in real-time.',
    position: 'right'
  },
  {
    target: '[data-tour="playlist"]',
    title: 'Playlist Maker 🎵',
    description: 'Create custom playlists from YouTube. Enjoy ad-free music while you study and share with friends.',
    position: 'bottom'
  },
  {
    target: '[data-tour="flashcards"]',
    title: 'Smart Flashcards 📚',
    description: 'Transform your notes into interactive flashcards. Review and remember with spaced repetition.',
    position: 'bottom'
  }
];

const isElementVisible = (el: Element | null): el is HTMLElement => {
  if (!el || !(el as HTMLElement).getClientRects) return false;
  const rects = (el as HTMLElement).getClientRects();
  if (!rects || rects.length === 0) return false;
  const style = window.getComputedStyle(el as HTMLElement);
  if (style.visibility === 'hidden' || style.display === 'none') return false;
  return true;
};

const findFirstAvailableStep = (): number => {
  for (let i = 0; i < tourSteps.length; i++) {
    const el = document.querySelector(tourSteps[i].target);
    if (isElementVisible(el)) return i;
  }
  return -1;
};

const getNextVisibleStep = (fromIndex: number): number => {
  for (let i = fromIndex + 1; i < tourSteps.length; i++) {
    const el = document.querySelector(tourSteps[i].target);
    if (isElementVisible(el)) return i;
  }
  return -1;
};

const getPrevVisibleStep = (fromIndex: number): number => {
  for (let i = fromIndex - 1; i >= 0; i--) {
    const el = document.querySelector(tourSteps[i].target);
    if (isElementVisible(el)) return i;
  }
  return -1;
};

export const OnboardingTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState('top');
  const location = useLocation();
  const scrolledRef = useRef(false);
  const watchdogTimerRef = useRef<number | null>(null);

useEffect(() => {
    const hasSeenTour = localStorage.getItem('dukl-tour-completed');
    if (hasSeenTour) return;

    const timer = window.setTimeout(() => {
      // Ensure layout is stable before checking
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const idx = findFirstAvailableStep();
          if (idx >= 0) {
            setCurrentStep(idx);
            setIsActive(true);
          } else {
            setIsActive(false);
          }
        });
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

useEffect(() => {
    if (!isActive) return;

    const ensureValidStep = () => {
      const idx = findFirstAvailableStep();
      if (idx === -1) {
        setIsActive(false);
        return false;
      }
      if (idx !== currentStep) {
        setCurrentStep(idx);
        return false;
      }
      return true;
    };

    if (!ensureValidStep()) return;

    scrolledRef.current = false;

    const updatePosition = () => {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target) as HTMLElement | null;

      if (!isElementVisible(element)) {
        ensureValidStep();
        return;
      }

      const rect = (element as HTMLElement).getBoundingClientRect();

      let top = 0;
      let left = 0;
      let arrow = 'top';

      switch (step.position) {
        case 'right':
          top = rect.top + rect.height / 2 - 100;
          left = rect.right + 20;
          arrow = 'left';
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2 - 160;
          arrow = 'top';
          break;
        case 'left':
          top = rect.top + rect.height / 2 - 100;
          left = rect.left - 340;
          arrow = 'right';
          break;
        case 'top':
          top = rect.top - 220;
          left = rect.left + rect.width / 2 - 160;
          arrow = 'bottom';
          break;
      }

      const TOOLTIP_WIDTH = 320; // w-80
      const TOOLTIP_HEIGHT = 220; // approx
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      left = Math.max(8, Math.min(left, vpW - TOOLTIP_WIDTH - 8));
      top = Math.max(8, Math.min(top, vpH - TOOLTIP_HEIGHT - 8));

      setTooltipPosition({ top, left });
      setArrowPosition(arrow);

      // Highlight the target element
      (element as HTMLElement).classList.add('tour-highlight');

      // Scroll element into view only once per step
      if (!scrolledRef.current) {
        (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrolledRef.current = true;
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target);
      if (element) {
        (element as HTMLElement).classList.remove('tour-highlight');
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        completeTour();
      }
    };
    window.addEventListener('keydown', onKey);
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
    }
    watchdogTimerRef.current = window.setTimeout(() => {
      const idx = findFirstAvailableStep();
      if (idx === -1) completeTour();
    }, 8000);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };
  }, [isActive]);

  const handleNext = () => {
    const nextIdx = getNextVisibleStep(currentStep);
    if (nextIdx !== -1) {
      scrolledRef.current = false;
      setCurrentStep(nextIdx);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    const prevIdx = getPrevVisibleStep(currentStep);
    if (prevIdx !== -1) {
      scrolledRef.current = false;
      setCurrentStep(prevIdx);
    }
  };

const completeTour = () => {
    localStorage.setItem('dukl-tour-completed', 'true');
    setIsActive(false);
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    scrolledRef.current = false;
    
    // Remove highlights
    tourSteps.forEach(step => {
      const element = document.querySelector(step.target);
      if (element) {
        (element as HTMLElement).classList.remove('tour-highlight');
      }
    });
  };

  if (!isActive) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100] animate-in fade-in duration-300" onClick={completeTour} role="button" aria-label="Close tour overlay" />

      {/* Always-accessible Skip button */}
      <div className="fixed bottom-6 right-6 z-[120]">
        <Button variant="outline" size="sm" onClick={completeTour}>Skip tour</Button>
      </div>
      
      {/* Tooltip */}
      <div
        className="fixed z-[120] w-80 animate-in zoom-in-95 duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 relative border-2 border-primary/20">
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-4 h-4 bg-white border-primary/20 rotate-45",
              arrowPosition === 'top' && "-top-2 left-1/2 -translate-x-1/2 border-t-2 border-l-2",
              arrowPosition === 'bottom' && "-bottom-2 left-1/2 -translate-x-1/2 border-b-2 border-r-2",
              arrowPosition === 'left' && "-left-2 top-1/2 -translate-y-1/2 border-l-2 border-b-2",
              arrowPosition === 'right' && "-right-2 top-1/2 -translate-y-1/2 border-r-2 border-t-2"
            )}
          />

          {/* Close button */}
          <button
            onClick={completeTour}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="pr-6">
            <h3 className="text-xl font-bold text-saas-charcoal mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStep 
                      ? "bg-primary w-6" 
                      : "bg-gray-300"
                  )}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-saas-blue-dark to-saas-blue"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < tourSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
