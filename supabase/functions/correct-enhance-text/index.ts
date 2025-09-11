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
    console.log('Processing text correction and enhancement request');
    
    const { raw_text } = await req.json();
    
    if (!raw_text) {
      throw new Error('No text provided for processing');
    }

    console.log('Input text length:', raw_text.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a text correction and enhancement AI. Your task is to process the raw text input from the user.

**Steps:**
1. **Correct Spelling and Grammar:** Fix any obvious errors introduced by OCR (Optical Character Recognition) scanning.
2. **Improve Readability:** Adjust punctuation and paragraph breaks for clarity. Do not change the meaning or add new information not present in the original text.
3. **Identify Key Concepts:** Briefly analyze the corrected text to identify 3-5 main topics or key terms. This will be used for sourcing later.

**Output Format Rules:** 
- Return a JSON object with two keys:
  - "corrected_text": The cleaned-up and corrected version of the input text.
  - "key_concepts": An array of the main topics you identified (e.g., ["Photosynthesis", "Cellular Respiration", "Chloroplast"]).

Return ONLY the JSON object, no other text.`
          },
          {
            role: 'user',
            content: `Raw text to process: "${raw_text}"`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
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
      console.log('Successfully parsed result:', parsedResult);
      
      return new Response(JSON.stringify(parsedResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', result);
      
      // Fallback response
      return new Response(JSON.stringify({
        corrected_text: raw_text,
        key_concepts: ["General Study Material"]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in correct-enhance-text function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      corrected_text: "",
      key_concepts: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});