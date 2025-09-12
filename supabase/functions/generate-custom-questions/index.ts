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
            content: `You are an expert educational content creator specializing in generating high-quality, factually accurate quiz questions. 

Your task is to create ${numQuestions} multiple-choice questions based on the provided content. Follow these strict guidelines:

1. TOPIC RELEVANCE: All questions must be directly related to the main topic and content provided
2. FACTUAL ACCURACY: Every question and answer must be 100% factually correct
3. SMART VARIATION: For different subjects, vary appropriately:
   - Math: Change numbers, values, equations while keeping concepts correct
   - Science: Use different elements, compounds, examples while maintaining accuracy
   - History: Use different dates, figures, events that are factually correct
   - Literature: Reference different works, authors, techniques that exist

4. DIFFICULTY BALANCE: Create questions of varying difficulty levels
5. CLEAR LANGUAGE: Use clear, unambiguous language
6. AVOID TRICKS: No trick questions or confusing wording
7. SINGLE CORRECT ANSWER: Each question must have exactly one clearly correct answer

Return ONLY a valid JSON object with this exact structure:
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

Do not include any explanation, markdown formatting, or additional text outside the JSON.`
          },
          {
            role: 'user',
            content: `Generate ${numQuestions} factually accurate multiple-choice questions based on this content:

Topic: ${topic}

Content: ${content}

Make sure all questions are relevant to this specific topic and content. Vary the specific details (numbers for math, elements for chemistry, etc.) while keeping everything factually correct and on-topic.`
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated content preview:', generatedContent.substring(0, 200));

    // Parse the JSON response
    let questionsData;
    try {
      questionsData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse generated JSON:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the response structure
    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      throw new Error('Invalid questions format');
    }

    // Validate each question
    const validatedQuestions: QuizQuestion[] = [];
    for (const q of questionsData.questions) {
      if (q.question && q.options && q.correct_answer && 
          q.options.a && q.options.b && q.options.c && q.options.d &&
          ['a', 'b', 'c', 'd'].includes(q.correct_answer)) {
        validatedQuestions.push({
          question: q.question,
          options: {
            a: q.options.a,
            b: q.options.b,
            c: q.options.c,
            d: q.options.d,
          },
          correct_answer: q.correct_answer,
        });
      }
    }

    console.log(`Validated ${validatedQuestions.length} questions out of ${questionsData.questions.length}`);

    if (validatedQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }

    return new Response(JSON.stringify({ 
      questions: validatedQuestions,
      generated_count: validatedQuestions.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-custom-questions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate custom questions'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});