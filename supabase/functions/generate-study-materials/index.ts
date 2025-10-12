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
  num_questions: z.number().int().min(5).max(50).default(8)
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

    const { corrected_text, images, num_questions } = validationResult.data;

    const clampedQuestions = num_questions;
    const inputText = (corrected_text || '').toString().slice(0, 4000);

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
          content: `You are an expert educational content creator. Your task is to generate study materials from the provided text content.

**Your Tasks:**
1. **Analyze Content:** Use the provided text as the primary content for analysis.

2. **Create Comprehensive Educational Summary:** Generate a detailed, educational summary that serves as a complete learning resource. Your summary should:
    - Be 400-800 words long
    - Cover the main concepts, definitions, and key examples
    - Give clear explanations of the why and how, with 1-2 practical applications
    - Use headings and short paragraphs for readability

3. **Create Flashcards:** Generate 6-10 flashcards based on the content. Include questions about concepts, definitions, formulas, or key information from the text.

4. **Create a Quiz:** Generate a quiz with ${clampedQuestions || 5} multiple-choice questions. Each question must have 4 options (a, b, c, d) and one clearly correct answer with factual accuracy.

**Output Format Rules:** 
- You MUST output a valid JSON object with the following structure. Do not add any other text.
{
  "summary": "The generated summary text goes here...",
  "flashcards": [
    {"question": "What is...?", "answer": "The answer is..."},
    {"question": "How does...?", "answer": "It works by..."}
  ],
  "quiz": {
    "questions": [
      {
        "question": "What is the primary function of...?",
        "options": {
          "a": "Option 1",
          "b": "Option 2", 
          "c": "Option 3",
          "d": "Option 4"
        },
        "correct_answer": "b"
      }
    ]
  }
}

Return ONLY the JSON object, no other text.`
        },
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_tokens: 2200,
      temperature: 0.3
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

      const fencedMatch = cleanedResult.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fencedMatch) {
        cleanedResult = fencedMatch[1].trim();
      } else {
        cleanedResult = cleanedResult
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/i, '')
          .trim();
      }

      if (!(cleanedResult.startsWith('{') && cleanedResult.endsWith('}'))) {
        const firstBrace = cleanedResult.indexOf('{');
        const lastBrace = cleanedResult.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanedResult = cleanedResult.slice(firstBrace, lastBrace + 1).trim();
        }
      }

      const parsedResult = JSON.parse(cleanedResult);
      console.log('Successfully parsed AI response');
      
      return new Response(JSON.stringify({
        success: true,
        ...parsedResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Cleaned result:', cleanedResult.substring(0, 500));
      
      return new Response(JSON.stringify({
        success: true,
        summary: "Unable to generate summary at this time.",
        flashcards: [
          {
            "question": "What was the main topic of the text?",
            "answer": "Please review the original material for key concepts."
          }
        ],
        quiz: {
          questions: [
            {
              "question": "What should you do when study materials can't be generated?",
              "options": {
                "a": "Give up studying",
                "b": "Review the original material manually",
                "c": "Skip this topic",
                "d": "Wait indefinitely"
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
