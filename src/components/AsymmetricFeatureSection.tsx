import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Music, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Import feature screenshots
import playlistFeature from '@/assets/playlist-feature.png';
import flashFeature from '@/assets/flash-feature.png';

// Mock chat messages for glassmorphism overlay
const mockChatMessages = [
  { id: 1, user: 'Sarah', avatar: '👩', message: 'Just finished Chapter 3! 🎉', time: '2:34 PM' },
  { id: 2, user: 'Alex', avatar: '👨', message: 'Taking a 5 min break', time: '2:36 PM' },
  { id: 3, user: 'Maya', avatar: '👧', message: 'Who wants to do a study sprint?', time: '2:38 PM' },
];

const activeUsers = [
  { id: 1, name: 'Sarah', avatar: '👩', status: 'Studying' },
  { id: 2, name: 'Alex', avatar: '👨', status: 'On break' },
  { id: 3, name: 'Maya', avatar: '👧', status: 'Studying' },
  { id: 4, name: 'Josh', avatar: '👦', status: 'Studying' },
];

export const AsymmetricFeatureSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const viewportHeight = window.innerHeight;
        
        // Calculate scroll progress through the section
        // Range: -1 (before entering) to 1 (after leaving)
        const progress = (viewportHeight - sectionTop) / (viewportHeight + sectionHeight);
        setScrollY(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate parallax offsets based on scroll progress
  const getParallaxStyle = (speed: number) => {
    const offset = (scrollY - 0.5) * speed * 100;
    return {
      transform: `translateY(${-offset}px)`,
      transition: 'transform 0.1s ease-out'
    };
  };

  return (
    <section ref={sectionRef} className="py-32 font-swiss bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold text-saas-charcoal">
            Everything you need to excel
          </h2>
          <p className="text-lg text-saas-gray max-w-2xl mx-auto">
            Powerful tools designed to help you focus, collaborate, and achieve your goals.
          </p>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Large Blue Gradient Hero Card with Glassmorphism Chat */}
          <div className="lg:row-span-2" data-tour="study-rooms" style={getParallaxStyle(0.3)}>
            <div className="hero-feature-card group relative overflow-hidden rounded-3xl p-8 min-h-[600px] flex flex-col justify-between">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] opacity-90" />
              
              {/* Animated Orbs */}
              <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-20 left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />

              {/* Content */}
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-white mb-3">
                    Study Rooms
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed">
                    Join virtual study rooms with friends. Track time together, chat in real-time, and stay accountable.
                  </p>
                </div>

                {/* Active Users Preview */}
                <div className="glassmorphism-panel p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">Active Now</span>
                    <span className="text-xs text-white/80">{activeUsers.length} online</span>
                  </div>
                  <div className="flex -space-x-3">
                    {activeUsers.map((user) => (
                      <div
                        key={user.id}
                        className="relative"
                        title={`${user.name} - ${user.status}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg border-2 border-white/30">
                          {user.avatar}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white/50" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Glassmorphism Chat Overlay */}
              <div className="relative z-10 glassmorphism-panel p-5 space-y-3 max-w-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">Group Chat</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">Live</span>
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  {mockChatMessages.map((msg) => (
                    <div key={msg.id} className="animate-fade-in space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm">
                          {msg.avatar}
                        </div>
                        <span className="text-xs font-semibold text-white">{msg.user}</span>
                        <span className="text-xs text-white/60">{msg.time}</span>
                      </div>
                      <p className="text-sm text-white/95 ml-8">{msg.message}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    disabled
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="relative z-10 pt-4">
                <Button 
                  asChild
                  className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-6 py-5 text-base rounded-xl shadow-lg"
                >
                  <Link to="/study-hub">Join a Study Room →</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Grid of Smaller White Cards */}
          <div className="space-y-6">
            {/* Playlist Maker Card */}
            <div 
              className="feature-card relative overflow-hidden rounded-2xl border-2 border-border shadow-lg hover:shadow-2xl transition-all duration-300 group" 
              data-tour="playlist"
              style={getParallaxStyle(0.5)}
            >
              {/* Screenshot Background - Top Half */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={playlistFeature} 
                  alt="Playlist Maker" 
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
              </div>

              {/* Content with faded background */}
              <div className="relative bg-white p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-saas-charcoal">Playlist Maker</h3>
                </div>
                
                <p className="text-saas-gray leading-relaxed">
                  Build ad-free YouTube playlists. No interruptions, just focus music that keeps you in the zone.
                </p>

                <Button 
                  asChild
                  variant="outline"
                  className="w-full group-hover:bg-saas-blue group-hover:text-white transition-colors"
                >
                  <Link to="/playlist-maker">Create Playlist</Link>
                </Button>
              </div>
            </div>

            {/* Flashcards Card */}
            <div 
              className="feature-card relative overflow-hidden rounded-2xl border-2 border-border shadow-lg hover:shadow-2xl transition-all duration-300 group" 
              data-tour="flashcards"
              style={getParallaxStyle(0.7)}
            >
              {/* Screenshot Background - Top Half */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={flashFeature} 
                  alt="Smart Flashcards" 
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
              </div>

              {/* Content with faded background */}
              <div className="relative bg-white p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-saas-charcoal">Smart Flashcards</h3>
                </div>

                <p className="text-saas-gray leading-relaxed">
                  Transform notes into adaptive flashcards. AI-powered review system that learns your pace.
                </p>

                <Button 
                  asChild
                  variant="outline"
                  className="w-full group-hover:bg-saas-blue group-hover:text-white transition-colors"
                >
                  <Link to="/flashcards">Start Learning</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
