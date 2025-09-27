import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY') || Deno.env.get('OPENAI_API_KEY'); // Prefer DeepSeek key, fallback to OpenAI-compatible key

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing study materials generation request');
    
    if (!deepseekApiKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'DeepSeek API key not found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { corrected_text, images, num_questions = 5 } = await req.json();
    
    if (!corrected_text && !images?.length) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No content (text or images) provided for processing'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize and clamp num_questions (reduced for speed)
    const clampedQuestions = Math.max(5, Math.min(12, parseInt(num_questions) || 8));

    // Trim very long inputs to speed up processing
    const inputText = (corrected_text || '').toString().slice(0, 4000);

    console.log('Input text length (trimmed):', inputText.length);
    console.log('Number of images:', images?.length || 0);
    console.log('Number of questions requested:', clampedQuestions);

    // Use DeepSeek API - note: DeepSeek doesn't support vision, so images will be ignored
    const hasImages = images && images.length > 0;
    if (hasImages) {
      console.log('WARNING: Images detected but DeepSeek does not support vision. Processing text only.');
    }
    
    const apiKey = deepseekApiKey;
    const baseUrl = 'https://api.deepseek.com';
    const model = 'deepseek-chat';
    
    console.log('DEBUG: About to make API call');
    console.log('DEBUG: baseUrl:', baseUrl);
    console.log('DEBUG: model:', model);
    console.log('DEBUG: API key present:', !!apiKey);
    console.log('DEBUG: API key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'DeepSeek API key not found'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Create content for DeepSeek API (text-only)
    const messageContent = `Text to analyze: "${inputText || 'No text provided'}"${clampedQuestions ? `\n\nGenerate exactly ${clampedQuestions} quiz questions.` : ''}`;

    console.log('DEBUG: Request content structure:');
    console.log('DEBUG: messageContent type:', typeof messageContent);
    console.log('DEBUG: messageContent length:', messageContent.length);
    
    console.log('DEBUG: Complete request body:');
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
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DeepSeek response received');

    const result = data.choices[0].message.content;
    
    let cleanedResult = '';
    try {
      // Clean the response by removing markdown code blocks if present and extract valid JSON
      cleanedResult = result.trim();
      console.log('Raw AI response length:', cleanedResult.length);

      // If wrapped in fenced code blocks, extract the inner content
      const fencedMatch = cleanedResult.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fencedMatch) {
        console.log('Detected fenced code block, extracting JSON...');
        cleanedResult = fencedMatch[1].trim();
      } else {
        // Remove any stray opening/closing fences just in case
        cleanedResult = cleanedResult
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/i, '')
          .trim();
      }

      // If still not a pure JSON object, slice between the first '{' and last '}'
      if (!(cleanedResult.startsWith('{') && cleanedResult.endsWith('}'))) {
        const firstBrace = cleanedResult.indexOf('{');
        const lastBrace = cleanedResult.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          console.log('Slicing content between outermost braces...');
          cleanedResult = cleanedResult.slice(firstBrace, lastBrace + 1).trim();
        }
      }

      console.log('Cleaned response length:', cleanedResult.length);
      console.log('First 200 characters of cleaned response:', cleanedResult.substring(0, 200));

      const parsedResult = JSON.parse(cleanedResult);
      console.log('Successfully parsed study materials');
      
      return new Response(JSON.stringify({
        success: true,
        ...parsedResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', result);
      console.error('Cleaned response:', cleanedResult);
      
      // Fallback response
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
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});