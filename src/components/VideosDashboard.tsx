import React, { useState, useEffect } from 'react';
import { Youtube, Calendar, Trophy, Clock, BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StudyMaterial {
  id: string;
  title: string;
  source_type: string;
  original_content: string;
  summary: string;
  flashcards: any;
  quiz: any;
  points_earned: number;
  created_at: string;
  key_concepts: any;
}

interface DashboardStats {
  totalVideos: number;
  totalPoints: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface VideosDashboardProps {
  onSelectVideo: (material: any) => void;
}

const VideosDashboard: React.FC<VideosDashboardProps> = ({ onSelectVideo }) => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalPoints: 0,
    totalQuestions: 0,
    correctAnswers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserMaterials();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user?.id)
        .eq('source_type', 'youtube_video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials((data || []) as StudyMaterial[]);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Error",
        description: "Failed to load your videos.",
        variant: "destructive",
      });
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get total videos
      const { count: totalVideos } = await supabase
        .from('study_materials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('source_type', 'youtube_video');

      // Get quiz results
      const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user?.id);

      const totalQuestions = quizResults?.length || 0;
      const correctAnswers = quizResults?.filter(r => r.is_correct).length || 0;
      const totalPoints = quizResults?.reduce((sum, r) => sum + (r.points_earned || 0), 0) || 0;

      setStats({
        totalVideos: totalVideos || 0,
        totalPoints,
        totalQuestions,
        correctAnswers
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your dashboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Youtube className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalVideos}</p>
                <p className="text-xs text-muted-foreground">Videos Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Points Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Questions Answered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Your Processed Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No videos processed yet. Start by entering a YouTube URL above!</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {materials.map((material) => {
                  const videoId = getYouTubeVideoId(material.original_content);
                  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
                  
                  return (
                    <Card key={material.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          {thumbnailUrl && (
                            <div className="flex-shrink-0">
                              <img 
                                src={thumbnailUrl} 
                                alt="Video thumbnail" 
                                className="w-24 h-16 object-cover rounded"
                              />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">
                                {material.title.replace('Video Study: ', '')}
                              </h4>
                              <Badge variant="secondary" className="ml-2">
                                +{material.points_earned} pts
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(material.created_at)}
                              </span>
                              <span>{(material.quiz as any)?.questions?.length || 0} questions</span>
                              <span>{(material.flashcards as any)?.length || 0} flashcards</span>
                            </div>
                            
                            {material.key_concepts && material.key_concepts.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {material.key_concepts.slice(0, 3).map((concept, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {concept}
                                  </Badge>
                                ))}
                                {material.key_concepts.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{material.key_concepts.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm" 
                                onClick={() => onSelectVideo(material)}
                                className="text-xs"
                              >
                                Study Again
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(material.original_content, '_blank')}
                                className="text-xs"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Original Video
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VideosDashboard;