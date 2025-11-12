import React, { useState, useEffect } from 'react';
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

export const OnboardingTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState('top');

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('dukl-tour-completed');
    if (!hasSeenTour) {
      // Wait a bit for page to load, then start tour
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        let top = 0;
        let left = 0;
        let arrow = 'top';

        switch (step.position) {
          case 'right':
            top = rect.top + scrollY + rect.height / 2 - 100;
            left = rect.right + scrollX + 20;
            arrow = 'left';
            break;
          case 'bottom':
            top = rect.bottom + scrollY + 20;
            left = rect.left + scrollX + rect.width / 2 - 160;
            arrow = 'top';
            break;
          case 'left':
            top = rect.top + scrollY + rect.height / 2 - 100;
            left = rect.left + scrollX - 340;
            arrow = 'right';
            break;
          case 'top':
            top = rect.top + scrollY - 220;
            left = rect.left + scrollX + rect.width / 2 - 160;
            arrow = 'bottom';
            break;
        }

        setTooltipPosition({ top, left });
        setArrowPosition(arrow);

        // Highlight the target element
        element.classList.add('tour-highlight');
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target);
      if (element) {
        element.classList.remove('tour-highlight');
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    localStorage.setItem('dukl-tour-completed', 'true');
    setIsActive(false);
    
    // Remove highlights
    tourSteps.forEach(step => {
      const element = document.querySelector(step.target);
      if (element) {
        element.classList.remove('tour-highlight');
      }
    });
  };

  if (!isActive) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100] animate-in fade-in duration-300" />
      
      {/* Tooltip */}
      <div
        className="fixed z-[101] w-80 animate-in zoom-in-95 duration-300"
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
