import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import timerShot from "@/assets/timer.png";

const HomePage = () => {
  useEffect(() => {
    document.title = "DUKL Study – The Ultimate Studying Platform";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur border-b border-white/10 bg-black/20">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="DUKL Study logo" className="h-8 w-8" />
            <span className="text-white text-xl font-extralight tracking-wide" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
              DUKL STUDY
            </span>
          </Link>
          <ul className="flex items-center gap-8 text-sm">
            <li><Link className="text-white/90 hover:text-white story-link" to="/">Home</Link></li>
            <li><Link className="text-white/90 hover:text-white story-link" to="/video-summarizer">summarize video</Link></li>
            <li><Link className="text-white/90 hover:text-white story-link" to="/dashboard">focus timer</Link></li>
          </ul>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative pt-28 pb-20 text-center px-6">
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6">
            The Ultimate Studying Platform
          </h1>
          <p className="max-w-3xl mx-auto text-white/80 text-lg md:text-xl font-extralight mb-10">
            Achieve your academic goals with Dukl's professional tools, designed to support your learning and improve your results.
          </p>
          <div className="mb-6">
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 px-8 py-7 text-lg">
              <Link to="/auth">I want to lock in→</Link>
            </Button>
          </div>
          <div className="text-white/60 tracking-widest text-xs">TRUSTED BY SIGMAS</div>
        </section>

        {/* Features with white section */}
        <section className="py-16" style={{ background: 'hsl(var(--white-bg))' }}>
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-4" style={{ color: 'hsl(0 0% 10%)' }}>Built for deep focus</h2>
              <p className="text-base leading-7 mb-6" style={{ color: 'hsl(0 0% 30%)' }}>
                Lock in with an immersive focus timer, generate summaries from videos, create flashcards, and test yourself with AI-crafted quizzes.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: 'hsl(0 0% 25%)' }}>
                <li>• AI video summarizer</li>
                <li>• Smart flashcards and quizzes</li>
                <li>• Animated focus environments</li>
              </ul>
            </div>
            <div className="rounded-xl overflow-hidden shadow-glow ring-1 ring-black/5">
              <img src={timerShot} alt="DUKL focus timer UI screenshot" className="w-full h-auto" loading="lazy" />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center px-6 py-20">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-8">
            Turn study anxiety into confidence with Dukl.
          </h2>
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 px-8 py-7 text-lg">
            <Link to="/auth">I want to lock in→</Link>
          </Button>
        </section>
      </main>
    </div>
  );
};

export default HomePage;