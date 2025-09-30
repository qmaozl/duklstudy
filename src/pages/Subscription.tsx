import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Crown, Zap, Star, ArrowLeft, ExternalLink } from 'lucide-react';

const Subscription = () => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle success/cancel redirects from Stripe
    if (searchParams.get('success')) {
      toast({
        title: "Subscription successful!",
        description: "Welcome to Dukl Pro! Your subscription is now active.",
      });
    }
    if (searchParams.get('canceled')) {
      toast({
        title: "Subscription canceled",
        description: "You can upgrade to Pro anytime from this page.",
        variant: "destructive"
      });
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth');
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

  const handleManageSubscription = async () => {
    if (!user) return;

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const freeFeatures = [
    "5 AI generations total",
    "Basic study materials",
    "Simple quiz generation",
    "Basic flashcards",
    "Limited video processing"
  ];

  const proFeatures = [
    "1,500+ AI generations per month",
    "Advanced study analytics",
    "Unlimited quiz generation",
    "Interactive flashcards with spaced repetition",
    "Unlimited video processing",
    "Priority AI processing",
    "Advanced personalization",
    "Custom study paths",
    "Export study materials",
    "Email support"
  ];

  const generationsUsed = subscription?.generations_used || 0;
  const generationLimit = subscription?.generation_limit || 5;
  const isSubscribed = subscription?.subscribed || false;
  const isPro = subscription?.subscription_tier === 'pro';

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Choose Your Dukl Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upgrade to Dukl Pro and unlock unlimited AI-powered study tools
          </p>
        </div>

        {/* Current Usage */}
        {user && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                {isSubscribed ? 'Pro Status' : 'Current Usage'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              {isPro ? (
                <>
                  <div className="text-2xl font-bold">Unlimited Generations</div>
                  <div className="text-sm text-muted-foreground">Enjoy unlimited AI generations with Dukl Pro</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {generationsUsed} / {generationLimit}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    AI generations remaining
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all" 
                      style={{ width: `${Math.min((generationsUsed / generationLimit) * 100, 100)}%` }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Tier */}
          <Card className={`relative ${!isSubscribed ? 'ring-2 ring-primary' : ''}`}>
            {!isSubscribed && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                Current Plan
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for trying out Dukl</CardDescription>
              <div className="text-4xl font-bold">$0</div>
              <div className="text-sm text-muted-foreground">Forever free</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              {isSubscribed && (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className={`relative ${isSubscribed ? 'ring-2 ring-primary' : ''}`}>
            {isSubscribed && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                Current Plan
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                Dukl Pro
              </CardTitle>
              <CardDescription>Unlimited learning potential</CardDescription>
              <div className="text-4xl font-bold">$4.99</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {!isSubscribed ? (
                <Button 
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Upgrade to Pro
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" disabled>
                    <Star className="h-4 w-4 mr-2" />
                    Current Plan
                  </Button>
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    variant="secondary"
                    className="w-full"
                  >
                    {portalLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                        Loading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Manage Subscription
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens to my generations each month?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pro subscribers get 1,500 fresh AI generations every month. Unused generations don't roll over, 
                  but with 1,500 per month, you'll have more than enough for intensive studying!
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can cancel your subscription at any time through the customer portal. 
                  You'll continue to have Pro access until the end of your current billing period.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What counts as an AI generation?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Each AI generation includes creating study materials, generating quizzes, 
                  processing videos, creating flashcards, or getting AI tutor responses. 
                  Pro users get 1,500+ per month!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;