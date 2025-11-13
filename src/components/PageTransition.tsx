import React, { useEffect, useState } from 'react';
import { useLocation, type Location } from 'react-router-dom';

interface PageTransitionProps {
  renderRoutes: (location: Location) => React.ReactNode;
}

export const PageTransition = ({ renderRoutes }: PageTransitionProps) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [prevPath, setPrevPath] = useState<string>(location.pathname);

  const DURATION = 500; // ms per half (fade-out, then fade-in)

  useEffect(() => {
    const isCrossingHomeBoundary =
      (prevPath === '/' && location.pathname !== '/') ||
      (prevPath !== '/' && location.pathname === '/');

    // No change or not our targeted transition: switch immediately
    if (location.pathname === displayLocation.pathname || !isCrossingHomeBoundary) {
      setDisplayLocation(location);
      setPhase('idle');
      setPrevPath(location.pathname);
      return;
    }

    // Phase 1: fade out current page with overlay fade-in
    setPhase('out');
    const outTimer = setTimeout(() => {
      // Switch the content after first half
      setDisplayLocation(location);
      // Phase 2: fade in new page while overlay fades out
      setPhase('in');
      const inTimer = setTimeout(() => {
        setPhase('idle');
      }, DURATION);

      setPrevPath(location.pathname);
      return () => clearTimeout(inTimer);
    }, DURATION);

    return () => clearTimeout(outTimer);
  }, [location, prevPath, displayLocation.pathname]);

  const overlayOpacity = phase === 'idle' ? 0 : phase === 'out' ? 1 : 0;
  const contentOpacity = phase === 'out' ? 0 : 1;

  return (
    <>
      {phase !== 'idle' && (
        <div
          className="page-transition-overlay"
          style={{ opacity: overlayOpacity, transition: `opacity ${DURATION}ms ease-in-out` }}
        />
      )}
      <div style={{ opacity: contentOpacity, transition: `opacity ${DURATION}ms ease-in-out` }}>
        {renderRoutes(displayLocation)}
      </div>
    </>
  );
};


