import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Crown, Zap, Star, ExternalLink } from 'lucide-react';

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
        title: "Payment successful!",
        description: "Welcome to Dukl Pro! Your 30-day access is now active.",
      });
    }
    if (searchParams.get('canceled')) {
      toast({
        title: "Payment canceled",
        description: "You can purchase Dukl Pro anytime from this page.",
        variant: "destructive"
      });
    }
  }, [searchParams]);

  const handleOneTimePayment = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-one-time-payment');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating one-time payment:', error);
      toast({
        title: "Error",
        description: "Failed to start payment process. Please try again.",
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
      
      if (error) {
        console.error('Customer portal error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('Customer portal error details:', data.technical_details || data.error);
        throw new Error(data.error);
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to open subscription management. Please try again.";
      toast({
        title: "Stripe Configuration Issue",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setPortalLoading(false);
    }
  };

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
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Dukl Pro - 30 Days Access
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get unlimited AI-powered study tools for 30 days
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

        {/* Single Pricing Card */}
        <div className="max-w-md mx-auto">
          <Card className={`relative ${isSubscribed ? 'ring-2 ring-primary' : ''}`}>
            {isSubscribed && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                Active
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                Dukl Pro
              </CardTitle>
              <CardDescription>30 days of unlimited learning</CardDescription>
              <div className="text-4xl font-bold">HK$39</div>
              <div className="text-sm text-muted-foreground">One-time payment</div>
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
                <div className="space-y-2">
                  <Button 
                    onClick={handleOneTimePayment}
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
                        Get 30 Days Access
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Supports Alipay and Card payments • Manual renewal required after 30 days
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" disabled>
                    <Star className="h-4 w-4 mr-2" />
                    Active Plan
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
                <CardTitle className="text-lg">How does the 30-day access work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  After payment, you get instant access to all Pro features for 30 days. 
                  You'll need to manually purchase again after the 30 days if you want to continue using Pro features.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods are supported?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We support both Alipay and credit/debit cards for your convenience. 
                  Choose your preferred payment method during checkout.
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
    </DashboardLayout>
  );
};

export default Subscription;
