import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface GameUIProps {
  onExit: () => void;
  onOpenFeature: (feature: string) => void;
}

const GameUI = ({ onExit, onOpenFeature }: GameUIProps) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const [nearFeature, setNearFeature] = useState<string | null>(null);

  useEffect(() => {
    if (!gameRef.current || game) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: {
        create: createScene,
        update: updateScene,
      },
      backgroundColor: '#2d3561',
    };

    const newGame = new Phaser.Game(config);
    setGame(newGame);

    let player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    const features = new Map<string, Phaser.GameObjects.Rectangle>();

    function createScene(this: Phaser.Scene) {
      // Create pixel art style map
      const graphics = this.add.graphics();
      graphics.fillStyle(0x1a1f3a, 1);
      graphics.fillRect(0, 0, 800, 600);

      // Draw grid
      graphics.lineStyle(1, 0x3d4466, 0.3);
      for (let i = 0; i < 800; i += 40) {
        graphics.lineBetween(i, 0, i, 600);
      }
      for (let i = 0; i < 600; i += 40) {
        graphics.lineBetween(0, i, 800, i);
      }

      // Create player (pixel art style)
      const playerColor = profile?.avatar_gender === 'female' ? 0xff69b4 : 0x4169e1;
      player = this.physics.add.sprite(400, 300, '');
      player.setDisplaySize(32, 32);
      const playerGraphics = this.add.graphics();
      playerGraphics.fillStyle(playerColor, 1);
      playerGraphics.fillRect(-16, -16, 32, 32);
      const playerTexture = playerGraphics.generateTexture('player', 32, 32);
      player.setTexture('player');
      playerGraphics.destroy();

      // Create feature zones
      const featureData = [
        { name: 'Timer', x: 200, y: 150, color: 0x00ff00 },
        { name: 'Study Materials', x: 600, y: 150, color: 0x00ffff },
        { name: 'Calendar', x: 200, y: 450, color: 0xffff00 },
        { name: 'Study Groups', x: 600, y: 450, color: 0xff00ff },
        { name: 'Friends', x: 400, y: 300, color: 0xffa500 },
      ];

      featureData.forEach(({ name, x, y, color }) => {
        const zone = this.add.rectangle(x, y, 80, 80, color, 0.3);
        zone.setStrokeStyle(2, color);
        features.set(name, zone);

        // Add label
        this.add.text(x, y, name, {
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5);
      });

      cursors = this.input.keyboard!.createCursorKeys();
    }

    function updateScene(this: Phaser.Scene) {
      if (!player || !cursors) return;

      const speed = 160;
      player.setVelocity(0);

      if (cursors.left?.isDown) {
        player.setVelocityX(-speed);
      } else if (cursors.right?.isDown) {
        player.setVelocityX(speed);
      }

      if (cursors.up?.isDown) {
        player.setVelocityY(-speed);
      } else if (cursors.down?.isDown) {
        player.setVelocityY(speed);
      }

      // Check proximity to features
      let foundFeature: string | null = null;
      features.forEach((zone, name) => {
        const distance = Phaser.Math.Distance.Between(
          player.x,
          player.y,
          zone.x,
          zone.y
        );
        if (distance < 60) {
          foundFeature = name;
        }
      });

      setNearFeature(foundFeature);
    }

    return () => {
      newGame.destroy(true);
    };
  }, [profile?.avatar_gender]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Top Bar */}
      <div className="h-16 bg-card border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-2xl">
            {profile?.avatar_gender === 'female' ? '👩‍🎓' : '👨‍🎓'}
          </div>
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden w-48">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                style={{
                  width: `${((profile?.points || 0) % 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Level {profile?.level || 1} • {profile?.points || 0} XP
            </p>
          </div>
        </div>
        <Button onClick={onExit} variant="outline" size="sm">
          <X className="h-4 w-4 mr-2" />
          Exit Game Mode
        </Button>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="relative">
          <div ref={gameRef} className="rounded-lg overflow-hidden shadow-2xl border-4 border-primary/20" />
          <p className="text-center mt-4 text-sm text-muted-foreground">
            Use arrow keys to move • Walk near zones to interact
          </p>
        </div>
      </div>

      {/* Feature Popup */}
      {nearFeature && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border rounded-lg p-4 shadow-xl animate-fade-in">
          <p className="text-sm mb-2">Press to open:</p>
          <Button
            onClick={() => onOpenFeature(nearFeature)}
            className="w-full"
            size="lg"
          >
            Open {nearFeature}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GameUI;
