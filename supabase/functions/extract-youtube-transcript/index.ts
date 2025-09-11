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
      status: 200,
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
    
    // First, try to get the caption list to find available caption tracks
    const captionListUrls = [
      `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`,
      `https://video.google.com/timedtext?type=list&v=${videoId}`,
    ];
    
    let availableCaptions = [];
    
    for (const listUrl of captionListUrls) {
      try {
        console.log(`Trying caption list URL: ${listUrl}`);
        const listResponse = await fetch(listUrl);
        if (listResponse.ok) {
          const listXml = await listResponse.text();
          console.log(`Caption list response length: ${listXml.length}`);
          
          if (listXml && listXml.includes('<track')) {
            // Parse the available caption tracks
            const trackMatches = listXml.match(/<track[^>]*>/g);
            if (trackMatches) {
              trackMatches.forEach(track => {
                const langMatch = track.match(/lang_code="([^"]+)"/);
                const nameMatch = track.match(/name="([^"]+)"/);
                const kindMatch = track.match(/kind="([^"]+)"/);
                
                if (langMatch) {
                  availableCaptions.push({
                    lang: langMatch[1],
                    name: nameMatch ? nameMatch[1] : '',
                    kind: kindMatch ? kindMatch[1] : ''
                  });
                }
              });
              console.log(`Found ${availableCaptions.length} available captions:`, availableCaptions);
              break;
            }
          }
        }
      } catch (error) {
        console.log(`Caption list method failed: ${error.message}`);
        continue;
      }
    }
    
    // Build transcript URLs based on available captions and fallbacks
    const transcriptUrls = [];
    
    // Add URLs based on found captions
    availableCaptions.forEach(caption => {
      transcriptUrls.push(
        `https://www.youtube.com/api/timedtext?lang=${caption.lang}&v=${videoId}&fmt=srv3`,
        `https://www.youtube.com/api/timedtext?lang=${caption.lang}&v=${videoId}&fmt=vtt`,
        `https://www.youtube.com/api/timedtext?lang=${caption.lang}&v=${videoId}`,
        `https://video.google.com/timedtext?lang=${caption.lang}&v=${videoId}&fmt=srv3`,
        `https://video.google.com/timedtext?lang=${caption.lang}&v=${videoId}&fmt=vtt`,
        `https://video.google.com/timedtext?lang=${caption.lang}&v=${videoId}`
      );
      
      if (caption.kind === 'asr' || caption.name.includes('auto')) {
        transcriptUrls.push(
          `https://www.youtube.com/api/timedtext?lang=${caption.lang}&v=${videoId}&kind=asr`,
          `https://video.google.com/timedtext?lang=${caption.lang}&v=${videoId}&kind=asr`
        );
      }
    });
    
    // Add standard fallback URLs for common languages
    const fallbackUrls = [
      // English variants
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?lang=en-GB&v=${videoId}&fmt=srv3`,
      `https://video.google.com/timedtext?lang=en&v=${videoId}&fmt=srv3`,
      `https://video.google.com/timedtext?lang=en&v=${videoId}&fmt=vtt`,
      `https://video.google.com/timedtext?lang=en&v=${videoId}`,
      // Auto-generated captions
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&kind=asr`,
      `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}&kind=asr`,
      `https://video.google.com/timedtext?lang=en&v=${videoId}&kind=asr`,
      // Try without language specification
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?v=${videoId}`,
      `https://video.google.com/timedtext?v=${videoId}&fmt=srv3`,
      `https://video.google.com/timedtext?v=${videoId}&fmt=vtt`,
      `https://video.google.com/timedtext?v=${videoId}`
    ];
    
    // Combine and deduplicate URLs
    const allUrls = [...new Set([...transcriptUrls, ...fallbackUrls])];
    
    console.log(`Trying ${allUrls.length} transcript URLs...`);
    
    for (const url of allUrls) {
      try {
        console.log(`Trying transcript URL: ${url}`);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const xmlText = await response.text();
          console.log(`Got response, length: ${xmlText.length}`);
          console.log(`Response preview: ${xmlText.substring(0, 200)}...`);
          
          if (xmlText && (xmlText.includes('<text') || xmlText.includes('WEBVTT') || xmlText.includes('<transcript'))) {
            const result = await parseTranscriptXML(xmlText, videoId);
            if (result.transcript && result.transcript.length > 50) {
              console.log(`Successfully extracted transcript: ${result.transcript.substring(0, 100)}...`);
              return result;
            }
          }
        } else {
          console.log(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (methodError) {
        console.log(`Method failed: ${methodError.message}`);
        continue;
      }
    }
    
    // If all methods fail, throw an error to stop processing
    throw new Error('No transcript available for this video. The video may not have captions enabled, or the captions may not be publicly accessible. Please try a different video.');
    
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw error;
  }
}

async function parseTranscriptXML(xmlText: string, videoId: string) {
  try {
    console.log('Parsing transcript content...');
    
    let transcript = '';
    
    // Handle WEBVTT format
    if (xmlText.includes('WEBVTT')) {
      console.log('Parsing WEBVTT format');
      const lines = xmlText.split('\n');
      const textLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip WEBVTT header, timestamps, and empty lines
        if (line && 
            !line.startsWith('WEBVTT') && 
            !line.includes('-->') && 
            !line.match(/^\d+$/) &&
            !line.startsWith('NOTE ') &&
            !line.startsWith('STYLE ')) {
          // Remove HTML tags and clean up
          const cleanLine = line
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          
          if (cleanLine) {
            textLines.push(cleanLine);
          }
        }
      }
      
      transcript = textLines.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    // Handle XML format (timedtext)
    else if (xmlText.includes('<text') || xmlText.includes('<transcript')) {
      console.log('Parsing XML timedtext format');
      
      // Extract text content from XML tags
      const textMatches = xmlText.match(/<text[^>]*>([^<]*)<\/text>/g);
      
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
            .filter(text => text.length > 0 && !text.match(/^\d+(\.\d+)?$/)) // Skip pure numbers (timestamps)
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
    }
    
    // Handle plain text format
    else {
      console.log('Parsing as plain text');
      transcript = xmlText
        .replace(/<[^>]*>/g, '') // Remove any HTML tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    if (!transcript || transcript.length < 50) {
      throw new Error(`Transcript text is too short or empty. Length: ${transcript.length}`);
    }
    
    console.log(`Parsed transcript length: ${transcript.length}`);
    console.log(`Transcript preview: ${transcript.substring(0, 200)}...`);
    
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
    console.error('Error parsing transcript:', error);
    throw error;
  }
}