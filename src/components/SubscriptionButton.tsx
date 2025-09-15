import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Crown, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const SubscriptionButton = () => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (subscription?.subscribed) {
      navigate('/subscription');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generationsUsed = subscription?.generations_used || 0;
  const generationLimit = subscription?.generation_limit || 5;
  const isSubscribed = subscription?.subscribed || false;

  if (!user) {
    return (
      <Button 
        onClick={() => navigate('/auth')}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Crown className="h-4 w-4" />
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Generation Counter */}
      <div className="hidden sm:flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {generationsUsed}/{generationLimit}
        </span>
        <div className="w-16 bg-muted rounded-full h-1.5">
          <div 
            className="bg-primary rounded-full h-1.5 transition-all" 
            style={{ width: `${Math.min((generationsUsed / generationLimit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Subscription Button */}
      <Button 
        onClick={handleSubscribe}
        disabled={loading}
        variant={isSubscribed ? "secondary" : "default"}
        className={`flex items-center gap-2 ${!isSubscribed ? 'bg-primary hover:bg-primary/90' : ''}`}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <Crown className="h-4 w-4" />
        )}
        {isSubscribed ? 'Pro' : 'Upgrade'}
        {!isSubscribed && <ExternalLink className="h-4 w-4" />}
      </Button>
    </div>
  );
};