import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const checkGenerationLimit = async (): Promise<boolean> => {
  try {
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

    // Show remaining generations if low
    if (data?.remaining <= 2 && data?.remaining > 0) {
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