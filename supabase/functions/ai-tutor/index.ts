import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  user_message: z.string().min(1).max(5000),
  current_topic: z.string().max(200).optional(),
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(5000)
  })).max(50).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing AI tutor request');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }
    
    const body = await req.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid input',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_message, current_topic, conversation_history } = validationResult.data;

    // Build conversation with context
    const messages = [
      {
        role: 'system',
        content: `You are "StudyBot," a friendly, patient, and expert AI tutor. Your goal is to help students learn and understand concepts, not just give them answers.

**Persona:** You are knowledgeable across all major academic subjects including science, math, history, and literature.

**Rules:**
1. **Be Socratic:** Encourage critical thinking by asking guiding questions. If a student asks for an answer, help them work through the problem to discover it themselves.
2. **Be Encouraging:** Use positive reinforcement. Say things like "Great question!" or "You're on the right track!"
3. **Be Concise:** Break down complex topics into simple, digestible steps. Use analogies when helpful.
4. **Stay On Topic:** Gently steer the conversation back to educational topics if it drifts.
5. **Admit Limits:** If you don't know something, say so. Do not hallucinate information.

${current_topic ? `**Context:** The user is currently studying material related to: ${current_topic}.` : ''}

Keep responses conversational, helpful, and encouraging. Aim for 2-3 sentences unless a longer explanation is needed.`
      }
    ];

    // Add conversation history if provided
    if (conversation_history && Array.isArray(conversation_history)) {
      messages.push(...conversation_history);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: user_message
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;
    
    return new Response(JSON.stringify({
      success: true,
      message: botResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-tutor function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "I'm sorry, I'm having trouble responding right now. Please try again in a moment!",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
