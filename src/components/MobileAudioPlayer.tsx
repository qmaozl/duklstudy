import React, { useEffect } from 'react';
import { useMediaPlayerContext } from '@/contexts/MediaPlayerContext';
import { X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileAudioPlayer() {
  const { 
    playerRef, 
    setIsPlaying, 
    currentVideo, 
    isLooping, 
    playlist, 
    currentIndex, 
    setCurrentIndex, 
    setCurrentVideo,
    setIsMinimized 
  } = useMediaPlayerContext();
  
  // Use refs to access latest values without causing re-renders
  const isLoopingRef = React.useRef(isLooping);
  const playlistRef = React.useRef(playlist);
  const currentIndexRef = React.useRef(currentIndex);
  
  // Setup Media Session API for background playback
  useEffect(() => {
    if ('mediaSession' in navigator && currentVideo && playlist.length > 0) {
      const currentVideoData = playlist[currentIndex];
      
      console.log('Mobile: Setting up Media Session for', currentVideoData?.title);
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentVideoData?.title || 'Playing Audio',
        artist: 'Dukl Study',
        album: 'Study Playlist',
        artwork: [
          { src: currentVideoData?.thumbnail || '/placeholder.svg', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        console.log('Mobile: Media Session play');
        playerRef.current?.playVideo();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('Mobile: Media Session pause');
        playerRef.current?.pauseVideo();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('Mobile: Media Session previous');
        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1;
          setCurrentIndex(prevIndex);
          setCurrentVideo(playlist[prevIndex].videoId);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('Mobile: Media Session next');
        if (currentIndex < playlist.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setCurrentVideo(playlist[nextIndex].videoId);
        } else if (playlist.length > 0) {
          setCurrentIndex(0);
          setCurrentVideo(playlist[0].videoId);
        }
      });
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
      }
    };
  }, [currentVideo, playlist, currentIndex, playerRef, setCurrentIndex, setCurrentVideo]);
  
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
        console.log('Mobile: YouTube API ready');
      };
    }
  }, []);

  useEffect(() => {
    if (!currentVideo) return;

    const handleVideoEnd = () => {
      console.log('Mobile: Video ended');
      if (isLoopingRef.current) {
        console.log('Mobile: Looping enabled, replaying');
        playerRef.current?.playVideo();
      } else if (playlistRef.current.length > 0) {
        console.log('Mobile: Playing next track');
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
        console.log('Mobile: Initializing YouTube player with video:', currentVideo);
        playerRef.current = new (window as any).YT.Player('mobile-youtube-player', {
          videoId: currentVideo,
          playerVars: {
            autoplay: 1,
            controls: 1, // Show controls on mobile
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1
          },
          events: {
            onReady: (event: any) => {
              console.log('Mobile: YouTube player ready');
              try {
                event.target.unMute?.();
                event.target.setVolume?.(100);
                event.target.playVideo();
              } catch (e) {
                console.warn('Mobile: YouTube onReady play failed', e);
              }
              setIsPlaying(true);
            },
            onStateChange: (event: any) => {
              const isPlayingNow = event.data === 1;
              console.log('Mobile: Player state changed', isPlayingNow ? 'playing' : 'paused');
              setIsPlaying(isPlayingNow);
              
              // Update Media Session playback state
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = isPlayingNow ? 'playing' : 'paused';
              }
              
              if (event.data === 0) handleVideoEnd();
            }
          }
        });
      } else if (playerRef.current?.loadVideoById) {
        console.log('Mobile: Loading new video:', currentVideo);
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
  }, [currentVideo, playerRef, setIsPlaying, setCurrentIndex, setCurrentVideo]);

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  if (!currentVideo) return null;

  // On mobile, show a visible player overlay at the bottom
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="flex items-center justify-between p-2 bg-muted/50">
        <span className="text-sm font-medium truncate flex-1">
          {playlist[currentIndex]?.title || 'Playing'}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
            className="h-8 w-8 p-0"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="w-full aspect-video max-h-[200px]">
        <div id="mobile-youtube-player" className="w-full h-full"></div>
      </div>
    </div>
  );
}
