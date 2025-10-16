import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TimerProvider, useTimerContext } from "@/contexts/TimerContext";
import { MediaPlayerProvider, useMediaPlayerContext } from "@/contexts/MediaPlayerContext";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import DashboardOverview from "./pages/DashboardOverview";
import FocusTimer from "./pages/FocusTimer";
import Auth from "./pages/Auth";

import VideoSummarizer from "./pages/VideoSummarizer";
import StudyHub from "./pages/StudyHub";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";

import MemorisePro from "./pages/MemorisePro";
import MemoriseReview from "./pages/MemoriseReview";
import CustomParagraphNew from "./pages/CustomParagraphNew";
import CustomParagraphReview from "./pages/CustomParagraphReview";
import Flashcards from "./pages/Flashcards";
import FlashcardStudy from "./pages/FlashcardStudy";
import NotFound from "./pages/NotFound";
import { FloatingTimer } from "./components/FloatingTimer";
import { FloatingMediaPlayer } from "./components/FloatingMediaPlayer";
import { GlobalYouTubePlayer } from "./components/GlobalYouTubePlayer";
import { useNavigate } from "react-router-dom";

function RedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectPath = sessionStorage.redirect;
    if (redirectPath && redirectPath !== '/') {
      delete sessionStorage.redirect;
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  return null;
}

function FloatingComponents() {
  const location = useLocation();
  const navigate = useNavigate();
  const { timer, isMinimized, setIsMinimized } = useTimerContext();
  const { 
    isMinimized: mediaMinimized, 
    setIsMinimized: setMediaMinimized, 
    currentVideo,
    setCurrentVideo,
    playerRef,
    isPlaying,
    setIsPlaying,
    isLooping,
    setIsLooping,
    isShuffling,
    setIsShuffling,
    currentIndex,
    setCurrentIndex,
    playlist,
    currentVideoTitle
  } = useMediaPlayerContext();

  const isOnFocusTimer = location.pathname === '/focus-timer';

  const handlePlayPause = () => {
    if (timer.state === 'running') {
      timer.pause();
    } else {
      timer.start();
    }
  };

  const handleMediaPlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo?.();
    } else {
      try {
        playerRef.current.unMute?.();
        playerRef.current.setVolume?.(100);
      } catch {}
      playerRef.current.playVideo?.();
    }
  };

  const handleMediaNext = () => {
    if (playlist.length === 0) return;
    let nextIndex: number;
    if (isShuffling) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    setCurrentIndex(nextIndex);
    setCurrentVideo(playlist[nextIndex].videoId);
    if (playerRef.current) {
      playerRef.current.loadVideoById(playlist[nextIndex].videoId);
      try {
        playerRef.current.unMute?.();
        playerRef.current.setVolume?.(100);
      } catch {}
      playerRef.current.playVideo?.();
    }
  };

  const handleMediaPrevious = () => {
    if (playlist.length === 0 || currentIndex <= 0) return;
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentVideo(playlist[prevIndex].videoId);
    if (playerRef.current) {
      playerRef.current.loadVideoById(playlist[prevIndex].videoId);
      try {
        playerRef.current.unMute?.();
        playerRef.current.setVolume?.(100);
      } catch {}
      playerRef.current.playVideo?.();
    }
  };

  const handleMediaMaximize = () => {
    setMediaMinimized(false);
    navigate('/focus-timer');
  };

  const handleMediaClose = () => {
    if (playerRef.current) {
      playerRef.current.stopVideo();
    }
    setCurrentVideo(null);
    setMediaMinimized(false);
    setIsPlaying(false);
  };

  return (
    <>
      {/* Floating Timer */}
      {isMinimized && !isOnFocusTimer && timer.seconds > 0 && (
        <FloatingTimer
          seconds={timer.seconds}
          state={timer.state}
          formattedTime={timer.formattedTime}
          onPlayPause={handlePlayPause}
          onStop={timer.stop}
          onExpand={() => {
            setIsMinimized(false);
            navigate('/focus-timer');
          }}
          onClose={() => setIsMinimized(false)}
        />
      )}

      {/* Floating Media Player */}
      {mediaMinimized && currentVideo && (
        <FloatingMediaPlayer
          isPlaying={isPlaying}
          isLooping={isLooping}
          isShuffling={isShuffling}
          currentIndex={currentIndex}
          playlistLength={playlist.length}
          currentVideoTitle={currentVideoTitle}
          onTogglePlay={handleMediaPlayPause}
          onNext={handleMediaNext}
          onPrevious={handleMediaPrevious}
          onMaximize={handleMediaMaximize}
          onClose={handleMediaClose}
          onToggleLoop={() => setIsLooping(!isLooping)}
          onToggleShuffle={() => setIsShuffling(!isShuffling)}
        />
      )}
    </>
  );
}

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TimerProvider>
          <MediaPlayerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <RedirectHandler />
                <GlobalYouTubePlayer />
                <FloatingComponents />
                <Routes>
                  {/* Landing page at root */}
                  <Route path="/" element={<HomePage />} />
                  
                  {/* Dashboard at /dashboard */}
                  <Route path="/dashboard" element={<DashboardOverview />} />
                  
                  {/* Redirect old /home to landing page */}
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  
                  {/* Keep all other routes the same */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/focus-timer" element={<FocusTimer />} />
                  <Route path="/video-summarizer" element={<VideoSummarizer />} />
                  <Route path="/study-hub" element={<StudyHub />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/memorise-pro" element={<MemorisePro />} />
                  <Route path="/memorise-pro/review/:textKey" element={<MemoriseReview />} />
                  <Route path="/memorise-pro/custom-new" element={<CustomParagraphNew />} />
                  <Route path="/memorise-pro/custom-review/:id" element={<CustomParagraphReview />} />
                  <Route path="/flashcards" element={<Flashcards />} />
                  <Route path="/flashcards/study/:setId" element={<FlashcardStudy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </MediaPlayerProvider>
        </TimerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
