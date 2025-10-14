import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

interface MediaPlayerContextType {
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  currentVideo: string | null;
  setCurrentVideo: (url: string | null) => void;
  playerRef: React.MutableRefObject<any>;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  isLooping: boolean;
  setIsLooping: (val: boolean) => void;
  isShuffling: boolean;
  setIsShuffling: (val: boolean) => void;
  currentIndex: number;
  setCurrentIndex: (val: number) => void;
  playlist: any[];
  setPlaylist: (val: any[]) => void;
  currentVideoTitle: string;
  setCurrentVideoTitle: (val: string) => void;
  currentVideoThumbnail: string;
  setCurrentVideoThumbnail: (val: string) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
  const [currentVideoThumbnail, setCurrentVideoThumbnail] = useState('');
  const playerRef = useRef<any>(null);

  return (
    <MediaPlayerContext.Provider value={{ 
      isMinimized, 
      setIsMinimized, 
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
      setPlaylist,
      currentVideoTitle,
      setCurrentVideoTitle,
      currentVideoThumbnail,
      setCurrentVideoThumbnail
    }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayerContext() {
  const context = useContext(MediaPlayerContext);
  if (!context) {
    throw new Error('useMediaPlayerContext must be used within MediaPlayerProvider');
  }
  return context;
}