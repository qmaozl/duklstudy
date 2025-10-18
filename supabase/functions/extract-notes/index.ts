import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file, fileType } = await req.json();
    
    if (!file || !fileType) {
      return new Response(
        JSON.stringify({ error: 'File and fileType are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let extractedText = '';

    if (fileType === 'image') {
      // Use Lovable AI for OCR
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('Lovable API key not configured');
      }

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: file
                }
              },
              {
                type: 'text',
                text: 'Extract all text from this image. Return ONLY the extracted text, nothing else. If there are handwritten notes, typed text, or any written content, transcribe it accurately.'
              }
            ]
          }]
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        throw new Error(`AI API failed with status ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      extractedText = aiData.choices?.[0]?.message?.content || '';
    } else if (fileType === 'pdf') {
      // For PDF, extract text using a simple approach
      // Note: This is a basic implementation. For production, consider using pdf-parse or similar
      const base64Data = file.replace(/^data:application\/pdf;base64,/, '');
      const pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Convert PDF bytes to text (basic text extraction)
      const decoder = new TextDecoder('utf-8');
      extractedText = decoder.decode(pdfBytes);
      
      // Clean up the text (remove PDF markers and control characters)
      extractedText = extractedText
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (!extractedText) {
      return new Response(
        JSON.stringify({ error: 'No text could be extracted from the file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting notes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
