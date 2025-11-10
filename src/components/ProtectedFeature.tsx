import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthPrompt } from '@/contexts/AuthPromptContext';

interface ProtectedFeatureProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedFeature: React.FC<ProtectedFeatureProps> = ({ children, fallback }) => {
  const { user } = useAuth();
  const { showAuthPrompt } = useAuthPrompt();

  if (!user) {
    return (
      <div onClick={showAuthPrompt} className="cursor-pointer">
        {fallback || children}
      </div>
    );
  }

  return <>{children}</>;
};
