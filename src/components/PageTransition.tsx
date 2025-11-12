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

      // Start transition
      const transitionTimer = setTimeout(() => {
        setDisplayLocation(location);
      }, 200); // Half of transition duration

      // End transition
      const endTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 400);

      return () => {
        clearTimeout(transitionTimer);
        clearTimeout(endTimer);
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
        <div className="page-transition-overlay slide-in" />
      )}
      <div className={isTransitioning ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}>
        {children}
      </div>
    </>
  );
};
