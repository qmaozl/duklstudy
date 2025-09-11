import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Youtube, Sparkles, Loader2, FileText, Download, ExternalLink } from 'lucide-react';
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

interface StudyMaterial {
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

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, questionNumber }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswerSelect = (key: string) => {
    setSelectedAnswer(key);
    setShowResult(true);
  };

  const resetQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <Card className="border-l-4 border-l-secondary">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <p className="font-medium text-sm flex-1">
              {questionNumber}. {question.question}
            </p>
            {showResult && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetQuestion}
                className="ml-2 text-xs"
              >
                Try Again
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(question.options).map(([key, value]) => {
              let buttonClass = 'p-2 rounded text-xs text-left border transition-colors ';
              
              if (!showResult) {
                buttonClass += 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer';
              } else {
                if (key === question.correct_answer) {
                  buttonClass += 'bg-green-100 border-green-300 text-green-800';
                } else if (key === selectedAnswer && key !== question.correct_answer) {
                  buttonClass += 'bg-red-100 border-red-300 text-red-800';
                } else {
                  buttonClass += 'bg-gray-50 border-gray-200';
                }
              }

              return (
                <div 
                  key={key} 
                  className={buttonClass}
                  onClick={() => !showResult && handleAnswerSelect(key)}
                >
                  <span className="font-medium">{key.toUpperCase()}.</span> {value}
                  {showResult && key === question.correct_answer && (
                    <span className="ml-2 text-green-600">✓ Correct</span>
                  )}
                  {showResult && key === selectedAnswer && key !== question.correct_answer && (
                    <span className="ml-2 text-red-600">✗ Your Answer</span>
                  )}
                </div>
              );
            })}
          </div>
          {showResult && (
            <div className="text-xs text-muted-foreground">
              {selectedAnswer === question.correct_answer 
                ? "Correct! Well done." 
                : `Incorrect. The correct answer is ${question.correct_answer.toUpperCase()}.`
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const VideoSummarizer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<string>('5');

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
      // Step 1: Extract YouTube transcript
      setCurrentStep('Extracting video transcript...');
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('extract-youtube-transcript', {
        body: { youtube_url: youtubeUrl }
      });

      if (transcriptError) throw transcriptError;
      
      if (!transcriptData.success) {
        throw new Error(transcriptData.error || 'Failed to extract transcript');
      }

      const extractedVideoData: VideoData = {
        title: transcriptData.title,
        transcript: transcriptData.transcript,
        video_id: transcriptData.video_id,
        duration: transcriptData.duration
      };
      
      setVideoData(extractedVideoData);

      // Check if transcript is meaningful (not just error message)
      if (extractedVideoData.transcript.includes('does not have an available transcript')) {
        throw new Error('No transcript available for this video. Please try a different video that has closed captions enabled.');
      }

      // Step 2: Correct and enhance the transcript
      setCurrentStep('Processing transcript content...');
      const { data: correctedData, error: correctionError } = await supabase.functions.invoke('correct-enhance-text', {
        body: { raw_text: extractedVideoData.transcript }
      });

      if (correctionError) throw correctionError;
      
      const { corrected_text, key_concepts } = correctedData;

      // Step 3: Find relevant sources
      setCurrentStep('Finding relevant learning sources...');
      const { data: sourcesData, error: sourcesError } = await supabase.functions.invoke('find-relevant-sources', {
        body: { key_concepts }
      });

      if (sourcesError) throw sourcesError;

      // Step 4: Generate study materials
      setCurrentStep('Generating study materials...');
      const { data: materialsData, error: materialsError } = await supabase.functions.invoke('generate-study-materials', {
        body: { 
          corrected_text,
          num_questions: parseInt(numQuestions)
        }
      });

      if (materialsError) throw materialsError;

      // Combine all the results
      const fullStudyMaterial: StudyMaterial = {
        ...materialsData,
        sources: [...(sourcesData.sources || []), `Original Video: ${extractedVideoData.title}`],
        key_concepts
      };

      setStudyMaterial(fullStudyMaterial);

      // Save to database
      if (user) {
        const { error: saveError } = await supabase
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
          });

        if (!saveError) {
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

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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
            <h1 className="text-2xl font-bold">YouTube Video Summarizer</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-500" />
                  Enter YouTube URL
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
                    onClick={processVideo}
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

          {/* Results Section */}
          <div className="space-y-4">
            {studyMaterial ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Generated Study Materials
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
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {studyMaterial.quiz.questions.map((question, index) => (
                            <QuizQuestion 
                              key={index} 
                              question={question} 
                              questionNumber={index + 1}
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
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-muted-foreground">
                    <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50 text-red-500" />
                    <p>Generated study materials will appear here after processing your YouTube video.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSummarizer;