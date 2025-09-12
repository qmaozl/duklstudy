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
    
    let requestBody;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      requestBody = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON in request body' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { youtube_url, lang = 'en' } = requestBody;
    
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

    // Get transcript using improved method
    try {
      const result = await retrieveTranscript(videoId);
      
      return new Response(JSON.stringify({
        success: true,
        video_id: videoId,
        title: result.metadata.title,
        transcript: result.transcript,
        duration: result.metadata.duration
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (error) {
      console.error('Primary method failed:', error.message);
      
      // Fallback to YouTube API if available
      try {
        console.log('Attempting YouTube API fallback method');
        const apiResult = await getTranscriptViaAPI(videoId);
        
        return new Response(JSON.stringify({
          success: true,
          video_id: videoId,
          title: apiResult.title,
          transcript: apiResult.transcript,
          duration: apiResult.duration
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (apiError) {
        console.error('YouTube API fallback also failed:', apiError.message);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Unable to extract transcript: ${error.message}. This video may not have captions available or may be restricted.`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

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

async function retrieveTranscript(videoId: string) {
  const YT_INITIAL_PLAYER_RESPONSE_RE =
    /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;

  const response = await fetch('https://www.youtube.com/watch?v=' + videoId, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch video page: ${response.status}`);
  }
  
  const body = await response.text();
  const playerResponse = body.match(YT_INITIAL_PLAYER_RESPONSE_RE);
  
  if (!playerResponse) {
    throw new Error('Unable to parse playerResponse');
  }
  
  const player = JSON.parse(playerResponse[1]);
  
  if (!player.videoDetails || player.videoDetails.videoId !== videoId) {
    throw new Error('Video details mismatch or unavailable');
  }
  
  const metadata = {
    title: player.videoDetails.title,
    duration: player.videoDetails.lengthSeconds,
    author: player.videoDetails.author,
    views: player.videoDetails.viewCount,
  };
  
  // Check if captions are available
  if (!player.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
    throw new Error('No caption tracks found in video');
  }
  
  // Get the tracks and sort them by priority
  const tracks = player.captions.playerCaptionsTracklistRenderer.captionTracks;
  tracks.sort(compareTracks);

  console.log(`Found ${tracks.length} caption tracks, selected: ${tracks[0].languageCode}`);

  // Get the transcript
  const transcriptResponse = await fetch(tracks[0].baseUrl + '&fmt=json3');
  
  if (!transcriptResponse.ok) {
    throw new Error(`Failed to fetch captions: ${transcriptResponse.status}`);
  }
  
  const transcript = await transcriptResponse.json();
  
  const parsedTranscript = transcript.events
    // Remove invalid segments
    .filter((x: any) => x.segs)
    // Concatenate into single long string
    .map((x: any) => {
      return x.segs
        .map((y: any) => y.utf8)
        .join(' ');
    })
    .join(' ')
    // Remove invalid characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Replace any whitespace with a single space
    .replace(/\s+/g, ' ')
    .trim();

  console.log('EXTRACTED_TRANSCRIPT', parsedTranscript.length, 'characters');
  
  return { 
    transcript: parsedTranscript, 
    metadata: metadata 
  };
}

async function getTranscriptViaAPI(videoId: string) {
  const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
  
  if (!youtubeApiKey) {
    throw new Error('YouTube API key not configured');
  }
  
  console.log('Using YouTube Data API v3 for video:', videoId);
  
  // Get video details
  const videoResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${youtubeApiKey}`
  );
  
  if (!videoResponse.ok) {
    throw new Error(`YouTube API error: ${videoResponse.status}`);
  }
  
  const videoData = await videoResponse.json();
  
  if (!videoData.items || videoData.items.length === 0) {
    throw new Error('Video not found via YouTube API');
  }
  
  const video = videoData.items[0];
  const metadata = {
    title: video.snippet.title,
    duration: video.contentDetails.duration,
    author: video.snippet.channelTitle,
    views: null
  };
  
  // Get captions list
  const captionsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${youtubeApiKey}`
  );
  
  if (!captionsResponse.ok) {
    throw new Error(`YouTube Captions API error: ${captionsResponse.status}`);
  }
  
  const captionsData = await captionsResponse.json();
  
  if (!captionsData.items || captionsData.items.length === 0) {
    throw new Error('No captions available via YouTube API');
  }
  
  // Find the best caption track
  let selectedCaption = captionsData.items.find((item: any) => 
    item.snippet.language === 'en' && item.snippet.trackKind !== 'asr'
  ) || captionsData.items.find((item: any) => 
    item.snippet.language.startsWith('en')
  ) || captionsData.items[0];
  
  console.log(`Selected caption via API: ${selectedCaption.snippet.language}`);
  
  // Note: Getting actual caption content via API requires OAuth2 authentication
  // This is a limitation of the YouTube Data API v3
  throw new Error('YouTube Data API requires OAuth2 for caption content access');
}

function compareTracks(track1: any, track2: any) {
  const langCode1 = track1.languageCode;
  const langCode2 = track2.languageCode;

  if (langCode1 === 'en' && langCode2 !== 'en') {
    return -1; // English comes first
  } else if (langCode1 !== 'en' && langCode2 === 'en') {
    return 1; // English comes first
  } else if (track1.kind !== 'asr' && track2.kind === 'asr') {
    return -1; // Non-ASR comes first
  } else if (track1.kind === 'asr' && track2.kind !== 'asr') {
    return 1; // Non-ASR comes first
  }

  return 0; // Preserve order if both have same priority
}

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