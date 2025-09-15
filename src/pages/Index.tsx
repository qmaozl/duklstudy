import React from 'react';
import { Navigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/UserProfile';
import StudyTimer from '@/components/StudyTimer';
import FeatureCards from '@/components/FeatureCards';

const Index = () => {
  const { user, loading } = useAuth();

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

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex items-center justify-center gap-3">
            <Brain className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-primary bg-clip-text text-transparent">
              Dukl
            </h1>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 inline-block">
            <p className="text-primary font-medium text-sm md:text-base">
              Dukl, your gamify study partner
            </p>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column - User Profile */}
          <div className="lg:col-span-1">
            <UserProfile />
          </div>

          {/* Middle Column - Study Timer */}
          <div className="lg:col-span-1">
            <StudyTimer />
          </div>

          {/* Right Column - Quick Stats or Additional Info */}
          <div className="lg:col-span-1">
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                <h3 className="text-lg font-semibold mb-2">Ready to Learn?</h3>
                <p className="text-sm text-muted-foreground">
                  Choose one of the study tools below to get started with AI-powered learning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">AI-Powered Study Tools</h2>
            <p className="text-muted-foreground">
              Transform your learning experience with these intelligent study aids
            </p>
          </div>
          <FeatureCards />
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>© 2024 Dukl - Powered by AI for smarter learning</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
