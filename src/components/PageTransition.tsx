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
      // Start fade out immediately
      setIsTransitioning(true);

      // Wait for fade out to complete, then switch content
      const switchContentTimer = setTimeout(() => {
        setDisplayLocation(location);
        // Start fade in after content switch
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 500); // Wait for fade out to complete

      return () => {
        clearTimeout(switchContentTimer);
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
      {/* Blue overlay that fades in/out */}
      <div 
        className="page-transition-overlay"
        style={{
          opacity: isTransitioning ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
      
      {/* Content that fades out/in */}
      <div 
        style={{ 
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}
      >
        {children}
      </div>
    </>
  );
};


