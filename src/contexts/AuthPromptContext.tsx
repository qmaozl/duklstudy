import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';

interface AuthPromptContextType {
  showAuthPrompt: () => void;
}

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined);

export const AuthPromptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  const showAuthPrompt = () => {
    setOpen(true);
  };

  return (
    <AuthPromptContext.Provider value={{ showAuthPrompt }}>
      {children}
      <AuthPromptDialog open={open} onOpenChange={setOpen} />
    </AuthPromptContext.Provider>
  );
};

export const useAuthPrompt = () => {
  const context = useContext(AuthPromptContext);
  if (!context) {
    throw new Error('useAuthPrompt must be used within AuthPromptProvider');
  }
  return context;
};
