import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import roomShot from "@/assets/room-feature.png";
import playlistShot from "@/assets/playlist-feature.png";
import flashShot from "@/assets/flash-feature.png";

const HomePage = () => {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = "DUKL Study – The Ultimate Studying Platform";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-fade-up]').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero */}
      <main className="flex-1">
        <section className="relative pt-28 pb-20 text-center px-6">
          <h1 className="text-6xl md:text-8xl font-light text-white mb-8">
            The Ultimate Studying Platform
          </h1>
          <p className="max-w-3xl mx-auto text-white/80 text-xl md:text-2xl font-extralight mb-12 leading-relaxed">
            Achieve your academic goals with Dukl's professional tools, designed to support your learning and improve your results.
          </p>
          <div className="mb-8">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 px-10 py-8 text-xl font-medium">
              <Link to="/">I want to lock in→</Link>
            </Button>
          </div>
          <div className="text-white/60 tracking-widest text-sm">TRUSTED BY SIGMAS</div>
        </section>

        {/* Features with white section */}
        <section className="py-20" style={{ background: 'hsl(var(--white-bg))' }}>
          <div className="max-w-7xl mx-auto px-6 space-y-24">
            {/* Room Feature */}
            <div 
              id="room-feature"
              data-fade-up
              className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
                visibleSections.has('room-feature') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-semibold mb-6" style={{ color: 'hsl(0 0% 10%)' }}>Find Your Focus, Together.</h2>
                <p className="text-lg leading-8 mb-8" style={{ color: 'hsl(0 0% 30%)' }}>
                  Welcome to Dukl – where productivity meets friends.
                  Join a study room with friends, achieve your goals through the power of shared focus.
                </p>
                <ul className="space-y-3 text-base" style={{ color: 'hsl(0 0% 25%)' }}>
                  <li>• Track your time</li>
                  <li>• chat with peers</li>
                  <li>• build the discipline you need to succeed.</li>
                </ul>
              </div>
              <div className="max-w-lg mx-auto transform transition-transform duration-700 hover:scale-105">
                <div className="rounded-xl p-3 shadow-2xl" style={{ backgroundColor: '#1D1D2B' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img src={roomShot} alt="DUKL study room UI screenshot" className="w-full h-auto" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>

            {/* Playlist Feature */}
            <div 
              id="playlist-feature"
              data-fade-up
              className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
                visibleSections.has('playlist-feature') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="md:order-2">
                <h2 className="text-4xl md:text-5xl font-semibold mb-6" style={{ color: 'hsl(0 0% 10%)' }}>Never Break Focus Again.</h2>
                <p className="text-lg leading-8 mb-8" style={{ color: 'hsl(0 0% 30%)' }}>
                  The last tab you'll ever need for study music.
                  Our Playlist Maker solves this by bringing YouTube's vast audio library directly to your study environment.
                </p>
                <ul className="space-y-3 text-base" style={{ color: 'hsl(0 0% 25%)' }}>
                  <li>• Copy & Paste any YouTube music URL</li>
                  <li>• Build & Organize your ideal study sequence</li>
                  <li>• Press Play & Focus - control everything without leaving your workflow</li>
                </ul>
              </div>
              <div className="md:order-1 max-w-lg mx-auto transform transition-transform duration-700 hover:scale-105">
                <div className="rounded-xl p-3 shadow-2xl" style={{ backgroundColor: '#1D1D2B' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img src={playlistShot} alt="DUKL playlist maker UI screenshot" className="w-full h-auto" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>

            {/* Flashcards Feature */}
            <div 
              id="flash-feature"
              data-fade-up
              className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
                visibleSections.has('flash-feature') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-semibold mb-6" style={{ color: 'hsl(0 0% 10%)' }}>Transform Your Notes into Knowledge</h2>
                <p className="text-lg leading-8 mb-6" style={{ color: 'hsl(0 0% 30%)' }}>
                  Create. Review. Remember.
                </p>
                <p className="text-base leading-7" style={{ color: 'hsl(0 0% 25%)' }}>
                  Flashcards that adapt to your learning pace. Build your deck once, and let our smart system handle the rest.
                </p>
              </div>
              <div className="max-w-lg mx-auto transform transition-transform duration-700 hover:scale-105">
                <div className="rounded-xl p-3 shadow-2xl" style={{ backgroundColor: '#1D1D2B' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img src={flashShot} alt="DUKL flashcards UI screenshot" className="w-full h-auto" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center px-6 py-24">
          <h2 className="text-5xl md:text-6xl font-light text-white mb-10 leading-tight">
            Turn study anxiety into<br />confidence with Dukl.
          </h2>
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 px-10 py-8 text-xl font-medium">
            <Link to="/">I want to lock in→</Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

export default HomePage;