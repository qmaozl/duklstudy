import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar as CalendarIcon, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StudyStats {
  totalHoursThisMonth: number;
  averageSessionLength: number;
  totalSessions: number;
  longestStreak: number;
}

const DashboardOverview = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<StudyStats>({
    totalHoursThisMonth: 0,
    averageSessionLength: 0,
    totalSessions: 0,
    longestStreak: 0,
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
      // Get current month's start date
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

      // Fetch this month's sessions
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('duration_minutes, date')
        .eq('user_id', user.id)
        .gte('date', firstDayStr)
        .order('date', { ascending: true });

      if (error) throw error;

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('study_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      if (sessions) {
        const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
        const totalHours = totalMinutes / 60;
        const avgMinutes = sessions.length > 0 ? totalMinutes / sessions.length : 0;

        setStats({
          totalHoursThisMonth: Math.round(totalHours * 10) / 10,
          averageSessionLength: Math.round(avgMinutes),
          totalSessions: sessions.length,
          longestStreak: streakData?.longest_streak || 0,
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Hours (This Month)</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? '...' : `${stats.totalHoursThisMonth}h`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep up the great work!
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Session</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? '...' : `${stats.averageSessionLength} min`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per study session
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? '...' : stats.totalSessions}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? '...' : `${stats.longestStreak} days`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Personal best
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use the sidebar to navigate to different features or start a study session with the Focus Timer.
                </p>
              </CardContent>
            </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOverview;
