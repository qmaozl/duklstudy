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

    // Sanitize and clamp num_questions
    const clampedQuestions = Math.max(1, Math.min(30, parseInt(num_questions) || 5));

    console.log('Input text length:', corrected_text?.length || 0);
    console.log('Number of images:', images?.length || 0);
    console.log('Number of questions requested:', clampedQuestions);

    // Choose model based on content type
    const hasImages = images && images.length > 0;
    const model = hasImages ? 'deepseek-vl-7b-chat' : 'deepseek-chat';
    
    // Build messages for multimodal or text-only content (DeepSeek VL expects input_text/input_image blocks)
    const userContent: Array<{ type: 'input_text' | 'input_image'; text?: string; image_url?: string }> = [];
    
    if (corrected_text?.trim()) {
      userContent.push({ type: 'input_text', text: `Text to analyze: "${corrected_text}"` });
    }
    
    if (hasImages) {
      (images as string[]).forEach((imageData) => {
        userContent.push({ 
          type: 'input_image',
          image_url: imageData
        });
      });
    }
    
    if (clampedQuestions) {
      userContent.push({ 
        type: 'input_text', 
        text: `Generate exactly ${clampedQuestions} quiz questions.` 
      });
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content creator. Your task is to generate study materials from the provided content (text and/or images).

**Your Tasks:**
1. **Analyze Content:** If images are provided, extract and analyze all visible text, diagrams, charts, formulas, and educational content. If text is provided, use it as the primary content.
2. **Create Detailed Notes:** Generate comprehensive, detailed notes that cover ALL important concepts, explanations, examples, and information from the content. These notes should be thorough enough that someone could learn the entire subject matter just by reading them and successfully answer quiz questions. Include definitions, step-by-step explanations, examples, formulas, and any other relevant details (aim for 800-1500 words depending on content complexity).
3. **Create Flashcards:** Generate 5-10 flashcards based on the content. Include questions about concepts, definitions, formulas, or key information visible in images or text.
4. **Create a Quiz:** Generate a quiz with ${clampedQuestions || 5} multiple-choice questions. Each question must have 4 options (a, b, c, d) and one clearly correct answer.

**For Images:** Pay special attention to:
- Text within images (OCR and understanding)
- Diagrams, charts, and visual data
- Mathematical formulas and equations
- Tables and structured information
- Educational diagrams and illustrations

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
            content: hasImages ? userContent : `Text to analyze: "${corrected_text}"${clampedQuestions ? `\n\nGenerate exactly ${clampedQuestions} quiz questions.` : ''}`
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