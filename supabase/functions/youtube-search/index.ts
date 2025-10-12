import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Simple in-memory store (resets per function cold start)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60000; // 1 minute in milliseconds

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(clientId);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input validation schema
const requestSchema = z.object({
  query: z.string().min(1).max(500),
  maxResults: z.number().int().min(1).max(50).default(10),
  type: z.enum(['video', 'channel', 'playlist']).default('video')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }

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

    const { query, maxResults, type } = validationResult.data;

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'YouTube API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Searching YouTube for:', query);

    // Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=${type}&maxResults=${maxResults}&key=${youtubeApiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      throw new Error(`YouTube Search API error: ${searchResponse.status}. ${errorData.error?.message || ''}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        videos: [],
        message: 'No videos found for this search query'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get video IDs to fetch detailed information
    const videoIds = searchData.items
      .filter((item: any) => item.id.kind === 'youtube#video')
      .map((item: any) => item.id.videoId)
      .join(',');

    if (!videoIds) {
      return new Response(JSON.stringify({
        success: true,
        videos: [],
        message: 'No videos found in search results'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get detailed video information
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${youtubeApiKey}`;
    
    const videosResponse = await fetch(videosUrl);
    
    if (!videosResponse.ok) {
      const errorData = await videosResponse.json().catch(() => ({}));
      throw new Error(`YouTube Videos API error: ${videosResponse.status}. ${errorData.error?.message || ''}`);
    }

    const videosData = await videosResponse.json();

    // Format the response
    const videos = videosData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics?.viewCount || '0',
      likeCount: video.statistics?.likeCount || '0',
      commentCount: video.statistics?.commentCount || '0',
      thumbnails: video.snippet.thumbnails,
      tags: video.snippet.tags || [],
      categoryId: video.snippet.categoryId,
      liveBroadcastContent: video.snippet.liveBroadcastContent,
      url: `https://www.youtube.com/watch?v=${video.id}`
    }));

    console.log(`Found ${videos.length} videos for query: "${query}"`);

    return new Response(JSON.stringify({
      success: true,
      videos,
      totalResults: searchData.pageInfo?.totalResults || videos.length,
      nextPageToken: searchData.nextPageToken
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('YouTube search error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search YouTube videos'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
