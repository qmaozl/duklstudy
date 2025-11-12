import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Crown, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const SubscriptionButton = () => {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Always redirect to subscription page for comparison
    navigate('/subscription');
  };

  const isSubscribed = subscription?.subscribed || false;
  const isPro = subscription?.subscription_tier === 'pro';

  if (!user) {
    return (
      <Button 
        onClick={() => navigate('/auth')}
        variant="ghost"
        className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 touch-manipulation min-h-[44px] min-w-[44px] relative z-50"
      >
        <Crown className="h-4 w-4" />
        Sign In
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleSubscribe}
      variant="ghost"
      className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 font-medium transition-all hover:scale-105 touch-manipulation min-h-[44px] min-w-[44px] relative z-50"
    >
      <Crown className="h-4 w-4" />
      {isPro ? 'Pro' : 'Upgrade'}
    </Button>
  );
};