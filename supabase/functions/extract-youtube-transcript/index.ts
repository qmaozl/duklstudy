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
    
    const { youtube_url, lang = 'en' } = await req.json();
    
    if (!youtube_url) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'YouTube URL is required' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Extracting transcript for URL:', youtube_url, 'Language:', lang);

    // Extract video ID from YouTube URL
    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid YouTube URL format' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Extracted video ID:', videoId);

    // Try multiple approaches to get transcript
    let transcript = '';
    let title = 'YouTube Video';

    // Method 1: Try youtube-transcript library with multiple language attempts
    const languagesToTry = [lang, 'en', 'en-US', 'en-GB', 'en-CA', 'en-AU'];
    let librarySuccess = false;

    for (const tryLang of languagesToTry) {
      try {
        console.log(`Attempting transcript fetch with language: ${tryLang}`);
        const transcriptChunks = await YoutubeTranscript.fetchTranscript(videoId, [tryLang]);
        
        if (transcriptChunks && transcriptChunks.length > 0) {
          transcript = transcriptChunks
            .map(chunk => chunk.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          console.log(`Successfully extracted transcript using language ${tryLang}, length:`, transcript.length);
          librarySuccess = true;
          break;
        }
      } catch (langError) {
        console.log(`Failed to fetch transcript for language ${tryLang}:`, langError.message);
      }
    }

    // Method 2: Fallback - Direct HTML parsing if library fails
    if (!librarySuccess) {
      console.log('Library method failed, attempting direct HTML parsing fallback');
      
      try {
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(watchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch video page: ${response.status}`);
        }

        const html = await response.text();
        
        // Extract ytInitialPlayerResponse
        const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/);
        if (!playerResponseMatch) {
          throw new Error('Could not find player response in HTML');
        }

        const playerResponse = JSON.parse(playerResponseMatch[1]);
        
        // Extract title from player response
        if (playerResponse.videoDetails?.title) {
          title = playerResponse.videoDetails.title;
        }

        // Look for caption tracks
        const captionTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (!captionTracks || captionTracks.length === 0) {
          throw new Error('No caption tracks found in video');
        }

        console.log(`Found ${captionTracks.length} caption tracks`);

        // Find the best caption track (prefer requested language, then English, then any)
        let selectedTrack = null;
        
        // First try: exact language match
        selectedTrack = captionTracks.find(track => track.languageCode === lang);
        
        // Second try: English variants
        if (!selectedTrack) {
          selectedTrack = captionTracks.find(track => 
            track.languageCode.startsWith('en')
          );
        }
        
        // Third try: any available track
        if (!selectedTrack) {
          selectedTrack = captionTracks[0];
        }

        console.log(`Selected caption track: ${selectedTrack.languageCode} (${selectedTrack.name?.simpleText || 'Unknown'})`);

        // Fetch caption data
        let captionUrl = selectedTrack.baseUrl;
        
        // Prefer JSON format for easier parsing
        if (!captionUrl.includes('fmt=')) {
          captionUrl += '&fmt=json3';
        }

        const captionResponse = await fetch(captionUrl);
        if (!captionResponse.ok) {
          throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
        }

        const captionData = await captionResponse.text();
        
        // Parse captions based on format
        if (captionUrl.includes('fmt=json3')) {
          // JSON format
          try {
            const jsonData = JSON.parse(captionData);
            if (jsonData.events) {
              transcript = jsonData.events
                .filter(event => event.segs)
                .map(event => 
                  event.segs
                    .map(seg => seg.utf8)
                    .join('')
                )
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
            }
          } catch (jsonError) {
            console.error('Failed to parse JSON captions:', jsonError);
            throw new Error('Failed to parse caption data');
          }
        } else {
          // VTT or other format - extract text content
          transcript = captionData
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/\d+:\d+:\d+\.\d+ --> \d+:\d+:\d+\.\d+/g, '') // Remove timestamps
            .replace(/WEBVTT/g, '') // Remove VTT header
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Clean up spaces
            .trim();
        }

        if (transcript.length > 0) {
          console.log(`Successfully extracted transcript using fallback method, length:`, transcript.length);
        } else {
          throw new Error('No transcript text could be extracted');
        }

      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError.message);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Unable to extract transcript: ${fallbackError.message}. This video may not have captions available.`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get video metadata using oEmbed API if we don't have title yet
    if (title === 'YouTube Video') {
      try {
        const metadataResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          title = metadata.title || title;
          console.log('Video title from oEmbed:', title);
        }
      } catch (metadataError) {
        console.warn('Could not fetch video metadata:', metadataError.message);
      }
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