import React, { useEffect } from 'react';
import { useMediaPlayerContext } from '@/contexts/MediaPlayerContext';

export function GlobalYouTubePlayer() {
  const { playerRef, setIsPlaying, currentVideo, isLooping, playlist, currentIndex, setCurrentIndex, setCurrentVideo } = useMediaPlayerContext();

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
      if (isLooping) {
        playerRef.current?.playVideo();
      } else if (playlist.length > 0) {
        const nextIndex = (currentIndex + 1) % playlist.length;
        setCurrentIndex(nextIndex);
        setCurrentVideo(playlist[nextIndex].videoId);
        if (playerRef.current?.loadVideoById) {
          playerRef.current.loadVideoById(playlist[nextIndex].videoId);
          playerRef.current.playVideo();
        }
      }
    };

    const initPlayer = () => {
      if (!playerRef.current && (window as any).YT?.Player) {
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
              event.target.playVideo();
              setIsPlaying(true);
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === 1);
              if (event.data === 0) handleVideoEnd();
            }
          }
        });
      } else if (playerRef.current?.loadVideoById) {
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
  }, [currentVideo, isLooping, playlist, currentIndex]);

  return (
    <div className="fixed pointer-events-none opacity-0 w-px h-px overflow-hidden">
      <div id="global-youtube-player"></div>
    </div>
  );
}
