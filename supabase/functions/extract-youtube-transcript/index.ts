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
    console.log('Processing YouTube transcript extraction request');
    
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
    // Use youtube-transcript-api service (this is a free service that extracts transcripts)
    const transcriptUrl = `https://youtube-transcript-api.warnov.com/${videoId}`;
    
    const response = await fetch(transcriptUrl);
    
    if (!response.ok) {
      console.error('Transcript API response not ok:', response.status);
      throw new Error('Failed to fetch transcript from external service');
    }
    
    const data = await response.json();
    
    if (!data || data.error) {
      throw new Error(data?.error || 'No transcript data available');
    }
    
    // Extract and clean transcript text
    let transcript = '';
    if (Array.isArray(data)) {
      transcript = data.map(item => item.text || '').join(' ');
    } else if (data.transcript) {
      transcript = data.transcript;
    } else {
      throw new Error('Unexpected transcript data format');
    }
    
    // Clean up the transcript
    transcript = transcript
      .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    if (!transcript) {
      throw new Error('Transcript is empty after processing');
    }
    
    // Get video metadata using oEmbed API (free, no API key required)
    let title = 'YouTube Video';
    let duration = null;
    
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
      duration
    };
    
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw error;
  }
}