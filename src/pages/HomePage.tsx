import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import timerShot from "@/assets/timer.png";
import youtubeShot from "@/assets/youtube.png";

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
              <Link to="/auth">I want to lock in→</Link>
            </Button>
          </div>
          <div className="text-white/60 tracking-widest text-sm">TRUSTED BY SIGMAS</div>
        </section>

        {/* Features with white section */}
        <section className="py-20" style={{ background: 'hsl(var(--white-bg))' }}>
          <div className="max-w-7xl mx-auto px-6 space-y-24">
            {/* Timer Feature */}
            <div 
              id="timer-feature"
              data-fade-up
              className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
                visibleSections.has('timer-feature') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-semibold mb-6" style={{ color: 'hsl(0 0% 10%)' }}>Built for deep focus</h2>
                <p className="text-lg leading-8 mb-8" style={{ color: 'hsl(0 0% 30%)' }}>
                  Lock in with an immersive focus timer featuring animated environments. Choose from ocean waves, gentle rain, or pure white noise to create your perfect study atmosphere.
                </p>
                <ul className="space-y-3 text-base" style={{ color: 'hsl(0 0% 25%)' }}>
                  <li>• Animated focus environments (Ocean, Rain, White Noise)</li>
                  <li>• Study groups & collaborative timers</li>
                  <li>• Track your focus streaks & progress</li>
                </ul>
              </div>
              <div className="max-w-lg mx-auto transform transition-transform duration-700 hover:scale-105">
                <div className="bg-black rounded-xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img src={timerShot} alt="DUKL focus timer UI screenshot" className="w-full h-auto" loading="lazy" />
                  </div>
                </div>
              </div>
            </div>

            {/* YouTube AI Feature */}
            <div 
              id="youtube-feature"
              data-fade-up
              className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
                visibleSections.has('youtube-feature') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="md:order-2">
                <h2 className="text-4xl md:text-5xl font-semibold mb-6" style={{ color: 'hsl(0 0% 10%)' }}>AI-Powered YouTube Learning</h2>
                <p className="text-lg leading-8 mb-8" style={{ color: 'hsl(0 0% 30%)' }}>
                  Transform any YouTube video into comprehensive study materials. Our AI extracts transcripts, generates summaries, creates flashcards, and builds custom quizzes tailored to your learning needs.
                </p>
                <ul className="space-y-3 text-base" style={{ color: 'hsl(0 0% 25%)' }}>
                  <li>• Instant video summarization</li>
                  <li>• Auto-generated flashcards & quizzes</li>
                  <li>• Key concept extraction</li>
                  <li>• Smart YouTube video search</li>
                </ul>
              </div>
              <div className="md:order-1 max-w-lg mx-auto transform transition-transform duration-700 hover:scale-105">
                <div className="bg-black rounded-xl p-3 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <img src={youtubeShot} alt="DUKL AI YouTube summarizer UI screenshot" className="w-full h-auto" loading="lazy" />
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
            <Link to="/auth">I want to lock in→</Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

export default HomePage;