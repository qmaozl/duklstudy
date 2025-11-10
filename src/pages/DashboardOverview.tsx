import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthPrompt } from '@/contexts/AuthPromptContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Calendar as CalendarIcon, TrendingUp, Target, BookOpen, Edit2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import studyImg from '@/assets/study.jpg';
import playlistImg from '@/assets/playlist.jpg';
import planImg from '@/assets/plan.jpg';
import cardsImg from '@/assets/cards.jpg';

interface StudyStats {
  totalHoursThisMonth: number;
  averageSessionLength: number;
  totalSessions: number;
  longestStreak: number;
}

interface SubjectStats {
  subject: string;
  hours: number;
  sessions: number;
}

interface Goal {
  id: string;
  goal_type: 'daily' | 'weekly' | 'monthly';
  target_hours: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const DashboardOverview = () => {
  const { user, loading } = useAuth();
  const { showAuthPrompt } = useAuthPrompt();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudyStats>({
    totalHoursThisMonth: 0,
    averageSessionLength: 0,
    totalSessions: 0,
    longestStreak: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  const featureBlocks = [
    {
      title: 'Study Group',
      subtitle: 'study with friends!',
      image: studyImg,
      path: '/focus-timer',
    },
    {
      title: 'Create Your Study Playlist',
      subtitle: 'listen to ad-free music',
      image: playlistImg,
      path: '/playlist-maker',
    },
    {
      title: 'AI Calendar',
      subtitle: 'have AI plan your study sessions!',
      image: planImg,
      path: '/calendar',
    },
    {
      title: 'Flashcards',
      subtitle: 'Create sleek and simple flashcards for memorising',
      image: cardsImg,
      path: '/flashcards',
    },
  ];
  const [weekStats, setWeekStats] = useState({ total: 0, average: 0 });
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingGoal, setEditingGoal] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [todayHours, setTodayHours] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStudyStats();
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('study_goals')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    setGoals((data || []) as Goal[]);
  };

  const updateGoal = async (goalType: 'daily' | 'weekly' | 'monthly', targetHours: number) => {
    if (!user) return;

    const existingGoal = goals.find(g => g.goal_type === goalType);

    if (existingGoal) {
      const { error } = await supabase
        .from('study_goals')
        .update({ target_hours: targetHours })
        .eq('id', existingGoal.id);

      if (error) {
        toast.error('Failed to update goal');
        return;
      }
    } else {
      const { error } = await supabase
        .from('study_goals')
        .insert({ user_id: user.id, goal_type: goalType, target_hours: targetHours });

      if (error) {
        toast.error('Failed to create goal');
        return;
      }
    }

    toast.success('Goal updated successfully');
    fetchGoals();
    setEditingGoal(null);
    setGoalInput('');
  };

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

      // Fetch all sessions
      const { data: allSessions, error: allError } = await supabase
        .from('study_sessions')
        .select('duration_minutes, date, subject')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (allError) throw allError;

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
      setTodayHours(Math.round(todayTotal * 10) / 10);

      // Week sessions
      const { data: weekSessions } = await supabase
        .from('study_sessions')
        .select('duration_minutes, date')
        .eq('user_id', user.id)
        .gte('date', weekAgoStr);

      // Streak data
      const { data: streakData } = await supabase
        .from('study_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .single();

      // Calculate stats
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

      // Week stats
      if (weekSessions) {
        const weekTotal = weekSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
        const weekAvg = weekSessions.length > 0 ? weekTotal / 7 : 0;
        setWeekStats({
          total: Math.round(weekTotal * 10) / 10,
          average: Math.round(weekAvg * 10) / 10
        });

        // Weekly trend
        const trendMap = new Map();
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          trendMap.set(dateStr, { date: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: 0 });
        }

        weekSessions.forEach(s => {
          if (trendMap.has(s.date)) {
            const entry = trendMap.get(s.date);
            entry.hours += s.duration_minutes / 60;
          }
        });

        setWeeklyTrend(Array.from(trendMap.values()).map(v => ({ ...v, hours: Math.round(v.hours * 10) / 10 })));
      }

      // Subject stats
      if (allSessions) {
        const subjectMap = new Map<string, { hours: number; sessions: number }>();
        
        allSessions.forEach(s => {
          const subject = s.subject || 'General Study';
          const current = subjectMap.get(subject) || { hours: 0, sessions: 0 };
          current.hours += s.duration_minutes / 60;
          current.sessions += 1;
          subjectMap.set(subject, current);
        });

        const subjectArray = Array.from(subjectMap.entries())
          .map(([subject, data]) => ({
            subject,
            hours: Math.round(data.hours * 10) / 10,
            sessions: data.sessions
          }))
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 6);

        setSubjectStats(subjectArray);
      }

      setSessions(allSessions || []);
    } catch (error) {
      console.error('Error fetching study stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const getGoalProgress = (goalType: 'daily' | 'weekly' | 'monthly') => {
    const goal = goals.find(g => g.goal_type === goalType);
    if (!goal) return null;

    let current = 0;
    if (goalType === 'daily') current = todayHours;
    else if (goalType === 'weekly') current = weekStats.total;
    else current = stats.totalHoursThisMonth;

    const percentage = Math.min((current / goal.target_hours) * 100, 100);
    return { current, target: goal.target_hours, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow viewing dashboard without auth, but features will prompt login
  const canInteract = !!user;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Feature Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureBlocks.map((feature, index) => (
            <Card
              key={index}
              className="relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-2xl"
              onClick={() => {
                if (!user) {
                  showAuthPrompt();
                } else {
                  navigate(feature.path);
                }
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-50"
                style={{ backgroundImage: `url(${feature.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              <CardContent className="relative z-10 p-6 h-48 flex flex-col justify-end">
                <h3 className="text-xl font-bold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Study Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['daily', 'weekly', 'monthly'].map((type) => {
              const goalType = type as 'daily' | 'weekly' | 'monthly';
              const progress = getGoalProgress(goalType);
              const goal = goals.find(g => g.goal_type === goalType);

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize">{type} Goal</Label>
                    {editingGoal === goalType ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={goalInput}
                          onChange={(e) => setGoalInput(e.target.value)}
                          className="w-20 h-8"
                          placeholder="Hours"
                        />
                        <Button size="sm" onClick={() => updateGoal(goalType, parseFloat(goalInput))}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingGoal(goalType);
                          setGoalInput(goal?.target_hours?.toString() || '');
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        {goal ? `${goal.target_hours}h` : 'Set Goal'}
                      </Button>
                    )}
                  </div>
                  {progress && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{progress.current}h / {progress.target}h</span>
                        <span>{Math.round(progress.percentage)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : `${todayHours}h`}</div>
              <p className="text-xs text-muted-foreground">Study time today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingStats ? '...' : `${weekStats.total}h`}</div>
              <p className="text-xs text-muted-foreground">Avg {weekStats.average}h/day</p>
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

        {/* Weekly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Study Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
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
