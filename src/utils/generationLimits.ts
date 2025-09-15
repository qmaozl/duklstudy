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
          title: "Generation Limit Reached",
          description: "You've reached your generation limit. Upgrade to Dukl Pro for 1,500+ generations per month!",
          variant: "destructive"
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