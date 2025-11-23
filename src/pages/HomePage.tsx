import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

import TypingAnimation from "@/components/TypingAnimation";
import { PricingSection } from "@/components/PricingSection";
import { BackgroundOrbs } from "@/components/BackgroundOrbs";
import { MountainSilhouette } from "@/components/MountainSilhouette";
import { StickyInputBar } from "@/components/StickyInputBar";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { FAQSection } from "@/components/FAQSection";

import { AsymmetricFeatureSection } from "@/components/AsymmetricFeatureSection";
import { OnboardingTour } from "@/components/OnboardingTour";

const HomePage = () => {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = "DUKL Study – Study Smarter, Not Just Harder";

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Parallax effect for hero background
    const handleParallax = () => {
      const scrolled = window.scrollY;
      const heroSection = document.querySelector('.circular-bleed-bg');
      if (heroSection) {
        const bgElement = heroSection as HTMLElement;
        bgElement.style.setProperty('--parallax-offset', `${scrolled * 0.5}px`);
      }
    };

    window.addEventListener('scroll', handleParallax, { passive: true });
    handleParallax(); // Initial call

    // Intersection Observer for fade-up animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            entry.target.classList.add('opacity-100', 'translate-y-0');
            
            // Add to visible sections if it has an id
            if (entry.target.id) {
              setVisibleSections((prev) => new Set(prev).add(entry.target.id));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    // Observe all elements with data-fade-up attribute
    const elements = document.querySelectorAll('[data-fade-up]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleParallax);
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundOrbs />
      <MountainSilhouette />
      <Navigation />
      <OnboardingTour />

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative pt-40 md:pt-48 pb-32 text-center px-6 circular-bleed-bg">
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            <h1 className="text-hero text-center font-swiss">
              Study Smarter, Not Just Harder.
            </h1>
            <p className="text-body-primary text-center max-w-2xl mx-auto font-swiss">
              Use Dukl to{' '}
              <TypingAnimation 
                phrases={[
                  "study with friends",
                  "listen to ad-free music",
                  "convert notes into quizzes"
                ]}
              />
            </p>
            <div className="pt-4">
              <Button 
                asChild 
                size="lg" 
                className="glow-button bg-gradient-to-r from-saas-blue-dark to-saas-blue text-white font-semibold px-10 py-6 text-lg rounded-xl"
              >
                <Link to="/dashboard">I want to lock in →</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Asymmetric Feature Section */}
        <section id="features">
          <AsymmetricFeatureSection />
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Pricing Section */}
        <section id="pricing">
          <PricingSection />
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* Bottom CTA */}
        <section className="text-center px-6 py-32 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-saas-charcoal mb-10 leading-tight font-swiss">
              Turn study anxiety into<br />confidence with Dukl.
            </h2>
            <Button 
              asChild 
              size="lg" 
              className="glow-button bg-gradient-to-r from-saas-blue-dark to-saas-blue text-white font-semibold px-10 py-6 text-lg rounded-xl"
            >
              <Link to="/dashboard">I want to lock in →</Link>
            </Button>
          </div>
        </section>
      </main>

      <StickyInputBar />
    </div>
  );
};

export default HomePage;
