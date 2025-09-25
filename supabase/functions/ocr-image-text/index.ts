import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const googleCloudApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    
    if (!googleCloudApiKey) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Google Cloud Vision API key not configured'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image } = await req.json();
    
    if (!image) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No image provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing OCR request...');

    // Extract base64 data from data URL if present
    let base64Image = image;
    if (image.startsWith('data:image/')) {
      base64Image = image.split(',')[1];
    }

    // Prepare Google Cloud Vision API request
    const visionRequest = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    // Call Google Cloud Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleCloudApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visionRequest),
      }
    );

    if (!visionResponse.ok) {
      const errorData = await visionResponse.text();
      console.error('Google Cloud Vision API error:', errorData);
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    
    // Extract text from the response
    let extractedText = '';
    
    if (visionData.responses && visionData.responses[0]) {
      const annotations = visionData.responses[0].textAnnotations;
      
      if (annotations && annotations.length > 0) {
        // The first annotation contains the full detected text
        extractedText = annotations[0].description || '';
      }
    }

    console.log('OCR completed. Text length:', extractedText.length);

    if (!extractedText.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No text could be extracted from the image'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      text: extractedText.trim(),
      confidence: 'high' // Google Cloud Vision typically provides high accuracy
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in OCR function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});