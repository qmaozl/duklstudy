import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
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
import KahootStyleQuiz from '@/components/KahootStyleQuiz';
import WrongAnswersReview from '@/components/WrongAnswersReview';
import { YouTubeApiHelper } from '@/components/YouTubeApiHelper';
import FlashCard from '@/components/FlashCard';
import { SubscriptionButton } from '@/components/SubscriptionButton';
import { checkGenerationLimit } from '@/utils/generationLimits';
import SummarySection from '@/components/SummarySection';

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
  const { user, subscription } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<string>('25');
  const [activeTab, setActiveTab] = useState<string>('new-video');
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([]);
  const [currentStudyMaterialId, setCurrentStudyMaterialId] = useState<string>('');
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState<number>(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const processVideo = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Check generation limits
    const canGenerate = await checkGenerationLimit();
    if (!canGenerate) {
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

        if (error) {
          console.error('Primary transcript extraction error:', error);
          throw error;
        }
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

          if (altError) {
            console.error('Alternative transcript extraction error:', altError);
            throw altError;
          }
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
          console.error('Alternative method also failed:', altError);
          throw new Error(`Failed to extract transcript: ${transcriptError?.message || 'Both methods failed'}. This may be because the video has no captions, is private, or uses non-standard formats.`);
        }
      }

      if (!transcriptData?.success) {
        throw new Error('Unable to extract transcript from this video. Please try a different video with closed captions enabled.');
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
        throw new Error('Transcript too short or invalid. Please try a different video with closed captions enabled.');
      }

      // Optimize: Skip text correction for short transcripts to save time
      let corrected_text = extractedVideoData.transcript;
      let key_concepts = [];

      if (extractedVideoData.transcript.length > 500) {
        // Step 2: Correct and enhance the transcript (only for longer content)
        setCurrentStep('Processing transcript content...');
        try {
          const { data: correctedData, error: correctionError } = await supabase.functions.invoke('correct-enhance-text', {
            body: { raw_text: extractedVideoData.transcript }
          });

          if (correctionError) {
            console.error('Text correction error:', correctionError);
            // Don't fail the entire process, just use original text
            toast({
              title: "Warning",
              description: "Text processing partially failed, using original transcript",
              variant: "default",
            });
          } else if (correctedData?.success) {
            corrected_text = correctedData.corrected_text;
            key_concepts = correctedData.key_concepts || [];
          }
        } catch (correctionError) {
          console.error('Text correction failed:', correctionError);
          // Continue with original text
        }
      } else {
        // For short transcripts, extract basic concepts
        key_concepts = extractedVideoData.title.split(' ').slice(0, 3);
      }

      // Step 3 & 4: Run in parallel to save time
      setCurrentStep('Generating study materials and finding sources...');
      
      try {
        const [materialsResult, sourcesResult] = await Promise.all([
          // Generate study materials
          supabase.functions.invoke('generate-study-materials', {
            body: { 
              corrected_text,
              num_questions: parseInt(numQuestions)
            }
          }),
          // Find relevant sources (run in parallel)
          key_concepts.length > 0 
            ? supabase.functions.invoke('find-relevant-sources', {
                body: { key_concepts }
              })
            : Promise.resolve({ data: { success: true, sources: [] }, error: null })
        ]);

        // Handle materials generation
        const { data: materialsData, error: materialsError } = materialsResult;
        if (materialsError) {
          console.error('Materials generation error:', materialsError);
          const name = (materialsError as any)?.name;
          const friendly = name === 'FunctionsFetchError'
            ? 'The generator is temporarily unreachable or timed out. Try again, or reduce the number of questions.'
            : `Failed to generate study materials: ${(materialsError as any)?.message || 'Unknown error'}`;
          throw new Error(friendly);
        }
        if (!materialsData?.success) {
          throw new Error(materialsData?.error || 'Failed to generate study materials');
        }

        // Handle sources (non-critical, can fail without stopping the process)
        const { data: sourcesData, error: sourcesError } = sourcesResult;
        let sources = [`Original Video: ${extractedVideoData.title}`];
        
        if (sourcesError) {
          console.error('Sources finding error:', sourcesError);
          toast({
            title: "Warning",
            description: "Could not find additional learning sources, but study materials were generated successfully",
            variant: "default",
          });
        } else if (sourcesData?.success && sourcesData.sources) {
          sources = [...sourcesData.sources, `Original Video: ${extractedVideoData.title}`];
        }

        // Combine all the results
        const fullStudyMaterial: StudyMaterial = {
          ...materialsData,
          sources,
          key_concepts
        };

        setStudyMaterial(fullStudyMaterial);

        // Save to database (run in background, don't block UI)
        if (user) {
          try {
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

            if (saveError) {
              console.error('Error saving study material:', saveError);
              toast({
                title: "Warning",
                description: "Study materials generated but not saved to database. Materials are still available for this session.",
                variant: "default",
              });
            } else if (savedMaterial) {
              setCurrentStudyMaterialId(savedMaterial.id);
              console.log('Study material saved successfully:', savedMaterial.id);
              // Trigger dashboard refresh
              setDashboardRefreshTrigger(prev => prev + 1);
              toast({
                title: "Success!",
                description: "Video processed and saved successfully!",
              });
            }
          } catch (saveError) {
            console.error('Database save failed:', saveError);
            toast({
              title: "Warning",
              description: "Study materials generated but not saved. Materials are still available for this session.",
              variant: "default",
            });
          }
        } else {
          toast({
            title: "Success!",
            description: "Video processed successfully! Please log in to save materials permanently.",
          });
        }

      } catch (parallelError) {
        console.error('Parallel processing error:', parallelError);
        throw parallelError;
      }

    } catch (error) {
      console.error('Error processing video:', error);
      const raw = error instanceof Error ? (error.message || '') : String(error);
      const friendly = /FunctionsFetchError|Failed to fetch|edge function/i.test(raw)
        ? 'The AI generator is temporarily unreachable or timed out. Please try again in a moment or reduce the number of questions.'
        : raw || 'Failed to process video. Please try again.';
      toast({
        title: 'Processing Failed',
        description: friendly,
        variant: 'destructive',
        duration: 5000,
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

  const generateCustomQuestions = async () => {
    if (!studyMaterial) return;
    
    // Check generation limits
    const canGenerate = await checkGenerationLimit();
    if (!canGenerate) {
      return;
    }
    
    setIsGeneratingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-questions', {
        body: {
          content: studyMaterial.summary + " " + studyMaterial.key_concepts.join(" "),
          topic: studyMaterial.key_concepts[0] || "General Knowledge",
          numQuestions: 15 // Generate 15 additional questions
        }
      });

      if (error) throw error;

      if (data.questions && data.questions.length > 0) {
        // Add the new questions to existing ones
        setStudyMaterial(prev => prev ? {
          ...prev,
          quiz: {
            ...prev.quiz,
            questions: [...prev.quiz.questions, ...data.questions]
          }
        } : null);

        toast({
          title: "Success!",
          description: `Generated ${data.questions.length} additional custom questions based on the topic.`,
        });
      }
    } catch (error) {
      console.error('Error generating custom questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate custom questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 p-4 md:p-6">
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
          
          <div className="flex items-center gap-3">
            {totalPointsEarned > 0 && (
              <Badge className="bg-yellow-500 text-white">
                <Trophy className="h-4 w-4 mr-1" />
                {totalPointsEarned} Total Points Earned
              </Badge>
            )}
            <SubscriptionButton />
          </div>
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
            <VideosDashboard 
              onSelectVideo={handleVideoSelect} 
              refreshTrigger={dashboardRefreshTrigger}
            />
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
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="35">35</SelectItem>
                          <SelectItem value="40">40</SelectItem>
                          <SelectItem value="50">50</SelectItem>
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
                            <SummarySection summary={studyMaterial.summary} />
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="flashcards" className="space-y-4">
                      <ScrollArea className="h-[400px]">
                        <div className="grid gap-4 md:grid-cols-2">
                          {studyMaterial.flashcards.map((card, index) => (
                            <FlashCard
                              key={index}
                              question={card.question}
                              answer={card.answer}
                              cardNumber={index + 1}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                      <TabsContent value="quiz" className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {studyMaterial.quiz.questions.length} Questions Available
                            </Badge>
                          </div>
                          <Button
                            onClick={generateCustomQuestions}
                            disabled={isGeneratingQuestions}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            {isGeneratingQuestions ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {isGeneratingQuestions ? 'Generating...' : 'Generate More Questions'}
                          </Button>
                        </div>
                        
                        <KahootStyleQuiz
                          questions={studyMaterial.quiz.questions}
                          studyMaterialId={currentStudyMaterialId}
                          onPointsEarned={handlePointsEarned}
                          onWrongAnswer={handleWrongAnswer}
                        />
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

        {/* Subscription Information */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
          <div className="text-center space-y-2">
            <h3 className="text-sm font-semibold">Subscription Plan</h3>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Badge variant={subscription?.subscription_tier === 'free' ? 'default' : 'secondary'}>
                {subscription?.subscription_tier?.toUpperCase() || 'FREE'}
              </Badge>
              <span className="text-muted-foreground">
                Generations: {subscription?.generations_used || 0} / {subscription?.generation_limit || 5}
              </span>
            </div>
            {subscription?.subscription_tier === 'free' && (
              <p className="text-xs text-muted-foreground">
                <strong>Pro and Premium plans</strong> unlock 1500 generation limit for comprehensive study materials
              </p>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSummarizer;