import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Youtube, Sparkles, Loader2, Trophy, BookX, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import VideosDashboard from '@/components/VideosDashboard';
import EnhancedQuizQuestion from '@/components/EnhancedQuizQuestion';
import WrongAnswersReview from '@/components/WrongAnswersReview';
import { YouTubeApiHelper } from '@/components/YouTubeApiHelper';

interface StudyMaterial {
  id?: string;
  summary: string;
  flashcards: Array<{ question: string; answer: string }>;
  quiz: {
    questions: Array<{
      question: string;
      options: { a: string; b: string; c: string; d: string };
      correct_answer: string;
    }>;
  };
  sources: string[];
  key_concepts: string[];
}

interface VideoData {
  title: string;
  transcript: string;
  video_id: string;
  duration?: string;
}

interface QuizQuestionProps {
  question: {
    question: string;
    options: { a: string; b: string; c: string; d: string };
    correct_answer: string;
  };
  questionNumber: number;
}


const VideoSummarizer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<string>('5');
  const [activeTab, setActiveTab] = useState<string>('new-video');
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([]);
  const [currentStudyMaterialId, setCurrentStudyMaterialId] = useState<string>('');

  const processVideo = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Validate YouTube URL format
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    if (!youtubeRegex.test(youtubeUrl)) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStudyMaterial(null);
    setVideoData(null);
    
    try {
      // Step 1: Extract YouTube transcript with fallback methods
      setCurrentStep('Extracting video transcript...');
      
      let transcriptData = null;
      let transcriptError = null;

      // Try primary method first
      try {
        const { data, error } = await supabase.functions.invoke('extract-youtube-transcript', {
          body: { youtube_url: youtubeUrl }
        });

        if (error) throw error;
        if (data?.success) {
          transcriptData = data;
        } else {
          throw new Error(data?.error || 'Primary method failed');
        }
      } catch (primaryError) {
        console.log('Primary transcript method failed:', primaryError);
        transcriptError = primaryError;
        
        // Try alternative method
        try {
          setCurrentStep('Trying alternative transcript extraction...');
          console.log('Trying alternative transcript extraction method...');
          const { data: altData, error: altError } = await supabase.functions.invoke('youtube-transcript-alternative', {
            body: { youtube_url: youtubeUrl }
          });

          if (altError) throw altError;
          if (altData?.success) {
            transcriptData = altData;
            toast({
              title: "Using Alternative Method",
              description: altData.isDescriptionFallback 
                ? "Transcript unavailable, using video description instead"
                : "Successfully extracted using alternative method",
              duration: 3000,
            });
          } else {
            throw new Error(altData?.error || 'Alternative method failed');
          }
        } catch (altError) {
          console.log('Alternative method also failed:', altError);
          throw transcriptError; // Throw the original error
        }
      }

      if (!transcriptData?.success) {
        throw new Error('Unable to extract transcript from this video. This may be because:\n• The video has no captions or transcripts\n• The video is private or restricted\n• The video uses non-standard caption formats\n\nPlease try a different video that has closed captions enabled.');
      }

      const extractedVideoData: VideoData = {
        title: transcriptData.title,
        transcript: transcriptData.transcript,
        video_id: transcriptData.video_id,
        duration: transcriptData.duration
      };
      
      setVideoData(extractedVideoData);

      // Check if transcript is meaningful (not just error message)
      if (extractedVideoData.transcript.length < 50) {
        throw new Error('Transcript too short or invalid. Please try a different video that has closed captions enabled.');
      }

      // Step 2: Correct and enhance the transcript
      setCurrentStep('Processing transcript content...');
      const { data: correctedData, error: correctionError } = await supabase.functions.invoke('correct-enhance-text', {
        body: { raw_text: extractedVideoData.transcript }
      });

      if (correctionError) throw correctionError;
      
      if (!correctedData.success) {
        throw new Error(correctedData.error || 'Failed to process transcript content');
      }
      
      const { corrected_text, key_concepts } = correctedData;

      // Step 3: Find relevant sources
      setCurrentStep('Finding relevant learning sources...');
      const { data: sourcesData, error: sourcesError } = await supabase.functions.invoke('find-relevant-sources', {
        body: { key_concepts }
      });

      if (sourcesError) throw sourcesError;

      if (!sourcesData.success) {
        throw new Error(sourcesData.error || 'Failed to find relevant sources');
      }

      // Step 4: Generate study materials
      setCurrentStep('Generating study materials...');
      const { data: materialsData, error: materialsError } = await supabase.functions.invoke('generate-study-materials', {
        body: { 
          corrected_text,
          num_questions: parseInt(numQuestions)
        }
      });

      if (materialsError) throw materialsError;

      if (!materialsData.success) {
        throw new Error(materialsData.error || 'Failed to generate study materials');
      }

      // Combine all the results
      const fullStudyMaterial: StudyMaterial = {
        ...materialsData,
        sources: [...(sourcesData.sources || []), `Original Video: ${extractedVideoData.title}`],
        key_concepts
      };

      setStudyMaterial(fullStudyMaterial);

      // Save to database
      if (user) {
        const { data: savedMaterial, error: saveError } = await supabase
          .from('study_materials')
          .insert({
            user_id: user.id,
            title: `Video Study: ${extractedVideoData.title}`,
            source_type: 'youtube_video',
            original_content: youtubeUrl,
            corrected_text,
            key_concepts,
            summary: fullStudyMaterial.summary,
            flashcards: fullStudyMaterial.flashcards,
            quiz: fullStudyMaterial.quiz,
            sources: fullStudyMaterial.sources,
            points_earned: 15 // Extra points for video processing
          })
          .select()
          .single();

        if (!saveError && savedMaterial) {
          setCurrentStudyMaterialId(savedMaterial.id);
          toast({
            title: "Success!",
            description: "Video transcript processed and study materials generated successfully!",
          });
        }
      }

    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const handleVideoSelect = (material: StudyMaterial) => {
    setStudyMaterial(material);
    setCurrentStudyMaterialId(material.id);
    setActiveTab('study');
  };

  const handlePointsEarned = (points: number) => {
    setTotalPointsEarned(prev => prev + points);
  };

  const handleWrongAnswer = (questionData: any, selectedAnswer: string) => {
    setWrongAnswers(prev => [...prev, { questionData, selectedAnswer }]);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-500" />
              <h1 className="text-2xl font-bold">AI Video Study Hub</h1>
            </div>
          </div>
          
          {totalPointsEarned > 0 && (
            <Badge className="bg-yellow-500 text-white">
              <Trophy className="h-4 w-4 mr-1" />
              Session Points: +{totalPointsEarned}
            </Badge>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              My Videos
            </TabsTrigger>
            <TabsTrigger value="new-video" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Video
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Study Materials
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <BookX className="h-4 w-4" />
              Review Mistakes
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <VideosDashboard onSelectVideo={handleVideoSelect} />
          </TabsContent>

          {/* New Video Tab */}
          <TabsContent value="new-video" className="space-y-6">
            {/* YouTube Search Helper */}
            <Card>
              <CardContent className="p-6">
                <YouTubeApiHelper />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Youtube className="h-5 w-5 text-red-500" />
                      Process New YouTube Video
                    </CardTitle>
                  </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={isProcessing}
                  className="font-mono text-sm"
                />
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Quiz Questions:</span>
                  <Select 
                    value={numQuestions} 
                    onValueChange={setNumQuestions}
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="7">7</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                        </SelectContent>
                  </Select>
                </div>
                
                {videoData && (
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Video Details</h4>
                        <p className="text-sm text-muted-foreground">{videoData.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Video ID: {videoData.video_id}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Paste any YouTube video URL
                  </span>
                  <Button 
                    onClick={() => {
                      processVideo();
                      setActiveTab('study');
                    }}
                    disabled={isProcessing || !youtubeUrl.trim()}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isProcessing ? 'Processing...' : 'Extract & Summarize'}
                  </Button>
                </div>
                {isProcessing && currentStep && (
                  <div className="text-sm text-muted-foreground text-center">
                    {currentStep}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <h4 className="font-semibold text-foreground">How it works:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Extracts the video transcript automatically</li>
                    <li>Corrects and enhances the text content</li>
                    <li>Generates comprehensive summaries</li>
                    <li>Creates flashcards for key concepts</li>
                    <li>Builds practice quizzes</li>
                    <li>Finds relevant learning resources</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Processing Preview */}
            <div className="space-y-4">
              {studyMaterial ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      New Study Materials Generated
                      <Badge variant="secondary">Ready to Study</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <p className="text-lg font-medium mb-2">🎉 Materials Ready!</p>
                      <p className="text-muted-foreground mb-4">
                        Your video has been processed and study materials are ready.
                      </p>
                      <Button 
                        onClick={() => setActiveTab('study')}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Start Studying
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center text-muted-foreground">
                      <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50 text-red-500" />
                      <p>Enter a YouTube URL above to generate AI-powered study materials.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            </div>
          </TabsContent>

          {/* Study Materials Tab */}
          <TabsContent value="study" className="space-y-6">
            {studyMaterial ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Study Materials
                      <Badge variant="secondary">Interactive Learning</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                        <TabsTrigger value="quiz">Quiz</TabsTrigger>
                        <TabsTrigger value="sources">Sources</TabsTrigger>
                      </TabsList>

                    <TabsContent value="summary" className="space-y-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Key Concepts</h4>
                            <div className="flex flex-wrap gap-2">
                              {studyMaterial.key_concepts.map((concept, index) => (
                                <Badge key={index} variant="secondary">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <p className="text-sm leading-relaxed">
                              {studyMaterial.summary}
                            </p>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="flashcards" className="space-y-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {studyMaterial.flashcards.map((card, index) => (
                            <Card key={index} className="border-l-4 border-l-primary">
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">QUESTION</span>
                                    <p className="text-sm font-medium">{card.question}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">ANSWER</span>
                                    <p className="text-sm">{card.answer}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                      <TabsContent value="quiz" className="space-y-4">
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <h4 className="font-semibold">Interactive Quiz</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Earn 10 points for each correct answer. Wrong answers will be saved for review!
                          </p>
                        </div>
                        
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {studyMaterial.quiz.questions.map((question, index) => (
                              <EnhancedQuizQuestion 
                                key={`${currentStudyMaterialId}-${index}`}
                                question={question} 
                                questionNumber={index + 1}
                                studyMaterialId={currentStudyMaterialId}
                                onPointsEarned={handlePointsEarned}
                                onWrongAnswer={handleWrongAnswer}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                    <TabsContent value="sources" className="space-y-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {studyMaterial.sources.map((source, index) => (
                            <Card key={index} className="border-l-4 border-l-accent">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm">{source}</p>
                                  <Button size="sm" variant="ghost">
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Study Material Selected</h3>
                    <p>Select a video from your dashboard or process a new one to start studying.</p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button 
                        variant="outline"
                        onClick={() => setActiveTab('dashboard')}
                      >
                        View My Videos
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('new-video')}
                      >
                        Process New Video
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Review Mistakes Tab */}
          <TabsContent value="review" className="space-y-6">
            <WrongAnswersReview onPointsEarned={handlePointsEarned} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VideoSummarizer;