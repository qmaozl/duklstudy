import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    
    const { key_concepts } = await req.json();
    
    if (!key_concepts || !Array.isArray(key_concepts)) {
      throw new Error('No key concepts provided or invalid format');
    }

    console.log('Key concepts:', key_concepts);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
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
        max_completion_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

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
      error: error.message,
      sources: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});