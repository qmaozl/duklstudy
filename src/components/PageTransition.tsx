import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  useEffect(() => {
    // Check if transitioning from homepage to dashboard or vice versa
    const isFromHomeToDashboard = previousPath === '/' && location.pathname !== '/';
    const isFromDashboardToHome = previousPath !== '/' && previousPath !== null && location.pathname === '/';
    
    if (location.pathname !== displayLocation.pathname && (isFromHomeToDashboard || isFromDashboardToHome)) {
      setIsTransitioning(true);

      // Start fade out
      const fadeOutTimer = setTimeout(() => {
        setDisplayLocation(location);
      }, 400); // Fade out duration

      // Complete fade in
      const fadeInTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 800); // Total transition time

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(fadeInTimer);
      };
    } else {
      // Instant update for other navigations
      setDisplayLocation(location);
      setIsTransitioning(false);
    }

    setPreviousPath(location.pathname);
  }, [location, displayLocation, previousPath]);

  return (
    <>
      {isTransitioning && (
        <div className="page-transition-overlay animate-fade-in" 
          style={{ 
            animation: 'fadeIn 0.4s ease-in-out forwards'
          }}
        />
      )}
      <div 
        className="transition-opacity duration-500"
        style={{ 
          opacity: isTransitioning ? 0 : 1 
        }}
      >
        {children}
      </div>
    </>
  );
};

