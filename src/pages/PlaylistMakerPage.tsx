import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import PlaylistMaker from '@/components/PlaylistMaker';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Music } from 'lucide-react';
import { useMediaPlayerContext } from '@/contexts/MediaPlayerContext';

const PlaylistMakerPage: React.FC = () => {
  const { user, loading } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationRef = useRef<number | null>(null);
  const { isPlaying } = useMediaPlayerContext();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    let time = 0;
    let hue = 0;

    const drawVisualizer = () => {
      if (!ctx) return;

      // Create smooth gradient background
      const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 200);
      gradient.addColorStop(0, `hsla(${hue}, 70%, 20%, 0.1)`);
      gradient.addColorStop(1, `hsla(${hue + 60}, 70%, 10%, 0.2)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Get audio data if available
      let dataArray = dataArrayRef.current;
      if (analyserRef.current && dataArray && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      // Draw multiple wave layers (MilkDrop style)
      const layers = 8;
      for (let layer = 0; layer < layers; layer++) {
        ctx.beginPath();
        const points = 120;
        const radius = 80 + layer * 15;
        
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Get audio intensity for this point
          let intensity = 1;
          if (dataArray && isPlaying) {
            const dataIndex = Math.floor((i / points) * dataArray.length);
            intensity = 1 + (dataArray[dataIndex] / 255) * 0.8;
          } else {
            // Idle animation when not playing
            intensity = 1 + Math.sin(time * 2 + i * 0.3 + layer * 0.5) * 0.15;
          }
          
          // Create wave distortion
          const wave1 = Math.sin(angle * 3 + time + layer * 0.3) * 8 * intensity;
          const wave2 = Math.cos(angle * 5 - time * 1.5 + layer * 0.2) * 5 * intensity;
          const wave3 = Math.sin(angle * 7 + time * 0.7) * 3 * intensity;
          
          const r = radius + wave1 + wave2 + wave3;
          const x = 200 + Math.cos(angle) * r;
          const y = 200 + Math.sin(angle) * r;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        
        // Create glowing effect
        const layerHue = (hue + layer * 30) % 360;
        const alpha = 0.3 - layer * 0.03;
        ctx.strokeStyle = `hsla(${layerHue}, 80%, 60%, ${alpha})`;
        ctx.lineWidth = 2 + (layers - layer) * 0.3;
        ctx.stroke();
        
        // Fill with gradient
        const fillGradient = ctx.createRadialGradient(200, 200, 0, 200, 200, radius);
        fillGradient.addColorStop(0, `hsla(${layerHue}, 70%, 50%, 0.05)`);
        fillGradient.addColorStop(1, `hsla(${layerHue}, 70%, 30%, 0.02)`);
        ctx.fillStyle = fillGradient;
        ctx.fill();
      }

      // Draw center icon circle
      ctx.beginPath();
      ctx.arc(200, 200, 35, 0, Math.PI * 2);
      const iconGradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 35);
      iconGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.9)`);
      iconGradient.addColorStop(1, `hsla(${hue}, 80%, 40%, 0.7)`);
      ctx.fillStyle = iconGradient;
      ctx.fill();
      
      // Glow effect for center
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Update animation parameters
      time += 0.03;
      hue = (hue + 0.5) % 360;

      animationRef.current = requestAnimationFrame(drawVisualizer);
    };

    drawVisualizer();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Initialize audio context when playing starts
  useEffect(() => {
    if (isPlaying && !isInitialized) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(new ArrayBuffer(bufferLength));

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    }
  }, [isPlaying, isInitialized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 px-4 py-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Playlist Maker</h1>
          <p className="text-muted-foreground">Create and manage your study music playlists</p>
        </div>

        {/* MilkDrop Visualizer */}
        <div className="flex justify-center my-8">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="rounded-full shadow-2xl border-2 border-primary/20"
              style={{ background: 'radial-gradient(circle, hsl(var(--background)) 0%, hsl(var(--background-dark)) 100%)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Music className="w-12 h-12 text-primary-foreground drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Playlist Maker Component */}
        <PlaylistMaker />
      </div>
    </DashboardLayout>
  );
};

export default PlaylistMakerPage;
