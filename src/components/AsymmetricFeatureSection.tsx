import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Music, BookOpen, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
          {/* Left: Large Blue Gradient Hero Card with Glassmorphism Chat */}
          <div className="lg:row-span-2" data-tour="study-rooms">
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
            <Card className="feature-card group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-saas-blue/20" data-tour="playlist">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-saas-charcoal">Playlist Maker</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-saas-gray leading-relaxed">
                  Build ad-free YouTube playlists. No interruptions, just focus music that keeps you in the zone.
                </p>
                
                {/* Mini Preview */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-purple-200 flex items-center justify-center text-xs">🎵</div>
                    <div className="flex-1 min-w-0">
                      <div className="h-2 bg-purple-300 rounded w-3/4 mb-1" />
                      <div className="h-1.5 bg-purple-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-pink-200 flex items-center justify-center text-xs">🎧</div>
                    <div className="flex-1 min-w-0">
                      <div className="h-2 bg-pink-300 rounded w-2/3 mb-1" />
                      <div className="h-1.5 bg-pink-200 rounded w-1/3" />
                    </div>
                  </div>
                </div>

                <Button 
                  asChild
                  variant="outline"
                  className="w-full group-hover:bg-saas-blue group-hover:text-white transition-colors"
                >
                  <Link to="/playlist-maker">Create Playlist</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Flashcards Card */}
            <Card className="feature-card group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-saas-blue/20" data-tour="flashcards">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-saas-charcoal">Smart Flashcards</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-saas-gray leading-relaxed">
                  Transform notes into adaptive flashcards. AI-powered review system that learns your pace.
                </p>

                {/* Flashcard Preview */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 transform rotate-2 transition-transform group-hover:rotate-0">
                    <div className="text-center space-y-3">
                      <div className="text-xs font-semibold text-emerald-600 uppercase">Question</div>
                      <div className="h-2 bg-emerald-300 rounded w-3/4 mx-auto mb-2" />
                      <div className="h-2 bg-emerald-200 rounded w-1/2 mx-auto" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border-2 border-teal-200 -z-10 -rotate-2" />
                </div>

                <Button 
                  asChild
                  variant="outline"
                  className="w-full group-hover:bg-saas-blue group-hover:text-white transition-colors"
                >
                  <Link to="/flashcards">Start Learning</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Right: Timer Card */}
          <Card className="feature-card group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-saas-blue/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-saas-charcoal">Focus Timer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-saas-gray leading-relaxed">
                Pomodoro technique with ambient sounds. Track sessions and build consistent study habits.
              </p>

              {/* Timer Preview */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 text-center">
                <div className="text-5xl font-bold text-orange-600 mb-2">25:00</div>
                <div className="text-sm text-orange-700 font-medium">Focus Session</div>
                <div className="flex justify-center gap-1 mt-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  <div className="w-2 h-2 bg-orange-300 rounded-full" />
                  <div className="w-2 h-2 bg-orange-200 rounded-full" />
                  <div className="w-2 h-2 bg-orange-100 rounded-full" />
                </div>
              </div>

              <Button 
                asChild
                variant="outline"
                className="w-full group-hover:bg-saas-blue group-hover:text-white transition-colors"
              >
                <Link to="/focus-timer">Start Timer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
