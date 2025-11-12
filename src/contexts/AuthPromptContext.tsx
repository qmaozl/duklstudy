import React, { createContext, useContext, useState } from "react";
import { AuthPromptDialog } from "@/components/AuthPromptDialog";

interface AuthPromptContextType {
  showAuthPrompt: () => void;
}

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined);

export const AuthPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const showAuthPrompt = () => {
    setIsOpen(true);
  };

  return (
    <AuthPromptContext.Provider value={{ showAuthPrompt }}>
      {children}
      <AuthPromptDialog open={isOpen} onOpenChange={setIsOpen} />
    </AuthPromptContext.Provider>
  );
};

export const useAuthPrompt = () => {
  const context = useContext(AuthPromptContext);
  if (!context) {
    throw new Error("useAuthPrompt must be used within AuthPromptProvider");
  }
  return context;
};
