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
        model: 'o3-2025-04-16', // Use O3 for better reasoning and fact-checking
        messages: [
          {
            role: 'system',
            content: `You are a world-class educational expert and fact-checker with access to verified knowledge databases. Your task is to create ONLY FACTUALLY PERFECT multiple-choice questions.

🚨 CRITICAL FACT-CHECKING PROTOCOL:
- VERIFY every single fact against multiple reliable sources
- NO approximations, assumptions, or "close enough" answers
- If you're not 100% certain about ANY detail, exclude that question
- Cross-reference all scientific data, historical dates, mathematical formulas
- Only use information you can verify as absolutely correct

📚 SUBJECT-SPECIFIC ACCURACY REQUIREMENTS:

MATHEMATICS:
- All calculations must be verifiably correct
- Use standard mathematical constants (π ≈ 3.14159, e ≈ 2.71828, etc.)
- Formulas must be textbook-accurate
- No computational errors permitted

SCIENCE:
- Use only verified scientific facts from peer-reviewed sources
- Chemical formulas must be chemically accurate (H₂O, CO₂, etc.)
- Physical constants must be precise (c = 299,792,458 m/s, etc.)
- Biological facts must be current and verified

HISTORY:
- Dates must be historically accurate to the year
- Names, places, events must be factually correct
- No historical myths or disputed claims
- Cross-check multiple historical sources

GEOGRAPHY:
- Capital cities, country names must be current and accurate
- Population figures, areas must be recent and verified
- Physical features must exist and be correctly named

🎯 QUALITY STANDARDS:
- Generate exactly ${numQuestions} questions
- Difficulty: 30% easy, 50% medium, 20% advanced
- Each question must test genuine understanding
- All incorrect options must be plausible but clearly wrong
- No trick questions or ambiguous wording

✅ VALIDATION CHECKLIST (Apply to EVERY question):
1. Can I verify this fact from at least 2 reliable sources?
2. Are all numbers, dates, names, and formulas 100% accurate?
3. Does this directly relate to the provided content?
4. Would domain experts unanimously agree this is correct?
5. Are the wrong answers realistic but definitively incorrect?

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": {
        "a": "Option A",
        "b": "Option B", 
        "c": "Option C",
        "d": "Option D"
      },
      "correct_answer": "a",
      "confidence_level": "verified",
      "fact_sources": "cross-referenced"
    }
  ]
}

REMEMBER: It's better to generate fewer perfectly accurate questions than many questionable ones.`
          },
          {
            role: 'user',
            content: `🎯 FACT-CHECKING MISSION: Generate ${numQuestions} questions with ZERO FACTUAL ERRORS.

📋 CONTENT TO ANALYZE:
TOPIC: ${topic}
CONTENT: ${content}

🔍 STRICT VERIFICATION REQUIREMENTS:
1. VERIFY every number, date, name, formula against reliable sources
2. NO "approximately" or "roughly" - use exact values only
3. Cross-check scientific facts, historical events, mathematical equations
4. If ANY uncertainty exists, exclude that question entirely
5. Focus ONLY on verifiable core concepts from the material

⚠️ ZERO TOLERANCE FOR:
- Approximated dates or numbers
- Unverified scientific claims  
- Disputed historical facts
- Mathematical errors of any kind
- Geographic inaccuracies

✅ ONLY INCLUDE questions where you can guarantee 100% accuracy.
Better to generate 10 perfect questions than 15 questionable ones.`
          }
        ],
        max_completion_tokens: 3000,
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

    // Strict validation for each question with enhanced checks
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

      // Enhanced content validation
      if (q.question.length < 15 || q.question.length > 300) {
        console.error(`Question ${i + 1} has invalid length:`, q.question.length);
        continue;
      }

      // Check for empty or too short options
      const options = [q.options.a, q.options.b, q.options.c, q.options.d];
      if (options.some(opt => !opt.trim() || opt.trim().length < 2)) {
        console.error(`Question ${i + 1} has invalid options`);
        continue;
      }

      // Check for duplicate options
      const uniqueOptions = new Set(options.map(opt => opt.trim().toLowerCase()));
      if (uniqueOptions.size !== 4) {
        console.error(`Question ${i + 1} has duplicate options`);
        continue;
      }

      // Additional quality checks
      const correctOption = q.options[q.correct_answer];
      if (!correctOption || correctOption.trim().length < 2) {
        console.error(`Question ${i + 1} has invalid correct option`);
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
      error: error instanceof Error ? error.message : 'Failed to generate questions',
      details: 'Failed to generate factually accurate questions. Please try again.',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});