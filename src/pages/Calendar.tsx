import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Flame, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { DashboardLayout } from "@/components/DashboardLayout";
import CramMaster from "@/components/CramMaster";

interface StudySession {
  id: string;
  date: string;
  duration_minutes: number;
  subject: string | null;
}

interface ScheduledTask {
  id: string;
  task_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  completed: boolean;
  action: string | null;
  tasks: {
    title: string;
    subject: string;
    task_type: string;
  };
}

const Calendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [showCramMaster, setShowCramMaster] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudySessions();
      fetchScheduledTasks();
      fetchStreak();
    }
  }, [user]);

  const fetchStudySessions = async () => {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user?.id)
      .order("date", { ascending: false });

    if (!error && data) {
      setStudySessions(data);
    }
  };

  const fetchScheduledTasks = async () => {
    const { data, error } = await supabase
      .from("scheduled_tasks")
      .select(`
        *,
        tasks (
          title,
          subject,
          task_type
        )
      `)
      .eq("user_id", user?.id);

    if (!error && data) {
      setScheduledTasks(data as any);
    }
  };

  const fetchStreak = async () => {
    const { data, error } = await supabase
      .from("study_streaks")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (!error && data) {
      setStreak({
        current: data.current_streak,
        longest: data.longest_streak,
      });
    } else if (error && error.code === 'PGRST116') {
      // Create initial streak record
      await supabase.from("study_streaks").insert({
        user_id: user?.id,
        current_streak: 0,
        longest_streak: 0,
      });
    }
  };

  const getSessionsForDate = (date: Date) => {
    return studySessions.filter((session) =>
      isSameDay(new Date(session.date), date)
    );
  };

  const getScheduledTasksForDate = (date: Date) => {
    return scheduledTasks.filter((task) =>
      isSameDay(new Date(task.scheduled_date), date)
    );
  };

  const selectedDateSessions = getSessionsForDate(selectedDate);
  const selectedDateTasks = getScheduledTasksForDate(selectedDate);

  const totalMinutesForDate = selectedDateSessions.reduce(
    (sum, session) => sum + session.duration_minutes,
    0
  );

  const studyDays = studySessions.reduce((acc, session) => {
    const dateStr = format(new Date(session.date), "yyyy-MM-dd");
    if (!acc.includes(dateStr)) acc.push(dateStr);
    return acc;
  }, [] as string[]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Study Calendar</h1>
              <p className="text-muted-foreground">Track your study sessions and manage your schedule</p>
            </div>
            <Button onClick={() => setShowCramMaster(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Cram Master
            </Button>
          </div>

        {/* Streak Display */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Flame className="w-12 h-12 text-primary" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">{streak.current} Day Streak</h3>
                <p className="text-muted-foreground">Longest: {streak.longest} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Study Days</p>
              <p className="text-3xl font-bold text-primary">{studyDays.length}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Calendar</h2>
            </div>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                studyDay: (date) =>
                  studyDays.includes(format(date, "yyyy-MM-dd")),
                scheduledTask: (date) =>
                  scheduledTasks.some((task) =>
                    isSameDay(new Date(task.scheduled_date), date)
                  ),
              }}
              modifiersStyles={{
                studyDay: {
                  backgroundColor: "hsl(var(--primary) / 0.2)",
                  fontWeight: "bold",
                },
                scheduledTask: {
                  border: "2px solid hsl(var(--accent))",
                },
              }}
            />
          </Card>

          {/* Selected Date Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {format(selectedDate, "MMMM d, yyyy")}
            </h2>

            {/* Study Sessions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Study Sessions
              </h3>
              {selectedDateSessions.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 bg-primary/10 rounded-lg"
                    >
                      <p className="font-medium text-foreground">
                        {session.subject || "General Study"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.duration_minutes} minutes
                      </p>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Total Time</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.floor(totalMinutesForDate / 60)}h{" "}
                      {totalMinutesForDate % 60}m
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No study sessions</p>
              )}
            </div>

            {/* Scheduled Tasks */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Scheduled Tasks
              </h3>
              {selectedDateTasks.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-accent/10 rounded-lg space-y-1"
                    >
                      <p className="font-medium text-foreground">
                        {task.tasks.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.scheduled_time} • {task.duration_minutes} min
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.tasks.subject} • {task.tasks.task_type}
                      </p>
                      {task.action && (
                        <p className="text-xs text-primary mt-2 font-medium">
                          💡 {task.action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No scheduled tasks</p>
              )}
            </div>
          </Card>
          </div>
        </div>

        {showCramMaster && (
          <CramMaster
            onClose={() => setShowCramMaster(false)}
            onScheduleCreated={() => {
              fetchScheduledTasks();
              setShowCramMaster(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
