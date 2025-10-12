import React, { useEffect } from 'react';
import { useMediaPlayerContext } from '@/contexts/MediaPlayerContext';

export function GlobalYouTubePlayer() {
  const { playerRef, setIsPlaying, currentVideo, isLooping, playlist, currentIndex, setCurrentIndex, setCurrentVideo } = useMediaPlayerContext();
  
  // Use refs to access latest values without causing re-renders
  const isLoopingRef = React.useRef(isLooping);
  const playlistRef = React.useRef(playlist);
  const currentIndexRef = React.useRef(currentIndex);
  
  React.useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);
  
  React.useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);
  
  React.useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    // Load YouTube API
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        console.log('YouTube API ready');
      };
    }
  }, []);

  useEffect(() => {
    if (!currentVideo) return;

    const handleVideoEnd = () => {
      if (isLoopingRef.current) {
        playerRef.current?.playVideo();
      } else if (playlistRef.current.length > 0) {
        const nextIndex = (currentIndexRef.current + 1) % playlistRef.current.length;
        setCurrentIndex(nextIndex);
        setCurrentVideo(playlistRef.current[nextIndex].videoId);
        if (playerRef.current?.loadVideoById) {
          playerRef.current.loadVideoById(playlistRef.current[nextIndex].videoId);
          playerRef.current.playVideo();
        }
      }
    };

    const initPlayer = () => {
      if (!playerRef.current && (window as any).YT?.Player) {
        console.log('Initializing YouTube player with video:', currentVideo);
        playerRef.current = new (window as any).YT.Player('global-youtube-player', {
          videoId: currentVideo,
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready');
              try {
                event.target.unMute?.();
                event.target.setVolume?.(100);
                event.target.playVideo();
              } catch (e) {
                console.warn('YouTube onReady play failed', e);
              }
              setIsPlaying(true);
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === 1);
              if (event.data === 0) handleVideoEnd();
            }
          }
        });
      } else if (playerRef.current?.loadVideoById) {
        console.log('Loading new video:', currentVideo);
        playerRef.current.loadVideoById(currentVideo);
        playerRef.current.playVideo();
      }
    };

    if (!(window as any).YT?.Player) {
      const interval = setInterval(() => {
        if ((window as any).YT?.Player) {
          clearInterval(interval);
          initPlayer();
        }
      }, 200);
      return () => clearInterval(interval);
    } else {
      initPlayer();
    }
  }, [currentVideo]);

  return (
    <div className="fixed pointer-events-none opacity-0 w-px h-px overflow-hidden">
      <div id="global-youtube-player"></div>
    </div>
  );
}
