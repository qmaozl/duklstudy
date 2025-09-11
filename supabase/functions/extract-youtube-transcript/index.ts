import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="npm:@types/youtube-transcript@1.0.0"
import { YoutubeTranscript } from "npm:youtube-transcript@1.2.1";

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

    console.log('Extracting transcript for URL:', youtube_url);

    // Extract video ID from YouTube URL
    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }

    console.log('Extracted video ID:', videoId);

    // Use the youtube-transcript library to fetch the transcript
    const transcriptChunks = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptChunks || transcriptChunks.length === 0) {
      throw new Error('No transcript available for this video');
    }

    // Combine the transcript chunks into a single paragraph
    const transcript = transcriptChunks
      .map(chunk => chunk.text)
      .join(' ')
      .replace(/\s+/g, ' ')  // Clean up multiple spaces
      .trim();

    console.log('Successfully extracted transcript, length:', transcript.length);

    // Get video metadata using oEmbed API
    let title = 'YouTube Video';
    
    try {
      const metadataResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        title = metadata.title || title;
        console.log('Video title:', title);
      }
    } catch (metadataError) {
      console.warn('Could not fetch video metadata:', metadataError.message);
    }
    
    return new Response(JSON.stringify({
      success: true,
      video_id: videoId,
      title: title,
      transcript: transcript,
      duration: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-youtube-transcript function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractVideoId(url: string): string | null {
  // More comprehensive video ID extraction patterns
  const patterns = [
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([0-9A-Za-z_-]{11})/,
    // Short URL: https://youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([0-9A-Za-z_-]{11})/,
    // Embed URL: https://www.youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([0-9A-Za-z_-]{11})/,
    // YouTube video URL with additional parameters
    /(?:youtube\.com\/.*[?&]v=)([0-9A-Za-z_-]{11})/,
    // Mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
    /(?:m\.youtube\.com\/watch\?v=)([0-9A-Za-z_-]{11})/,
    // YouTube gaming URL
    /(?:gaming\.youtube\.com\/watch\?v=)([0-9A-Za-z_-]{11})/,
    // YouTube music URL
    /(?:music\.youtube\.com\/watch\?v=)([0-9A-Za-z_-]{11})/,
  ];
  
  // If it's already just a video ID (11 characters, alphanumeric + _ and -)
  if (url.match(/^[0-9A-Za-z_-]{11}$/)) {
    return url;
  }
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}