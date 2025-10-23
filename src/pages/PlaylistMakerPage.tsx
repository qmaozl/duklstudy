import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const { isPlaying, playerRef } = useMediaPlayerContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

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
      let hasAudioData = false;
      
      if (analyserRef.current && dataArray && audioEnabled) {
        analyserRef.current.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
        // Check if we're getting real audio data
        const sum = dataArray.reduce((a, b) => a + b, 0);
        hasAudioData = sum > 0;
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
          if (dataArray && hasAudioData) {
            // Map point to frequency data
            const dataIndex = Math.floor((i / points) * dataArray.length);
            const freqValue = dataArray[dataIndex] / 255;
            
            // Use multiple frequency bands for richer visualization
            const lowFreq = dataArray[Math.floor(dataIndex * 0.5)] / 255;
            const midFreq = dataArray[dataIndex] / 255;
            const highFreq = dataArray[Math.min(Math.floor(dataIndex * 1.5), dataArray.length - 1)] / 255;
            
            // Combine frequencies with different weights
            intensity = 1 + (lowFreq * 0.8 + midFreq * 1.2 + highFreq * 0.6);
          } else {
            // No audio -> no movement
            intensity = 0;
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
        
        // Create glowing effect with more intensity based on audio
        const layerHue = (hue + layer * 30) % 360;
        let alpha = 0.3 - layer * 0.03;
        
        // Boost alpha when audio is present
        if (hasAudioData && dataArray) {
          const avgIntensity = dataArray.reduce((a, b) => a + b, 0) / (dataArray.length * 255);
          alpha += avgIntensity * 0.3;
        }
        
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

      // Draw center icon circle with audio-reactive pulse
      let centerRadius = 35;
      if (hasAudioData && dataArray) {
        const bassIntensity = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / (10 * 255);
        centerRadius = 35 + bassIntensity * 15;
      }
      
      ctx.beginPath();
      ctx.arc(200, 200, centerRadius, 0, Math.PI * 2);
      const iconGradient = ctx.createRadialGradient(200, 200, 0, 200, 200, centerRadius);
      iconGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.9)`);
      iconGradient.addColorStop(1, `hsla(${hue}, 80%, 40%, 0.7)`);
      ctx.fillStyle = iconGradient;
      ctx.fill();
      
      // Glow effect for center
      ctx.shadowBlur = hasAudioData ? 30 : 20;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Update animation parameters
      time += hasAudioData ? 0.05 : 0;
      hue = (hue + (hasAudioData ? 1 : 0)) % 360;

      animationRef.current = requestAnimationFrame(drawVisualizer);
    };

    drawVisualizer();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioEnabled]);

  // Initialize audio context and capture tab audio (includes YouTube audio)
  const enableTabAudioCapture = useCallback(async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Request tab/system audio via screen capture (user chooses "This Tab")
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true, // required by some browsers to allow audio capture
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(bufferLength));

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      mediaStreamRef.current = stream;
      sourceNodeRef.current = source;
      
      // If the user stops sharing, disable visualizer
      stream.getAudioTracks().forEach(track => {
        track.addEventListener('ended', () => {
          setAudioEnabled(false);
        });
      });
      
      setIsInitialized(true);
      setAudioEnabled(true);

      console.log('Tab audio capture enabled', { 
        sampleRate: audioContext.sampleRate,
        fftSize: analyser.fftSize,
        bufferLength
      });
    } catch (error) {
      console.error('Error enabling tab audio capture:', error);
      // no alerts, just fail silently and keep canvas static
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
        <div className="flex flex-col items-center gap-4 my-8">
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
