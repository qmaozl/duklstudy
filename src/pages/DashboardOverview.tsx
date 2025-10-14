import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [sessions, setSessions] = useState<any[]>([]);
  const [weekStats, setWeekStats] = useState({ total: 0, average: 0 });

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

      // Get week start (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // Fetch all sessions
      const { data: allSessions, error: allError } = await supabase
        .from('study_sessions')
        .select('duration_minutes, date, subject')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (allError) throw allError;

      // Fetch this month's sessions
      const { data: monthSessions, error } = await supabase
        .from('study_sessions')
        .select('duration_minutes, date')
        .eq('user_id', user.id)
        .gte('date', firstDayStr)
        .order('date', { ascending: true });

      if (error) throw error;

      // Fetch week sessions
      const { data: weekSessions } = await supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('date', weekAgoStr);

      // Fetch streak data
      const { data: streakData } = await supabase
        .from('study_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      if (monthSessions) {
        const totalMinutes = monthSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
        const totalHours = totalMinutes / 60;
        const avgMinutes = monthSessions.length > 0 ? totalMinutes / monthSessions.length : 0;

        setStats({
          totalHoursThisMonth: Math.round(totalHours * 10) / 10,
          averageSessionLength: Math.round(avgMinutes),
          totalSessions: monthSessions.length,
          longestStreak: streakData?.longest_streak || 0,
        });
      }

      // Calculate week stats
      if (weekSessions) {
        const weekTotal = weekSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
        const weekAvg = weekSessions.length > 0 ? weekTotal / 7 : 0;
        setWeekStats({
          total: Math.round(weekTotal * 10) / 10,
          average: Math.round(weekAvg * 10) / 10
        });
      }

      // Set all sessions for display
      setSessions(allSessions || []);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? '...' : `${stats.totalHoursThisMonth}h`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? '...' : `${weekStats.total}h`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg {weekStats.average}h/day
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
            </div>

            {/* Study Sessions Log */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Study Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {loadingStats ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No study sessions yet. Start studying to see your progress!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.slice(0, 20).map((session, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="text-sm font-medium">{session.subject || 'General Study'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{session.duration_minutes} min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOverview;
