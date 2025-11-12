import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthPrompt } from '@/contexts/AuthPromptContext';

export const StickyInputBar = () => {
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAuthPrompt } = useAuthPrompt();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showAuthPrompt();
      return;
    }

    if (inputValue.trim()) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-saas-border rounded-full px-6 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-3 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="w-2 h-2 rounded-full bg-saas-blue animate-pulse" />
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask: [ ] to start studying..."
            className="flex-1 bg-transparent outline-none text-saas-gray placeholder:text-saas-gray-medium"
          />
        </div>
      </form>
    </div>
  );
};
