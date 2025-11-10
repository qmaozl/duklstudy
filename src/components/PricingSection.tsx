import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/subscription');
    } else {
      navigate('/auth');
    }
  };

  const features = [
    "1,500+ AI generations per month",
    "Advanced study analytics",
    "Unlimited quiz generation",
    "Interactive flashcards with spaced repetition",
    "AI-powered note summarization",
    "Custom study schedules",
    "Priority support",
    "Ad-free experience"
  ];

  return (
    <section 
      id="pricing"
      className="py-24 px-6"
      style={{ background: 'hsl(var(--white-bg))' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge 
            variant="outline" 
            className="mb-4 border-primary/30 text-primary px-4 py-1.5 text-sm font-medium"
          >
            Pricing
          </Badge>
          <h2 
            className="text-5xl md:text-6xl font-bold mb-6 font-swiss"
            style={{ color: 'hsl(0 0% 10%)' }}
          >
            Unlock Your Full Potential
          </h2>
          <p 
            className="text-xl max-w-2xl mx-auto font-swiss"
            style={{ color: 'hsl(0 0% 40%)' }}
          >
            Get unlimited access to all premium features and supercharge your study sessions.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            
            <CardHeader className="relative text-center pb-8 pt-10">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4 animate-pulse">
                <Crown className="w-8 h-8 text-white" />
              </div>
              
              <CardTitle className="text-3xl font-bold mb-2 font-swiss">
                DUKL Pro
              </CardTitle>
              
              <CardDescription className="text-lg font-swiss">
                Everything you need to excel
              </CardDescription>

              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span 
                    className="text-5xl font-bold font-swiss"
                    style={{ color: 'hsl(0 0% 10%)' }}
                  >
                    $10
                  </span>
                  <span 
                    className="text-xl font-medium font-swiss"
                    style={{ color: 'hsl(0 0% 40%)' }}
                  >
                    / month
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-swiss">
                  Billed monthly • Cancel anytime
                </p>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-8 pb-10">
              {/* Features List */}
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                    </div>
                    <span 
                      className="text-base font-swiss"
                      style={{ color: 'hsl(0 0% 20%)' }}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                size="lg"
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold text-lg h-14 shadow-lg hover:shadow-xl transition-all duration-300 font-swiss"
                onClick={handleGetStarted}
              >
                <Zap className="w-5 h-5 mr-2" />
                Get Started Now
              </Button>

              <p className="text-center text-sm text-muted-foreground font-swiss">
                ✨ Start your 7-day free trial today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground font-swiss">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
