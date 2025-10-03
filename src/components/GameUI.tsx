import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useAuth } from '@/contexts/AuthContext';
import MacOSPopup from './MacOSPopup';
import StudyTimer from './StudyTimer';
import AITutor from '@/pages/AITutor';
import StudyMaterials from '@/pages/StudyMaterials';
import VideoSummarizer from '@/pages/VideoSummarizer';
import StudyHub from '@/pages/StudyHub';
import Calendar from '@/pages/Calendar';
import mapImage from '@/assets/game-map.png';

interface GameUIProps {
  onExit: () => void;
  onOpenFeature: (feature: string) => void;
}

const GameUI = ({ onExit, onOpenFeature }: GameUIProps) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const { profile } = useAuth();
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'game-container',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: preloadScene,
        create: createScene,
        update: updateScene,
      },
    };

    gameRef.current = new Phaser.Game(config);

    let player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    let wasd: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
    const featureZones: Array<{ zone: Phaser.GameObjects.Arc; name: string }> = [];
    let lastDirection = 'down';

    function preloadScene(this: Phaser.Scene) {
      // Load map image
      this.load.image('map', mapImage);
      // Note: Character sprites will need to be extracted from zip and loaded here
      // For now using placeholder colored box
    }

    function createScene(this: Phaser.Scene) {
      // Add map background (scaled to fit screen)
      const map = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'map');
      const scaleX = window.innerWidth / map.width;
      const scaleY = window.innerHeight / map.height;
      const scale = Math.max(scaleX, scaleY);
      map.setScale(scale);

      // Create player (will be replaced with sprite animations later)
      const playerColor = profile?.avatar_gender === 'female' ? 0xff69b4 : 0x6366f1;
      player = this.physics.add.sprite(window.innerWidth / 2, window.innerHeight / 2, '');
      player.setDisplaySize(32, 48);
      
      // Create simple player graphic for now
      const playerGraphics = this.add.graphics();
      playerGraphics.fillStyle(playerColor, 1);
      playerGraphics.fillRect(-16, -24, 32, 48);
      const playerTexture = playerGraphics.generateTexture('player', 32, 48);
      player.setTexture('player');
      playerGraphics.destroy();

      // Create feature zones as white outlined circles with semi-transparent background
      const features = [
        { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3, name: 'Study Timer' },
        { x: window.innerWidth * 0.8, y: window.innerHeight * 0.3, name: 'Study Materials' },
        { x: window.innerWidth * 0.2, y: window.innerHeight * 0.7, name: 'Video Summarizer' },
        { x: window.innerWidth * 0.8, y: window.innerHeight * 0.7, name: 'AI Tutor' },
        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, name: 'Study Hub' },
        { x: window.innerWidth * 0.65, y: window.innerHeight * 0.5, name: 'Calendar' },
      ];

      features.forEach((feature) => {
        // Create circle with white outline and semi-transparent white fill
        const zone = this.add.circle(feature.x, feature.y, 50, 0xffffff, 0.2);
        zone.setStrokeStyle(3, 0xffffff, 0.8);
        
        // Add label below the zone
        const text = this.add.text(feature.x, feature.y + 70, feature.name, {
          fontSize: '14px',
          color: '#ffffff',
          align: 'center',
          backgroundColor: '#000000',
          padding: { x: 8, y: 4 },
        });
        text.setOrigin(0.5);
        featureZones.push({ zone: zone as Phaser.GameObjects.Arc, name: feature.name });
      });

      // Setup input - both arrow keys and WASD
      cursors = this.input.keyboard!.createCursorKeys();
      wasd = {
        w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    function updateScene(this: Phaser.Scene) {
      const speed = 200;
      
      // Reset velocity
      player.setVelocity(0);

      // Movement with both arrow keys and WASD
      if (cursors.left.isDown || wasd.a.isDown) {
        player.setVelocityX(-speed);
        lastDirection = 'left';
      } else if (cursors.right.isDown || wasd.d.isDown) {
        player.setVelocityX(speed);
        lastDirection = 'right';
      }

      if (cursors.up.isDown || wasd.w.isDown) {
        player.setVelocityY(-speed);
        lastDirection = 'up';
      } else if (cursors.down.isDown || wasd.s.isDown) {
        player.setVelocityY(speed);
        lastDirection = 'down';
      }

      // Normalize diagonal movement
      if (player.body.velocity.x !== 0 && player.body.velocity.y !== 0) {
        player.setVelocity(player.body.velocity.x * 0.707, player.body.velocity.y * 0.707);
      }

      // Keep player in bounds
      player.x = Phaser.Math.Clamp(player.x, 20, window.innerWidth - 20);
      player.y = Phaser.Math.Clamp(player.y, 20, window.innerHeight - 20);

      // Check proximity to feature zones - immediate redirect
      featureZones.forEach(({ zone, name }) => {
        const distance = Phaser.Math.Distance.Between(player.x, player.y, zone.x, zone.y);
        if (distance < 60) {
          setActiveFeature(name);
        }
      });
    }

    // Handle window resize
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'Study Timer':
        return <StudyTimer />;
      case 'Study Materials':
        return <StudyMaterials />;
      case 'Video Summarizer':
        return <VideoSummarizer />;
      case 'AI Tutor':
        return <AITutor />;
      case 'Study Hub':
        return <StudyHub />;
      case 'Calendar':
        return <Calendar />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Phaser Game Canvas - Fullscreen */}
      <div id="game-container" className="w-full h-full" />

      {/* Mac OS Style Feature Popup */}
      {activeFeature && (
        <MacOSPopup onClose={() => setActiveFeature(null)}>
          {renderFeatureContent()}
        </MacOSPopup>
      )}
    </div>
  );
};

export default GameUI;
