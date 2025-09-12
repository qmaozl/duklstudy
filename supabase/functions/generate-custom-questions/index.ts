import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuizQuestion {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correct_answer: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, topic, numQuestions = 25 } = await req.json();

    console.log(`Generating ${numQuestions} questions for topic: ${topic}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content creator and fact-checker specializing in generating HIGH-QUALITY, FACTUALLY ACCURATE quiz questions. 

CRITICAL REQUIREMENTS:
1. ABSOLUTE FACTUAL ACCURACY: Every single fact, number, date, name, scientific concept, mathematical formula, or historical detail MUST be 100% correct and verifiable
2. RIGOROUS FACT-CHECKING: Cross-reference all information against reliable sources
3. NO ASSUMPTIONS: If uncertain about any fact, do not include that question
4. TOPIC ADHERENCE: All questions must be directly related to the provided content and topic

SMART VARIATION GUIDELINES:
- Mathematics: Change numbers, coefficients, or values while maintaining mathematical correctness
- Science: Use different but real elements, compounds, reactions, or phenomena that are scientifically accurate  
- History: Reference different but real dates, figures, events, or periods that are historically correct
- Geography: Use different but real locations, countries, capitals, or geographical features
- Literature: Reference actual works, real authors, genuine literary techniques or movements

QUESTION QUALITY STANDARDS:
- Clear, unambiguous language
- Balanced difficulty levels (25% easy, 50% medium, 25% advanced)
- No trick questions or misleading options
- Exactly one clearly correct answer per question
- Plausible but incorrect distractors

VERIFICATION CHECKLIST (apply to each question):
✓ Is every fact in this question verifiably true?
✓ Are all numbers, dates, names, and concepts accurate?
✓ Is this directly related to the topic?
✓ Would subject matter experts agree this is correct?
✓ Are the wrong answers plausible but clearly incorrect?

Generate exactly ${numQuestions} questions. Return ONLY a valid JSON object:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": {
        "a": "First option",
        "b": "Second option", 
        "c": "Third option",
        "d": "Fourth option"
      },
      "correct_answer": "a"
    }
  ]
}

NO explanations, markdown, or additional text outside the JSON.`
          },
          {
            role: 'user',
            content: `Generate ${numQuestions} FACTUALLY ACCURATE multiple-choice questions for this content:

TOPIC: ${topic}
CONTENT: ${content}

Requirements:
- All facts must be 100% accurate and verifiable
- Questions must relate directly to this topic and content
- Use appropriate subject-specific variations (numbers for math, real elements for chemistry, etc.)
- Maintain educational value while ensuring complete factual correctness
- Double-check all scientific facts, historical dates, mathematical concepts, and proper nouns`
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated content preview:', generatedContent.substring(0, 300));

    // Parse the JSON response
    let questionsData;
    try {
      questionsData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse generated JSON:', parseError);
      console.error('Raw content:', generatedContent);
      throw new Error('Invalid JSON response from AI - please try again');
    }

    // Validate the response structure
    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      console.error('Invalid structure:', questionsData);
      throw new Error('Invalid questions format from AI');
    }

    // Strict validation for each question
    const validatedQuestions: QuizQuestion[] = [];
    for (let i = 0; i < questionsData.questions.length; i++) {
      const q = questionsData.questions[i];
      
      // Check all required fields exist and are strings
      if (!q.question || typeof q.question !== 'string' ||
          !q.options || typeof q.options !== 'object' ||
          !q.correct_answer || typeof q.correct_answer !== 'string' ||
          !q.options.a || typeof q.options.a !== 'string' ||
          !q.options.b || typeof q.options.b !== 'string' ||
          !q.options.c || typeof q.options.c !== 'string' ||
          !q.options.d || typeof q.options.d !== 'string') {
        console.error(`Question ${i + 1} failed validation - missing or invalid fields:`, q);
        continue;
      }

      // Check correct answer is valid
      if (!['a', 'b', 'c', 'd'].includes(q.correct_answer)) {
        console.error(`Question ${i + 1} has invalid correct_answer:`, q.correct_answer);
        continue;
      }

      // Additional content validation
      if (q.question.length < 10 || q.question.length > 500) {
        console.error(`Question ${i + 1} has invalid length:`, q.question.length);
        continue;
      }

      // Check for empty options
      if ([q.options.a, q.options.b, q.options.c, q.options.d].some(opt => !opt.trim())) {
        console.error(`Question ${i + 1} has empty options`);
        continue;
      }

      validatedQuestions.push({
        question: q.question.trim(),
        options: {
          a: q.options.a.trim(),
          b: q.options.b.trim(),
          c: q.options.c.trim(),
          d: q.options.d.trim(),
        },
        correct_answer: q.correct_answer,
      });
    }

    console.log(`Successfully validated ${validatedQuestions.length} out of ${questionsData.questions.length} questions`);

    if (validatedQuestions.length === 0) {
      throw new Error('No valid questions could be generated. Please try again.');
    }

    return new Response(JSON.stringify({ 
      questions: validatedQuestions,
      generated_count: validatedQuestions.length,
      requested_count: numQuestions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-custom-questions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate factually accurate questions. Please try again.',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});