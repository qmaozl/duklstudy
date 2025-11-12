import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";

interface ProtectedFeatureProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ProtectedFeature: React.FC<ProtectedFeatureProps> = ({
  children,
  onClick,
  className,
}) => {
  const { user } = useAuth();
  const { showAuthPrompt } = useAuthPrompt();

  const handleClick = () => {
    if (!user) {
      showAuthPrompt();
      return;
    }
    onClick?.();
  };

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
};
