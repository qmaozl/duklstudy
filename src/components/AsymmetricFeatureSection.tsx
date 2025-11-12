import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Music, BookOpen, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Import feature screenshots
import roomFeature from '@/assets/room-feature.png';
import playlistFeature from '@/assets/playlist-feature.png';
import flashFeature from '@/assets/flash-feature.png';
import timerFeature from '@/assets/timer-2.png';

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
  return (
    <section className="py-32 font-swiss bg-white">
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
          {/* Left: Large Study Rooms Card with Screenshot */}
          <div className="lg:row-span-2" data-tour="study-rooms">
            <div className="hero-feature-card group relative overflow-hidden rounded-3xl h-full min-h-[600px] flex flex-col">
              {/* Screenshot Background */}
              <div className="absolute inset-0">
                <img 
                  src={roomFeature} 
                  alt="Study Rooms" 
                  className="w-full h-full object-cover object-center"
                />
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 mt-auto p-8 space-y-4">
                {/* Text with backdrop blur */}
                <div className="space-y-3 bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold text-white">
                    Study Rooms
                  </h3>
                  <p className="text-lg text-white/95 leading-relaxed">
                    Join virtual study rooms with friends. Track time together, chat in real-time, and stay accountable.
                  </p>
                  <Button 
                    asChild
                    className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-6 py-3 text-base rounded-xl shadow-lg w-full sm:w-auto"
                  >
                    <Link to="/study-hub">Join a Study Room →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Grid of Smaller White Cards */}
          <div className="space-y-6">
            {/* Playlist Maker Card */}
            <div className="feature-card relative overflow-hidden rounded-2xl border-2 border-border shadow-lg hover:shadow-2xl transition-all duration-300 group" data-tour="playlist">
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
            <div className="feature-card relative overflow-hidden rounded-2xl border-2 border-border shadow-lg hover:shadow-2xl transition-all duration-300 group" data-tour="flashcards">
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

          {/* Bottom Right: Timer Card */}
          <div className="feature-card relative overflow-hidden rounded-2xl border-2 border-border shadow-lg hover:shadow-2xl transition-all duration-300 group">
            {/* Screenshot Background - Top Half */}
            <div className="relative h-48 overflow-hidden">
              <img 
                src={timerFeature} 
                alt="Focus Timer" 
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
            </div>

            {/* Content with faded background */}
            <div className="relative bg-white p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-saas-charcoal">Focus Timer</h3>
              </div>

              <p className="text-saas-gray leading-relaxed">
                Pomodoro technique with ambient sounds. Track sessions and build consistent study habits.
              </p>

              <Button 
                asChild
                variant="outline"
                className="w-full group-hover:bg-saas-blue group-hover:text-white transition-colors"
              >
                <Link to="/focus-timer">Start Timer</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
