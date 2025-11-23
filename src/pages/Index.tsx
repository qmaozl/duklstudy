import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Gift, Sparkles, Loader2, Zap, Users, Music, Clock, TrendingUp, Calendar as CalendarIcon, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import UserProfile from '@/components/UserProfile';
import FeatureCards from '@/components/FeatureCards';
import { AdBanner } from '@/components/AdBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface StudyStats {
  totalHoursThisMonth: number;
  averageSessionLength: number;
  totalSessions: number;
  todayHours: number;
  weekTotal: number;
  weekAverage: number;
}

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [isActivatingPromo, setIsActivatingPromo] = useState(false);
  const [stats, setStats] = useState<StudyStats>({
    totalHoursThisMonth: 0,
    averageSessionLength: 0,
    totalSessions: 0,
    todayHours: 0,
    weekTotal: 0,
    weekAverage: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudyStats();
    }
  }, [user]);

  const fetchStudyStats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // This month's sessions
      const { data: monthSessions, error } = await supabase
        .from('study_sessions')
        .select('duration_minutes, date')
        .eq('user_id', user.id)
        .gte('date', firstDayStr);

      if (error) throw error;

      // Today's sessions
      const { data: todaySessions } = await supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .eq('date', todayStr);

      const todayTotal = (todaySessions || []).reduce((sum, s) => sum + s.duration_minutes, 0) / 60;

      // Week sessions
      const { data: weekSessions } = await supabase
        .from('study_sessions')
        .select('duration_minutes, date')
        .eq('user_id', user.id)
        .gte('date', weekAgoStr);

      // Calculate stats
      if (monthSessions) {
        const totalMinutes = monthSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
        const totalHours = totalMinutes / 60;
        const avgMinutes = monthSessions.length > 0 ? totalMinutes / monthSessions.length : 0;

        const weekTotal = (weekSessions || []).reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
        const weekAvg = weekSessions && weekSessions.length > 0 ? weekTotal / 7 : 0;

        setStats({
          totalHoursThisMonth: Math.round(totalHours * 10) / 10,
          averageSessionLength: Math.round(avgMinutes),
          totalSessions: monthSessions.length,
          todayHours: Math.round(todayTotal * 10) / 10,
          weekTotal: Math.round(weekTotal * 10) / 10,
          weekAverage: Math.round(weekAvg * 10) / 10,
        });
      }
    } catch (error) {
      console.error('Error fetching study stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

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

  const activatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code.",
        variant: "destructive",
      });
      return;
    }

    setIsActivatingPromo(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('activate-promo-code', {
        body: { promo_code: promoCode.trim() }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success! 🎉",
          description: data.message,
        });
        setPromoCode('');
        // Refresh the page to update subscription status
        window.location.reload();
      } else {
        toast({
          title: "Invalid Promo Code",
          description: data.error || "The promo code you entered is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error activating promo code:', error);
      toast({
        title: "Error",
        description: "Failed to activate promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsActivatingPromo(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Top Banner Ad */}
        <div className="flex justify-center">
          <AdBanner format="horizontal" />
        </div>

        {/* Hero Section - What do you want to do today? */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">What do you want to do today?</h1>
                <p className="text-muted-foreground text-lg">Choose your path to productivity</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {/* Start Focus Session - Primary CTA */}
                <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5" onClick={() => navigate('/focus-timer')}>
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="h-12 w-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">Start Focus Session</h3>
                    <p className="text-sm text-muted-foreground">Solo study with ambient sounds</p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Study Stats Overview */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">Your Study Progress</h2>
            <p className="text-muted-foreground">Track your learning journey at a glance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingStats ? '...' : `${stats.todayHours}h`}</div>
                <p className="text-xs text-muted-foreground">Study time today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingStats ? '...' : `${stats.weekTotal}h`}</div>
                <p className="text-xs text-muted-foreground">Avg {stats.weekAverage}h/day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingStats ? '...' : `${stats.totalHoursThisMonth}h`}</div>
                <p className="text-xs text-muted-foreground">{stats.totalSessions} sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingStats ? '...' : `${stats.averageSessionLength}m`}</div>
                <p className="text-xs text-muted-foreground">Average length</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

                {/* Join Study Group */}
                <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-border" onClick={() => navigate('/study-group')}>
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="h-12 w-12 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg">Join Study Group</h3>
                    <p className="text-sm text-muted-foreground">Study with friends for accountability</p>
                  </CardContent>
                </Card>

                {/* Create Playlist */}
                <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-border" onClick={() => navigate('/playlist-maker')}>
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="h-12 w-12 mx-auto rounded-full bg-secondary/20 flex items-center justify-center">
                      <Music className="h-6 w-6 text-secondary" />
                    </div>
                    <h3 className="font-semibold text-lg">Create Playlist</h3>
                    <p className="text-sm text-muted-foreground">Ad-free study music</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Profile with Leveling System */}
        <div className="max-w-2xl mx-auto">
          <UserProfile />
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

        {/* Promotional Code Section */}
        <Card className="border-2 border-dashed border-primary/20 max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-primary">
              <Gift className="h-5 w-5" />
              Have a Promo Code?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                disabled={isActivatingPromo}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && activatePromoCode()}
              />
              <Button 
                onClick={activatePromoCode}
                disabled={isActivatingPromo || !promoCode.trim()}
                className="gap-2 whitespace-nowrap"
                variant="secondary"
              >
                {isActivatingPromo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isActivatingPromo ? 'Activating...' : 'Activate Code'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Unlock premium features with valid promo codes
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
