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
    console.log('Processing YouTube transcript extraction request');
    
    if (!deepseekApiKey) {
      throw new Error('DeepSeek API key not found');
    }
    
    const { youtube_url } = await req.json();
    
    if (!youtube_url) {
      throw new Error('YouTube URL is required');
    }

    // Extract video ID from YouTube URL
    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }

    console.log('Extracting transcript for video ID:', videoId);

    // Use YouTube Data API to get video details and captions
    const transcriptData = await getYouTubeTranscript(videoId);
    
    if (!transcriptData || !transcriptData.transcript) {
      throw new Error('No transcript available for this video');
    }

    console.log('Successfully extracted transcript');
    
    return new Response(JSON.stringify({
      success: true,
      video_id: videoId,
      title: transcriptData.title,
      transcript: transcriptData.transcript,
      duration: transcriptData.duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-youtube-transcript function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

async function getYouTubeTranscript(videoId: string) {
  try {
    console.log(`Attempting to fetch transcript for video ID: ${videoId}`);
    
    // Try multiple methods to get transcript
    const methods = [
      // Method 1: Try different language codes and formats
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?lang=en-GB&v=${videoId}`,
      // Try auto-generated captions
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&kind=asr`,
      `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}&kind=asr`,
    ];
    
    for (const url of methods) {
      try {
        console.log(`Trying transcript URL: ${url}`);
        const response = await fetch(url);
        
        if (response.ok) {
          const xmlText = await response.text();
          console.log(`Got response, length: ${xmlText.length}`);
          
          if (xmlText && xmlText.includes('<text')) {
            const result = await parseTranscriptXML(xmlText, videoId);
            if (result.transcript && result.transcript.length > 50) {
              console.log(`Successfully extracted transcript: ${result.transcript.substring(0, 100)}...`);
              return result;
            }
          }
        }
      } catch (methodError) {
        console.log(`Method failed: ${methodError.message}`);
        continue;
      }
    }
    
    // If all methods fail, throw an error to stop processing
    throw new Error('No transcript available for this video. Please try a different video that has closed captions or subtitles enabled.');
    
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw error; // Don't continue processing, let the error bubble up
  }
}

async function parseTranscriptXML(xmlText: string, videoId: string) {
  try {
    console.log('Parsing transcript XML...');
    
    // Extract text content from XML tags
    const textMatches = xmlText.match(/<text[^>]*>([^<]*)<\/text>/g);
    let transcript = '';
    
    if (textMatches && textMatches.length > 0) {
      transcript = textMatches
        .map(match => {
          // Extract text content between tags
          const textContent = match.replace(/<text[^>]*>/, '').replace(/<\/text>/, '');
          return textContent;
        })
        .join(' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Also try alternative parsing method for different XML formats
    if (!transcript) {
      const altMatches = xmlText.match(/>([^<]+)</g);
      if (altMatches) {
        transcript = altMatches
          .map(match => match.slice(1, -1).trim())
          .filter(text => text.length > 0)
          .join(' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
    
    if (!transcript || transcript.length < 50) {
      throw new Error('Transcript text is too short or empty');
    }
    
    console.log(`Parsed transcript length: ${transcript.length}`);
    
    // Get video metadata using oEmbed API
    let title = 'YouTube Video';
    
    try {
      const metadataResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        title = metadata.title || title;
      }
    } catch (metadataError) {
      console.warn('Could not fetch video metadata:', metadataError);
    }
    
    return {
      title,
      transcript,
      duration: null
    };
    
  } catch (error) {
    console.error('Error parsing transcript XML:', error);
    throw error;
  }
}