import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasks, availableHours } = await req.json();
    
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const prompt = `You are an AI study schedule planner. Create an optimal study schedule for the following tasks:

Tasks:
${tasks.map((t: any, i: number) => `${i + 1}. ${t.title} (${t.subject}, ${t.task_type}, due: ${t.due_date}, difficulty: ${t.difficulty}/5)`).join('\n')}

Available study hours per day: ${availableHours}

Please create a realistic schedule that:
1. Prioritizes tasks by deadline and difficulty
2. Suggests specific time slots (format: HH:MM)
3. Provides study recommendations and actions
4. Distributes workload evenly

Return a JSON array with this structure:
[
  {
    "task_title": "Task name",
    "scheduled_date": "YYYY-MM-DD",
    "scheduled_time": "HH:MM",
    "duration_minutes": number,
    "action": "Specific study action/recommendation"
  }
]

Be realistic with time estimates and provide actionable study recommendations.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert study planner. Always return valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let schedule;
    try {
      const parsed = JSON.parse(content);
      schedule = parsed.schedule || parsed;
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify({ success: true, schedule }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-schedule-planner:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to generate schedule' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
