import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const PricingSection = () => {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-saas-charcoal mb-6 font-swiss">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-saas-gray font-light font-swiss">
            Everything you need to excel in your studies
          </p>
        </div>

        <div className="relative">          
          <div className="relative bg-white border border-saas-border rounded-3xl p-8 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-saas-charcoal mb-2">DUKL Pro</h3>
                <p className="text-saas-gray-medium">For serious students</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-saas-charcoal">HK$39</div>
                <div className="text-saas-gray-medium text-sm mt-1">/30 days</div>
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
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-saas-blue/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-saas-blue" />
                  </div>
                  <span className="text-saas-gray-dark">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              asChild 
              size="lg" 
              className="w-full bg-gradient-to-r from-saas-blue-dark to-saas-blue text-white font-semibold py-6 text-lg rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] transition-all"
            >
              <Link to="/auth">Get Started →</Link>
            </Button>

            <p className="text-center text-saas-gray-medium text-sm mt-6">
              No credit card required • One-time payment
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
