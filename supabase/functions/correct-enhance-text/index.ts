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
    console.log('Processing text correction request');
    
    if (!deepseekApiKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'DeepSeek API key not found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { raw_text } = await req.json();
    
    if (!raw_text) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No raw text provided for correction'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Input text length:', raw_text.length);

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
            content: `You are a text correction and enhancement AI. Your task is to process the raw text input from the user.

**Steps:**
1. **Correct Spelling and Grammar:** Fix any obvious errors introduced by OCR (Optical Character Recognition) scanning.
2. **Improve Readability:** Adjust punctuation and paragraph breaks for clarity. Do not change the meaning or add new information not present in the original text.
3. **Identify Key Concepts:** Briefly analyze the corrected text to identify 3-5 main topics or key terms. This will be used for sourcing later.

**Output Format Rules:** 
- You MUST output a valid JSON object with the following structure. Do not add any other text.
{
  "corrected_text": "The corrected and enhanced text goes here...",
  "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"]
}

Return ONLY the JSON object, no other text.`
          },
          {
            role: 'user',
            content: `Raw text to correct and enhance: "${raw_text}"`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
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
      console.log('Successfully parsed correction result');
      
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
      return new Response(JSON.stringify({
        success: true,
        corrected_text: raw_text, // Return original text if parsing fails
        key_concepts: ["General Topic", "Study Material", "Learning Content", "Educational Text"]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in correct-enhance-text function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});