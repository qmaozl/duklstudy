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
    const { youtube_url } = await req.json();
    
    if (!youtube_url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'YouTube URL is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    // Try alternative transcript extraction using a different approach
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
    const captionUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3&name=`;
    const response = await fetch(captionUrl);
    
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
      console.log('Found auto-generated captions');
      
      const transcript = data.events
        ?.filter((event: any) => event.segs)
        ?.map((event: any) => 
          event.segs.map((seg: any) => seg.utf8).join(' ')
        )
        ?.join(' ')
        ?.replace(/\s+/g, ' ')
        ?.trim();

      if (transcript && transcript.length > 100) {
        return {
          text: transcript,
          title: `Video ${videoId}`,
          duration: 'Unknown'
        };
      }
      }
    }
  } catch (e) {
    console.log('Auto-generated captions method failed:', e);
  }

  // Method 2: Try to extract from embed page
  try {
    console.log('Trying embed page method');
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const embedResponse = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (embedResponse.ok) {
      const embedHtml = await embedResponse.text();
      
      // Try to extract caption tracks from embed page
      const captionMatch = embedHtml.match(/"captionTracks":\s*(\[.*?\])/);
      if (captionMatch) {
        const tracks = JSON.parse(captionMatch[1]);
        console.log(`Found ${tracks.length} caption tracks in embed`);
        
        const englishTrack = tracks.find((track: any) => 
          track.languageCode === 'en' || track.languageCode?.startsWith('en')
        ) || tracks[0];

        if (englishTrack?.baseUrl) {
          const transcriptResponse = await fetch(englishTrack.baseUrl + '&fmt=json3');
          
          if (transcriptResponse.ok) {
            const transcriptData = await transcriptResponse.json();
            const transcript = transcriptData.events
              ?.filter((event: any) => event.segs)
              ?.map((event: any) => 
                event.segs.map((seg: any) => seg.utf8).join(' ')
              )
              ?.join(' ')
              ?.replace(/\s+/g, ' ')
              ?.trim();

            if (transcript && transcript.length > 100) {
              return {
                text: transcript,
                title: `Video ${videoId}`,
                duration: 'Unknown'
              };
            }
          }
        }
      }
    }
  } catch (e) {
    console.log('Embed page method failed:', e);
  }

  // Method 3: Use YouTube Data API to get video info and attempt transcript
  const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
  if (youtubeApiKey) {
    try {
      console.log('Trying YouTube Data API method');
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`
      );

      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        if (videoData.items?.[0]) {
          const video = videoData.items[0];
          
          // Return video info even if we can't get transcript
          // This allows the system to proceed with other processing
          return {
            text: `Video titled "${video.snippet.title}" by ${video.snippet.channelTitle}. Description: ${video.snippet.description?.substring(0, 500) || 'No description available.'}`,
            title: video.snippet.title,
            duration: 'Unknown',
            isDescriptionFallback: true
          };
        }
      }
    } catch (e) {
      console.log('YouTube Data API method failed:', e);
    }
  }

  throw new Error('Unable to extract transcript using any available method. This video may not have captions available, may be restricted, or may require special permissions to access.');
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([0-9A-Za-z_-]{11})/,
    /(?:youtu\.be\/)([0-9A-Za-z_-]{11})/,
    /(?:youtube\.com\/embed\/)([0-9A-Za-z_-]{11})/,
    /(?:youtube\.com\/.*[?&]v=)([0-9A-Za-z_-]{11})/,
  ];
  
  if (url.match(/^[0-9A-Za-z_-]{11}$/)) {
    return url;
  }
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  
  return null;
}