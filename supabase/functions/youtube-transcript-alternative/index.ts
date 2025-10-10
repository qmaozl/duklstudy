import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  youtube_url: z.string().url().min(10).max(500)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { youtube_url } = validationResult.data;

    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid YouTube URL format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing video ID: ${videoId}`);

    const transcript = await getTranscriptAlternative(videoId);
    
    return new Response(JSON.stringify({
      success: true,
      video_id: videoId,
      title: transcript.title,
      transcript: transcript.text,
      duration: transcript.duration,
      method: 'alternative'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Alternative transcript extraction error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract transcript'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getTranscriptAlternative(videoId: string) {
  console.log(`Alternative method for video: ${videoId}`);

  // Method 1: Try to get auto-generated captions directly
  try {
    console.log('Trying Method 1: Direct caption extraction');
    const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
    
    const captionResponse = await fetch(captionUrl);
    
    if (captionResponse.ok) {
      const captionData = await captionResponse.json();
      
      if (captionData.events && Array.isArray(captionData.events)) {
        const text = captionData.events
          .filter((event: any) => event.segs)
          .map((event: any) => 
            event.segs.map((seg: any) => seg.utf8).join('')
          )
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (text) {
          console.log('Successfully extracted captions via Method 1');
          return {
            text,
            title: `Video ${videoId}`,
            duration: 'Unknown'
          };
        }
      }
    }
  } catch (error) {
    console.log('Method 1 failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Method 2: Try to get caption tracks from embed page
  try {
    console.log('Trying Method 2: Embed page parsing');
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const embedResponse = await fetch(embedUrl);
    
    if (embedResponse.ok) {
      const html = await embedResponse.text();
      
      // Try to extract caption track URLs from the embed page
      const captionTrackMatch = html.match(/"captionTracks":\[([^\]]+)\]/);
      
      if (captionTrackMatch) {
        const tracks = JSON.parse(`[${captionTrackMatch[1]}]`);
        
        if (tracks.length > 0) {
          const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
          
          if (track && track.baseUrl) {
            const transcriptResponse = await fetch(track.baseUrl);
            
            if (transcriptResponse.ok) {
              const transcriptXml = await transcriptResponse.text();
              
              // Parse XML to extract text
              const textMatches = transcriptXml.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
              const text = Array.from(textMatches)
                .map(match => match[1])
                .join(' ')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/\s+/g, ' ')
                .trim();
              
              if (text) {
                console.log('Successfully extracted captions via Method 2');
                return {
                  text,
                  title: `Video ${videoId}`,
                  duration: 'Unknown'
                };
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('Method 2 failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Method 3: Use YouTube Data API as fallback (if API key is available)
  const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
  if (youtubeApiKey) {
    try {
      console.log('Trying Method 3: YouTube Data API');
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${youtubeApiKey}`;
      
      const apiResponse = await fetch(apiUrl);
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        
        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          
          // Return video description as fallback
          return {
            text: video.snippet.description || 'No transcript available. Using video description as fallback.',
            title: video.snippet.title,
            duration: video.contentDetails.duration,
            isDescriptionFallback: true
          };
        }
      }
    } catch (error) {
      console.log('Method 3 failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  throw new Error('Unable to extract transcript using any available method');
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}
