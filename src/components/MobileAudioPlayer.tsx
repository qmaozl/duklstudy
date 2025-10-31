import React, { useEffect, useRef, useState } from 'react';
import { useMediaPlayerContext } from '@/contexts/MediaPlayerContext';

export function MobileAudioPlayer() {
  const { currentVideo, isPlaying, setIsPlaying, playlist, currentIndex, setCurrentIndex, setCurrentVideo, isLooping } = useMediaPlayerContext();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const sourceRef = useRef<MediaSource | null>(null);

  useEffect(() => {
    if (!currentVideo) return;

    const currentVideoData = playlist[currentIndex];
    console.log('Mobile player: Loading video', currentVideo);

    // For iOS Safari background playback, we need to use a direct audio stream
    // YouTube's iframe doesn't support background playback on iOS
    // We'll use YouTube's audio-only format
    const youtubeAudioUrl = `https://www.youtube.com/watch?v=${currentVideo}`;
    
    // Set the audio URL - this will be handled by YouTube's embed player in audio mode
    setAudioUrl(youtubeAudioUrl);

    // Set up Media Session API for background playback controls
    if ('mediaSession' in navigator && currentVideoData) {
      console.log('Setting up Media Session for', currentVideoData.title);
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentVideoData.title || 'Playing Audio',
        artist: 'Dukl Study',
        album: 'Study Playlist',
        artwork: [
          { src: currentVideoData.thumbnail || '/placeholder.svg', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        console.log('Media Session: play');
        audioRef.current?.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('Media Session: pause');
        audioRef.current?.pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('Media Session: previous');
        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1;
          setCurrentIndex(prevIndex);
          setCurrentVideo(playlist[prevIndex].videoId);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('Media Session: next');
        if (currentIndex < playlist.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setCurrentVideo(playlist[nextIndex].videoId);
        } else if (playlist.length > 0) {
          setCurrentIndex(0);
          setCurrentVideo(playlist[0].videoId);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(
            audioRef.current.duration, 
            audioRef.current.currentTime + 10
          );
        }
      });
    }
  }, [currentVideo, playlist, currentIndex]);

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    
    const audio = audioRef.current;
    console.log('Mobile player: Play state changed', isPlaying);
    
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Mobile player: Playback started successfully');
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'playing';
            }
          })
          .catch(err => {
            console.warn('Mobile player: Play failed', err);
            setIsPlaying(false);
          });
      }
    } else {
      audio.pause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [isPlaying, audioUrl]);

  const handleEnded = () => {
    console.log('Mobile player: Track ended');
    if (isLooping) {
      audioRef.current?.play();
    } else if (playlist.length > 0) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      setCurrentIndex(nextIndex);
      setCurrentVideo(playlist[nextIndex].videoId);
    }
  };

  const handlePlay = () => {
    console.log('Mobile player: Play event');
    setIsPlaying(true);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  };

  const handlePause = () => {
    console.log('Mobile player: Pause event');
    setIsPlaying(false);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Mobile player: Audio error', e);
  };

  const handleCanPlay = () => {
    console.log('Mobile player: Can play');
  };

  // For iOS Safari, we create an invisible iframe that embeds the YouTube video
  // This allows audio to continue playing in the background
  return (
    <>
      <iframe
        ref={(el) => {
          if (el && audioRef.current) {
            // Link the iframe to our audio controls
            audioRef.current = el as any;
          }
        }}
        src={audioUrl ? `https://www.youtube.com/embed/${currentVideo}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&playsinline=1&controls=0` : ''}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        style={{
          position: 'fixed',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          left: '-9999px'
        }}
        title="Background Audio Player"
      />
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        onError={handleError}
        onCanPlay={handleCanPlay}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
    </>
  );
}
