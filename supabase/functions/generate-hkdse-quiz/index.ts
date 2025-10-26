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
  text: z.string().min(50).max(100000),
  num_questions: z.number().int().min(5).max(20).default(10)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing HKDSE quiz generation request');
    
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

    const { text, num_questions } = validationResult.data;
    const inputText = text.toString().slice(0, 4000);

    console.log('Input text length (trimmed):', inputText.length);
    console.log('Number of questions requested:', num_questions);
    
    const apiKey = lovableApiKey;
    const baseUrl = 'https://ai.gateway.lovable.dev';
    const model = 'google/gemini-2.5-flash';

    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert HKDSE (Hong Kong Diploma of Secondary Education) exam question creator. Your task is to generate exam-style questions based on the provided text content.

**HKDSE Question Format Requirements:**

1. **Multiple Choice Questions (MCQ)**: 
   - Clear, unambiguous questions
   - 4 options labeled A, B, C, D
   - Only one clearly correct answer
   - Distractors should be plausible but incorrect

2. **Fill-in-the-Blank Questions**:
   - Sentences with ONE blank indicated by "______"
   - The blank should test key concepts or terminology
   - Provide the exact answer expected

3. **Short Answer Questions**:
   - Require 1-2 sentence responses
   - Test understanding and application
   - Provide model answer (50-100 words)

4. **True/False Questions**:
   - Clear statements that are definitively true or false
   - Include brief explanation why it's true or false

**Distribution**: Create a balanced mix of all 4 question types based on ${num_questions} total questions.

**Output Format - Return ONLY valid JSON:**
{
  "questions": [
    {
      "type": "mcq",
      "question": "Which of the following best describes...?",
      "options": {
        "A": "Option 1",
        "B": "Option 2",
        "C": "Option 3",
        "D": "Option 4"
      },
      "correct_answer": "B",
      "marks": 1
    },
    {
      "type": "fill_blank",
      "question": "The process of ______ involves converting light energy into chemical energy.",
      "correct_answer": "photosynthesis",
      "marks": 1
    },
    {
      "type": "short_answer",
      "question": "Explain how the greenhouse effect contributes to global warming.",
      "model_answer": "The greenhouse effect occurs when greenhouse gases in the atmosphere trap heat from the sun. These gases allow sunlight to pass through but prevent heat from escaping back into space, causing the Earth's temperature to rise.",
      "marks": 3
    },
    {
      "type": "true_false",
      "statement": "DNA is composed of amino acids.",
      "correct_answer": false,
      "explanation": "DNA is composed of nucleotides, not amino acids. Amino acids are the building blocks of proteins.",
      "marks": 1
    }
  ]
}

Return ONLY the JSON object. Do not include any other text, markdown formatting, or code blocks.`
        },
        {
          role: 'user',
          content: `Generate ${num_questions} HKDSE-style exam questions based on this text:\n\n${inputText}`
        }
      ],
      max_tokens: 3000,
      temperature: 0.4
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), 50000);
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

      // Extract JSON object if wrapped in text
      if (!(cleanedResult.startsWith('{') && cleanedResult.endsWith('}'))) {
        const firstBrace = cleanedResult.indexOf('{');
        const lastBrace = cleanedResult.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanedResult = cleanedResult.slice(firstBrace, lastBrace + 1).trim();
        }
      }

      const parsedResult = JSON.parse(cleanedResult);
      console.log('Successfully parsed AI response');
      console.log('Generated questions:', parsedResult.questions?.length);
      
      return new Response(JSON.stringify({
        success: true,
        ...parsedResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Cleaned result:', cleanedResult.substring(0, 500));
      
      // Return fallback questions
      return new Response(JSON.stringify({
        success: true,
        questions: [
          {
            type: "mcq",
            question: "What is the main topic discussed in the text?",
            options: {
              A: "Review the original material",
              B: "Skip this section",
              C: "Wait for better questions",
              D: "Give up studying"
            },
            correct_answer: "A",
            marks: 1
          }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-hkdse-quiz function:', error);
    const message = (error instanceof Error && (error.name === 'AbortError' || String(error.message).toLowerCase().includes('abort')))
      ? 'Generation timed out. Try again with fewer questions.'
      : (error instanceof Error ? error.message : 'Failed to generate HKDSE quiz');
    return new Response(JSON.stringify({ 
      success: false,
      error: message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
