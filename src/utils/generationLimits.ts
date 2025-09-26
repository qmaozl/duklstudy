import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const checkGenerationLimit = async (): Promise<boolean> => {
  try {
    // Get user session to ensure user is authenticated
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData?.session) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to continue.",
        variant: "destructive"
      });
      return false;
    }

    // 1) Short-circuit for Dukl Pro users based on current subscription status
    const { data: subInfo } = await supabase.functions.invoke('check-subscription');
    const isPro = (subInfo?.subscription_tier === 'pro') || subInfo?.generation_limit === null;
    const isSubscribed = !!subInfo?.subscribed;
    if (isSubscribed && isPro) {
      return true; // Pro users have unlimited generations
    }

    // 2) Fallback to server-enforced counter for free users
    const { data, error } = await supabase.functions.invoke('increment-generation');
    
    if (error) {
      console.error('Error checking generation limit:', error);
      toast({
        title: "Error",
        description: "Failed to check generation limit. Please try again.",
        variant: "destructive"
      });
      return false;
    }

    if (data?.error) {
      // Double-check subscription to avoid false negatives
      const { data: subInfo2 } = await supabase.functions.invoke('check-subscription');
      const proNow = (subInfo2?.subscription_tier === 'pro') || subInfo2?.generation_limit === null;
      if (subInfo2?.subscribed && proNow) {
        return true;
      }

      if (data.error === "Generation limit exceeded") {
        toast({
          title: "🚫 Free Tier Limit Reached",
          description: "You've used all 5 free generations! Upgrade to Dukl Pro for unlimited generations and premium features.",
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100"
        });
        // Redirect to subscription page
        setTimeout(() => {
          window.location.href = '/subscription';
        }, 2000);
        return false;
      }
      
      toast({
        title: "Error",
        description: data.error,
        variant: "destructive"
      });
      return false;
    }

    // Show remaining generations if low (free tier only)
    if (typeof data?.remaining === 'number' && data.remaining <= 2 && data.remaining > 0) {
      toast({
        title: "Generation Limit Warning",
        description: `Only ${data.remaining} generations remaining. Consider upgrading to Dukl Pro!`
      });
    }

    return true;
  } catch (error) {
    console.error('Error in checkGenerationLimit:', error);
    toast({
      title: "Error",
      description: "Failed to check generation limit. Please try again.",
      variant: "destructive"
    });
    return false;
  }
};