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
    let outTimer: number | undefined;
    let inTimer: number | undefined;

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
    outTimer = window.setTimeout(() => {
      // Switch the content after first half
      setDisplayLocation(location);
      // Phase 2: fade in new page while overlay fades out
      setPhase('in');
      inTimer = window.setTimeout(() => {
        setPhase('idle');
      }, DURATION);

      setPrevPath(location.pathname);
    }, DURATION);

    return () => {
      if (outTimer) clearTimeout(outTimer);
      if (inTimer) clearTimeout(inTimer);
    };
  }, [location, prevPath, displayLocation.pathname]);

  // Safety: never leave overlay stuck if timers are interrupted
  useEffect(() => {
    if (phase === 'idle') return;
    const watchdog = window.setTimeout(() => setPhase('idle'), DURATION * 3);
    return () => clearTimeout(watchdog);
  }, [phase]);

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


