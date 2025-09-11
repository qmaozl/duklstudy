import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const deepseekApiKey = Deno.env.get('OPENAI_API_KEY'); // Using same env var for DeepSeek

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing relevant sources request');
    
    if (!deepseekApiKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'DeepSeek API key not found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { key_concepts } = await req.json();
    
    if (!key_concepts || !Array.isArray(key_concepts)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No key concepts provided or invalid format'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Key concepts:', key_concepts);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
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
      
      return new Response(JSON.stringify(parsedResult), {
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
        sources: fallbackSources
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in find-relevant-sources function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});