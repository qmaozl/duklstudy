import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Play, Users, Brain, Clock, Zap, Music, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const ambientSounds = [
    { id: 'ocean', label: 'Ocean Waves', icon: '🌊' },
    { id: 'rain', label: 'Rain', icon: '🌧️' },
    { id: 'whitenoise', label: 'White Noise', icon: '📻' },
  ];

  const quickActions = [
    {
      title: 'Study Rooms',
      description: 'Join others studying live',
      icon: Users,
      path: '/study-group',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Playlist Maker',
      description: 'Create focus playlists',
      icon: Music,
      path: '/playlist-maker',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Flashcards',
      description: 'Review and memorize',
      icon: Brain,
      path: '/flashcards',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Hero Section - Start Focus Session */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
              Ready to Lock In? 🚀
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start a focus session and get in the zone with ambient sounds
            </p>
          </div>

          {/* Primary CTA Button */}
          <Button
            onClick={() => navigate('/focus-timer')}
            size="lg"
            className="h-16 px-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Zap className="mr-2 h-6 w-6" />
            Start Focus Session
          </Button>

          {/* Quick Ambient Sound Preview */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Choose your vibe:</span>
            {ambientSounds.map((sound) => (
              <span key={sound.id} className="flex items-center gap-1">
                <span>{sound.icon}</span>
                <span>{sound.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats Preview - Minimal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Focus Time</p>
                <p className="text-2xl font-bold">0h 0m</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">0 days</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Secondary CTA */}
        <div className="text-center space-y-4 pt-8">
          <p className="text-muted-foreground">
            Want to track your progress and unlock achievements?
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/settings')}
          >
            View Full Profile
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
