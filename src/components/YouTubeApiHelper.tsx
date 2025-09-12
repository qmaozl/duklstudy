import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, Video, Clock, Eye, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface YouTubeVideoInfo {
  id: string;
  title: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  tags?: string[];
}

export const YouTubeApiHelper: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchVideos = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: searchQuery, maxResults: 10 }
      });

      if (error) throw error;

      if (data.success) {
        setVideos(data.videos);
        toast({
          title: "Success",
          description: `Found ${data.videos.length} videos`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search YouTube",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            YouTube Video Search
          </CardTitle>
          <CardDescription>
            Search for YouTube videos using the YouTube Data API v3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search for videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
            />
            <Button onClick={searchVideos} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {videos.length > 0 && (
        <div className="grid gap-4">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden">
              <div className="flex">
                <img
                  src={video.thumbnails.medium.url}
                  alt={video.title}
                  className="w-48 h-36 object-cover"
                />
                <CardContent className="flex-1 p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {video.channelTitle}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {formatViewCount(video.viewCount)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(video.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(video.publishedAt)}
                      </div>
                    </div>

                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {video.tags.slice(0, 5).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {video.tags.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{video.tags.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Watch
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`);
                          toast({
                            title: "Copied!",
                            description: "YouTube URL copied to clipboard"
                          });
                        }}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};