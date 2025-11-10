import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  corrected_text: z.string().min(50).max(100000).optional(),
  images: z.array(z.string()).max(5).optional(),
  num_questions: z.number().int().min(5).max(50).default(8),
  language: z.enum(['english', 'chinese']).default('english')
}).refine(data => data.corrected_text || (data.images && data.images.length > 0), {
  message: "Either corrected_text or images must be provided"
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing study materials generation request');
    
    if (!lovableApiKey) {
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

    const { corrected_text, images, num_questions, language } = validationResult.data;

    const clampedQuestions = num_questions;
    const inputText = (corrected_text || '').toString().slice(0, 4000);
    const languageInstruction = language === 'chinese' 
      ? 'Generate all content in Traditional Chinese (繁體中文).' 
      : 'Generate all content in English.';

    console.log('Input text length (trimmed):', inputText.length);
    console.log('Number of images:', images?.length || 0);
    console.log('Number of questions requested:', clampedQuestions);

    const hasImages = images && images.length > 0;
    if (hasImages) {
      console.log('WARNING: Images detected but will be ignored in processing.');
    }
    
    const apiKey = lovableApiKey;
    const baseUrl = 'https://ai.gateway.lovable.dev';
    const model = 'google/gemini-2.5-flash';
    
    const messageContent = `Text to analyze: "${inputText || 'No text provided'}"\n\nGenerate exactly ${clampedQuestions} quiz questions.`;

    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert educational content creator. ${languageInstruction} Your task is to generate study materials from the provided text content.

**CRITICAL: You MUST return ONLY valid JSON. No markdown formatting, no code blocks, no extra text.**

**Your Tasks:**
1. **Analyze Content:** Use the provided text as the primary content for analysis.

2. **Create Comprehensive Educational Summary:** Generate a detailed, educational summary (300-500 words) that covers the main concepts, definitions, and key examples.

3. **Create Flashcards:** Generate 6-8 flashcards based on the content. Include questions about concepts, definitions, formulas, or key information from the text.

4. **Create a Quiz:** Generate a quiz with ${clampedQuestions || 5} multiple-choice questions. Each question must have 4 options (a, b, c, d) and one clearly correct answer with factual accuracy.

**CRITICAL OUTPUT RULES:** 
- Return ONLY a valid JSON object
- No markdown code blocks (no \`\`\`json)
- No extra text before or after the JSON
- Properly escape all quotes inside strings
- Use \\n for line breaks in strings, not actual line breaks
- Keep summary concise to avoid token limits

**Required JSON Structure:**
{"summary":"Your summary text here","flashcards":[{"question":"Question text","answer":"Answer text"}],"quiz":{"questions":[{"question":"Question text","options":{"a":"Option 1","b":"Option 2","c":"Option 3","d":"Option 4"},"correct_answer":"b"}]}}

Return ONLY the JSON object.`
        },
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_tokens: 3000,
      temperature: 0.2,
      response_format: { type: "json_object" }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), 45000);
    let response;
    try {
      response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;
    console.log('AI response received, length:', result?.length);
    
    let cleanedResult = '';
    try {
      cleanedResult = result.trim();

      // Remove markdown code blocks if present
      const fencedMatch = cleanedResult.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fencedMatch) {
        cleanedResult = fencedMatch[1].trim();
      } else {
        cleanedResult = cleanedResult
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/i, '')
          .trim();
      }

      // Extract JSON object if there's extra text
      if (!(cleanedResult.startsWith('{') && cleanedResult.endsWith('}'))) {
        const firstBrace = cleanedResult.indexOf('{');
        const lastBrace = cleanedResult.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanedResult = cleanedResult.slice(firstBrace, lastBrace + 1).trim();
        }
      }

      // Try to parse the JSON
      const parsedResult = JSON.parse(cleanedResult);
      console.log('Successfully parsed AI response');
      
      // Validate that required fields exist
      if (!parsedResult.summary || !parsedResult.flashcards || !parsedResult.quiz) {
        throw new Error('Missing required fields in AI response');
      }
      
      return new Response(JSON.stringify({
        success: true,
        summary: parsedResult.summary,
        flashcards: parsedResult.flashcards,
        key_concepts: parsedResult.key_concepts || [],
        quiz: parsedResult.quiz
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw result (first 1000 chars):', result?.substring(0, 1000));
      console.error('Cleaned result (first 1000 chars):', cleanedResult.substring(0, 1000));
      
      // Return a more descriptive error
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to generate properly formatted study materials. Please try again with a shorter text or fewer questions.',
        summary: "Unable to generate summary. Please try again.",
        flashcards: [
          {
            "question": "What should you do if study materials can't be generated?",
            "answer": "Try again with shorter text or fewer questions, or review the material manually."
          }
        ],
        quiz: {
          questions: [
            {
              "question": "What is a recommended action when automated tools fail?",
              "options": {
                "a": "Give up immediately",
                "b": "Try again with adjusted parameters",
                "c": "Never use the tool again",
                "d": "Ignore the issue"
              },
              "correct_answer": "b"
            }
          ]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-study-materials function:', error);
    const message = (error instanceof Error && (error.name === 'AbortError' || String(error.message).toLowerCase().includes('abort')))
      ? 'Generation timed out. Try again with fewer questions.'
      : (error instanceof Error ? error.message : 'Failed to generate study materials');
    return new Response(JSON.stringify({ 
      success: false,
      error: message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
