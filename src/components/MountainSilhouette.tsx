import React from 'react';

export const MountainSilhouette = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[5]">
      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
        className="w-full h-48 md:h-64"
        style={{ opacity: 0.15 }}
      >
        <defs>
          <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" stopOpacity="1" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Low-poly mountain silhouette */}
        <polygon
          points="0,300 150,180 300,220 450,140 600,100 750,160 900,200 1050,150 1200,180 1200,300"
          fill="url(#mountainGradient)"
        />
        
        {/* Additional layer for depth */}
        <polygon
          points="0,300 200,240 400,200 600,220 800,240 1000,220 1200,240 1200,300"
          fill="#CBD5E1"
          opacity="0.04"
        />
      </svg>
    </div>
  );
};
