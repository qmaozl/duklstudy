import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Users, Music, Brain, Check } from "lucide-react";

import TypingAnimation from "@/components/TypingAnimation";
import { PricingSection } from "@/components/PricingSection";
import { BackgroundOrbs } from "@/components/BackgroundOrbs";
import { MountainSilhouette } from "@/components/MountainSilhouette";
import { FeatureShowcaseCard } from "@/components/FeatureShowcaseCard";
import { StickyInputBar } from "@/components/StickyInputBar";

import roomShot from "@/assets/room-feature.png";
import playlistShot from "@/assets/playlist-feature.png";
import flashShot from "@/assets/flash-feature.png";

const HomePage = () => {
  useEffect(() => {
    document.title = "DUKL Study – Study Smarter, Not Just Harder";
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundOrbs />
      <MountainSilhouette />
      <Navigation />

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative pt-40 md:pt-48 pb-32 text-center px-6">
          <div className="max-w-4xl mx-auto space-y-8">
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
                className="bg-gradient-to-r from-saas-blue-dark to-saas-blue text-white font-semibold px-10 py-6 text-lg rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:scale-105 transition-all"
              >
                <Link to="/dashboard">I want to lock in →</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Showcase Section */}
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <FeatureShowcaseCard 
                icon={<Users className="w-5 h-5" />}
                label="Collaborative Focus"
                exampleText="Join study rooms with friends in real-time. Track your time, chat with peers, and build the discipline you need to succeed."
                screenshot={roomShot}
              />
              
              <FeatureShowcaseCard 
                icon={<Music className="w-5 h-5" />}
                label="Distraction-Free Audio"
                exampleText="Build playlists without leaving your workflow. Copy & paste any YouTube music URL and control everything from one place."
                screenshot={playlistShot}
              />
              
              <FeatureShowcaseCard 
                icon={<Brain className="w-5 h-5" />}
                label="AI-Powered Review"
                exampleText="Transform notes into adaptive flashcards. Build your deck once, and let our smart system handle the rest."
                screenshot={flashShot}
              />
              
              <FeatureShowcaseCard 
                icon={<Check className="w-5 h-5" />}
                label="Smart Learning"
                exampleText="AI-powered study materials that adapt to your learning pace. Get personalized quizzes, summaries, and study schedules."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Bottom CTA */}
        <section className="text-center px-6 py-32 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-saas-charcoal mb-10 leading-tight font-swiss">
              Turn study anxiety into<br />confidence with Dukl.
            </h2>
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-to-r from-saas-blue-dark to-saas-blue text-white font-semibold px-10 py-6 text-lg rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:scale-105 transition-all"
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
