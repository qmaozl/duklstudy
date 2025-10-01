import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Task {
  id: string;
  title: string;
  task_type: string;
  subject: string;
  due_date: string;
  priority_order: number;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { tasks } = await req.json() as { tasks: Task[] };

    if (!tasks || tasks.length === 0) {
      throw new Error('No tasks provided');
    }

    console.log(`Generating schedule for ${tasks.length} tasks`);

    // Clear existing scheduled tasks for these tasks
    const taskIds = tasks.map(t => t.id);
    await supabase
      .from('scheduled_tasks')
      .delete()
      .in('task_id', taskIds)
      .eq('user_id', user.id);

    // Generate schedule based on priorities and due dates
    const scheduledTasks = [];
    const today = new Date();

    for (const task of tasks) {
      const dueDate = new Date(task.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Determine study duration based on task type
      let totalMinutes = 60;
      if (task.task_type === 'exam') totalMinutes = 180;
      else if (task.task_type === 'test') totalMinutes = 120;
      else if (task.task_type === 'project') totalMinutes = 240;

      // Distribute study sessions
      const sessionsNeeded = Math.ceil(totalMinutes / 60);
      const sessionDuration = Math.floor(totalMinutes / sessionsNeeded);

      // Schedule sessions leading up to due date
      for (let i = 0; i < sessionsNeeded; i++) {
        const dayOffset = Math.max(1, Math.floor((daysUntilDue / sessionsNeeded) * i));
        const scheduledDate = new Date(today);
        scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

        // Schedule at different times based on priority
        const hour = 14 + (task.priority_order % 6);
        const scheduledTime = `${hour.toString().padStart(2, '0')}:00:00`;

        scheduledTasks.push({
          task_id: task.id,
          user_id: user.id,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          scheduled_time: scheduledTime,
          duration_minutes: sessionDuration,
          completed: false,
        });
      }
    }

    // Insert all scheduled tasks
    const { error: insertError } = await supabase
      .from('scheduled_tasks')
      .insert(scheduledTasks);

    if (insertError) {
      console.error('Error inserting scheduled tasks:', insertError);
      throw insertError;
    }

    console.log(`Successfully created ${scheduledTasks.length} scheduled sessions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduled_count: scheduledTasks.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-schedule:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
