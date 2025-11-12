import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const PricingSection = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-light text-white mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-white/70 font-light">
            Everything you need to excel in your studies
          </p>
        </div>

        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-3xl opacity-50" />
          
          <div className="relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">DUKL Pro</h3>
                <p className="text-white/60">For serious students</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-white">$9.99</div>
                <div className="text-white/60 text-sm mt-1">/month</div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Unlimited study sessions",
                "AI-powered study materials",
                "Advanced analytics & insights",
                "Priority support",
                "Ad-free experience",
                "Custom study playlists",
                "Collaborative study rooms",
                "Export your data anytime"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              asChild 
              size="lg" 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium py-6 text-lg"
            >
              <Link to="/auth">Get Started →</Link>
            </Button>

            <p className="text-center text-white/50 text-sm mt-6">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
