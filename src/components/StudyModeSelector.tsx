import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Waves, Cloud, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StudyMode = 'ocean' | 'rain' | 'whitenoise';

interface StudyModeSelectorProps {
  selectedMode: StudyMode;
  onModeSelect: (mode: StudyMode) => void;
}

const StudyModeSelector = ({ selectedMode, onModeSelect }: StudyModeSelectorProps) => {
  const modes = [
    {
      id: 'ocean' as StudyMode,
      name: 'Ocean Waves',
      icon: Waves,
      description: 'Calm sea sounds',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      id: 'rain' as StudyMode,
      name: 'Rain',
      icon: Cloud,
      description: 'Gentle rainfall',
      gradient: 'from-slate-400 to-slate-600'
    },
    {
      id: 'whitenoise' as StudyMode,
      name: 'White Noise',
      icon: Volume2,
      description: 'Pure focus',
      gradient: 'from-neutral-300 to-neutral-500'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Choose Your Study Environment</h3>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <Card
              key={mode.id}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:scale-105",
                isSelected 
                  ? "ring-2 ring-primary shadow-lg" 
                  : "hover:shadow-md"
              )}
              onClick={() => onModeSelect(mode.id)}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-gradient-to-br",
                  mode.gradient,
                  isSelected ? "scale-110" : ""
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">{mode.name}</p>
                  <p className="text-xs text-muted-foreground">{mode.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StudyModeSelector;