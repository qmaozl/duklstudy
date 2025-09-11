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
    
    const { corrected_text, num_questions = 5 } = await req.json();
    
    if (!corrected_text) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No corrected text provided for processing'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize and clamp num_questions
    const clampedQuestions = Math.max(1, Math.min(30, parseInt(num_questions) || 5));

    console.log('Input text length:', corrected_text.length);
    console.log('Number of questions requested:', clampedQuestions);

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
            content: `You are an expert educational content creator. Your task is to generate multiple study aids from the provided text.

**Steps:**
1. **Create a Summary:** Generate a concise, easy-to-understand summary of the key points in the text (approx. 150 words).
2. **Create Flashcards:** Generate 5-10 flashcards. For each flashcard, provide a clear question and a concise answer based directly on the text.
3. **Create a Quiz:** Generate a quiz with ${clampedQuestions || 5} multiple-choice questions. Each question must have 4 options (a, b, c, d) and one clearly correct answer. Provide the answer key.

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
            content: `Text to analyze: "${corrected_text}"${clampedQuestions ? `\n\nGenerate exactly ${clampedQuestions} quiz questions.` : ''}`
          }
        ],
        max_tokens: 6000,
        temperature: 0.4
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
      console.log('Successfully parsed study materials');
      
      return new Response(JSON.stringify(parsedResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', result);
      
      // Fallback response
      return new Response(JSON.stringify({
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
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});