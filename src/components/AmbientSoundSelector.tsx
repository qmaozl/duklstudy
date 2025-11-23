import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AmbientSound {
  id: string;
  name: string;
  url: string;
  icon: string;
}

const ambientSounds: AmbientSound[] = [
  {
    id: 'ocean',
    name: 'Ocean Waves',
    url: '/audio/ocean-waves.wav',
    icon: '🌊'
  },
  {
    id: 'rain',
    name: 'Rain',
    url: '/audio/rain.wav',
    icon: '🌧️'
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    url: '/audio/white-noise.wav',
    icon: '📻'
  }
];

export const AmbientSoundSelector = () => {
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handleSoundSelect = (soundId: string) => {
    if (selectedSound === soundId) {
      // Stop current sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setSelectedSound(null);
    } else {
      // Play new sound
      const sound = ambientSounds.find(s => s.id === soundId);
      if (sound && audioRef.current) {
        audioRef.current.src = sound.url;
        audioRef.current.volume = isMuted ? 0 : volume / 100;
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.error('Audio play failed:', e));
      }
      setSelectedSound(soundId);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🎵 Ambient Sounds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {ambientSounds.map(sound => (
            <Button
              key={sound.id}
              variant={selectedSound === sound.id ? "default" : "outline"}
              onClick={() => handleSoundSelect(sound.id)}
              className="h-auto py-3 px-2 flex flex-col items-center gap-2"
            >
              <span className="text-2xl">{sound.icon}</span>
              <span className="text-xs">{sound.name}</span>
            </Button>
          ))}
        </div>

        {selectedSound && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-8 w-8 p-0"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Click a sound to play. Click again to stop.
        </p>
      </CardContent>
    </Card>
  );
};
