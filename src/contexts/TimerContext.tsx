import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useStudyGroupTimer } from '@/hooks/useStudyGroupTimer';

interface TimerContextType {
  timer: ReturnType<typeof useStudyGroupTimer>;
  groupId?: string;
  setGroupId: (id?: string) => void;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [groupId, setGroupId] = useState<string | undefined>();
  const [isMinimized, setIsMinimized] = useState(false);
  const timer = useStudyGroupTimer(groupId);

  return (
    <TimerContext.Provider value={{ timer, groupId, setGroupId, isMinimized, setIsMinimized }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within TimerProvider');
  }
  return context;
}