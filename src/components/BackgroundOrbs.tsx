import React from 'react';

interface Orb {
  id: string;
  color: string;
  size: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  opacity: string;
  blur: string;
}

const orbs: Orb[] = [
  {
    id: 'orb-1',
    color: 'rgba(59, 130, 246, 0.03)', // Blue
    size: '400px',
    position: { top: '10%', left: '10%' },
    opacity: '0.6',
    blur: '80px',
  },
  {
    id: 'orb-2',
    color: 'rgba(236, 72, 153, 0.02)', // Magenta
    size: '500px',
    position: { top: '20%', right: '15%' },
    opacity: '0.5',
    blur: '100px',
  },
  {
    id: 'orb-3',
    color: 'rgba(59, 130, 246, 0.025)',
    size: '350px',
    position: { bottom: '20%', left: '15%' },
    opacity: '0.7',
    blur: '90px',
  },
  {
    id: 'orb-4',
    color: 'rgba(236, 72, 153, 0.02)',
    size: '450px',
    position: { bottom: '30%', right: '10%' },
    opacity: '0.6',
    blur: '95px',
  },
];

export const BackgroundOrbs = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full animate-float"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: `blur(${orb.blur})`,
            opacity: orb.opacity,
            ...orb.position,
          }}
        />
      ))}
    </div>
  );
};
