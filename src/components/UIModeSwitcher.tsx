import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';
import GameUI from './GameUI';
import AvatarSelector from './AvatarSelector';
import { toast } from '@/hooks/use-toast';

interface UIModeSwitcherProps {
  onFeatureOpen?: (feature: string) => void;
}

const UIModeSwitcher = ({ onFeatureOpen }: UIModeSwitcherProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [gameMode, setGameMode] = useState(false);

  useEffect(() => {
    if (profile) {
      setGameMode(profile.ui_mode === 'game');
      // Show avatar selector on first switch to game mode if not set
      if (profile.ui_mode === 'game' && !profile.avatar_gender) {
        setShowAvatarSelector(true);
      }
    }
  }, [profile]);

  const toggleUIMode = async () => {
    if (!user || !profile) return;

    const newMode = gameMode ? 'standard' : 'game';
    
    // If switching to game mode and no avatar selected, show selector
    if (newMode === 'game' && !profile.avatar_gender) {
      setShowAvatarSelector(true);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ ui_mode: newMode })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to switch UI mode.',
        variant: 'destructive',
      });
    } else {
      setGameMode(!gameMode);
      await refreshProfile();
      toast({
        title: gameMode ? 'Standard Mode' : 'Game Mode',
        description: gameMode
          ? 'Switched to standard interface.'
          : 'Welcome to the game world!',
      });
    }
  };

  const handleAvatarComplete = async () => {
    setShowAvatarSelector(false);
    await supabase
      .from('profiles')
      .update({ ui_mode: 'game' })
      .eq('user_id', user?.id);
    await refreshProfile();
    setGameMode(true);
  };

  const handleFeatureOpen = (feature: string) => {
    // Exit game mode to open feature
    setGameMode(false);
    if (onFeatureOpen) {
      onFeatureOpen(feature.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  return (
    <>
      {!gameMode && (
        <Button
          onClick={toggleUIMode}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Gamepad2 className="h-4 w-4" />
          Switch UI
        </Button>
      )}

      {showAvatarSelector && (
        <AvatarSelector onComplete={handleAvatarComplete} />
      )}

      {gameMode && profile?.avatar_gender && (
        <GameUI
          onExit={toggleUIMode}
          onOpenFeature={handleFeatureOpen}
        />
      )}
    </>
  );
};

export default UIModeSwitcher;
