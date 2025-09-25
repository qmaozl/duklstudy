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

    // Choose API based on content type
    const hasImages = images && images.length > 0;
    const useOpenAI = hasImages; // Use OpenAI for image processing, DeepSeek for text-only
    const apiKey = useOpenAI ? Deno.env.get('OPENAI_API_KEY') : deepseekApiKey;
    const baseUrl = useOpenAI ? 'https://api.openai.com' : 'https://api.deepseek.com';
    const model = useOpenAI ? 'gpt-4o-mini' : 'deepseek-chat';
    
    console.log('DEBUG: About to make API call');
    console.log('DEBUG: hasImages:', hasImages);
    console.log('DEBUG: useOpenAI:', useOpenAI);
    console.log('DEBUG: baseUrl:', baseUrl);
    console.log('DEBUG: model:', model);
    console.log('DEBUG: API key present:', !!apiKey);
    console.log('DEBUG: API key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: `${useOpenAI ? 'OpenAI' : 'DeepSeek'} API key not found`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Create proper multimodal content for OpenAI API
    let messageContent;
    if (hasImages) {
      // For images, create a content array with text and image_url objects
      messageContent = [];
      
      if (corrected_text?.trim()) {
        messageContent.push({
          type: 'text',
          text: `Text to analyze: "${corrected_text}"`
        });
      }
      
      // Add each image
      (images as string[]).forEach((imageData) => {
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: imageData
          }
        });
      });
      
      if (clampedQuestions) {
        messageContent.push({
          type: 'text',
          text: `Generate exactly ${clampedQuestions} quiz questions.`
        });
      }
    } else {
      // For text-only, use simple string content
      messageContent = `Text to analyze: "${corrected_text}"${clampedQuestions ? `\n\nGenerate exactly ${clampedQuestions} quiz questions.` : ''}`;
    }

    console.log('DEBUG: Request content structure:');
    console.log('DEBUG: messageContent type:', Array.isArray(messageContent) ? 'array' : 'string');
    console.log('DEBUG: messageContent length:', Array.isArray(messageContent) ? messageContent.length : messageContent.length);
    if (hasImages && Array.isArray(messageContent)) {
      // Remove the debug log line that's causing the type error
    }
    console.log('DEBUG: Complete request body:');
    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert educational content creator. Your task is to generate study materials from the provided content (text and/or images).

**Your Tasks:**
1. **Analyze Content:** If images are provided, extract and analyze all visible text, diagrams, charts, formulas, and educational content. If text is provided, use it as the primary content.

2. **Create Comprehensive Educational Summary:** Generate a detailed, educational summary that serves as a complete learning resource. Your summary should:
   - Be 2000-3000 words long with substantial educational value
   - Cover ALL major concepts, theories, definitions, and examples from the content
   - Include detailed explanations that help students understand WHY things work, not just what they are
   - Provide context, background information, and real-world applications
   - Use clear headings and subheadings to organize information logically
   - Include step-by-step breakdowns of complex processes or concepts
   - Add relevant examples, analogies, and mnemonics to aid understanding
   - Explain connections between different concepts covered in the material
   - Include practical applications and implications of the knowledge
   - Format as comprehensive study notes that could replace a textbook chapter

3. **Create Flashcards:** Generate 8-15 flashcards based on the content. Include questions about concepts, definitions, formulas, or key information visible in images or text.

4. **Create a Quiz:** Generate a quiz with ${clampedQuestions || 5} multiple-choice questions. Each question must have 4 options (a, b, c, d) and one clearly correct answer with factual accuracy.

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
          content: messageContent
        }
      ],
      max_tokens: 6000,
      temperature: 0.4
    };
    // Test the API key first with a simple text-only request
    if (hasImages) {
      console.log('DEBUG: Testing API key with simple request first...');
      const testResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: 'Hello, can you see this message?'
            }
          ],
          max_tokens: 50
        }),
      });
      
      console.log('DEBUG: Test response status:', testResponse.status);
      if (!testResponse.ok) {
        const testError = await testResponse.text();
        console.error('DEBUG: Test API call failed:', testError);
      } else {
        console.log('DEBUG: Test API call succeeded');
      }
    }

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`${useOpenAI ? 'OpenAI' : 'DeepSeek'} API error:`, errorData);
      throw new Error(`${useOpenAI ? 'OpenAI' : 'DeepSeek'} API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`${useOpenAI ? 'OpenAI' : 'DeepSeek'} response received`);

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
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate study materials'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});