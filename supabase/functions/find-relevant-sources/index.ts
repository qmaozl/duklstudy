import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const deepseekApiKey = Deno.env.get('OPENAI_API_KEY'); // Using same env var for DeepSeek

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Simple in-memory store (resets per function cold start)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60000; // 1 minute in milliseconds

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(clientId);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input validation schema
const requestSchema = z.object({
  key_concepts: z.array(z.string().min(1).max(200)).min(1).max(20)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }

    console.log('Processing relevant sources request');
    
    if (!deepseekApiKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    const { key_concepts } = validationResult.data;

    console.log('Key concepts:', key_concepts);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a research assistant. Given a list of key concepts, suggest relevant and high-quality online resources for further learning.

**Rules:**
- For each key concept, suggest one resource from YouTube (format: "Topic - YouTube: [Suggest a search query for the topic]") and one from Wikipedia (format: "Topic - Wikipedia: [Wikipedia article title]").
- Only suggest well-known, established sources. Do not generate actual URLs, just the search queries and article titles.

**Output Format Rules:** 
- Return a JSON object with a "sources" key containing an array of strings.
- Example: ["Photosynthesis - YouTube: Crash Course Photosynthesis", "Photosynthesis - Wikipedia: Photosynthesis"]

Return ONLY the JSON object, no other text.`
          },
          {
            role: 'user',
            content: `Key Concepts: ${JSON.stringify(key_concepts)}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DeepSeek response received');

    const result = data.choices[0].message.content;
    
    try {
      const parsedResult = JSON.parse(result);
      console.log('Successfully parsed sources:', parsedResult);
      
      return new Response(JSON.stringify({
        success: true,
        ...parsedResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', result);
      
      // Fallback response
      const fallbackSources = key_concepts.map(concept => [
        `${concept} - YouTube: ${concept} explained`,
        `${concept} - Wikipedia: ${concept}`
      ]).flat();
      
      return new Response(JSON.stringify({
        success: true,
        sources: fallbackSources
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in find-relevant-sources function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find sources'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});