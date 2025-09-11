import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, Loader2, FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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

const StudyMaterials = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<string>('5');

  const processText = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setStudyMaterial(null);
    
    try {
      // Step 1: Correct and enhance the text
      setCurrentStep('Correcting and enhancing text...');
      const { data: correctedData, error: correctionError } = await supabase.functions.invoke('correct-enhance-text', {
        body: { raw_text: inputText }
      });

      if (correctionError) throw correctionError;
      
      const { corrected_text, key_concepts } = correctedData;

      // Step 2: Find relevant sources
      setCurrentStep('Finding relevant learning sources...');
      const { data: sourcesData, error: sourcesError } = await supabase.functions.invoke('find-relevant-sources', {
        body: { key_concepts }
      });

      if (sourcesError) throw sourcesError;

      // Step 3: Generate study materials
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
        sources: sourcesData.sources || [],
        key_concepts
      };

      setStudyMaterial(fullStudyMaterial);

      // Save to database
      if (user) {
        const { error: saveError } = await supabase
          .from('study_materials')
          .insert({
            user_id: user.id,
            title: `Study Material - ${new Date().toLocaleDateString()}`,
            source_type: 'text_input',
            original_content: inputText,
            corrected_text,
            key_concepts,
            summary: fullStudyMaterial.summary,
            flashcards: fullStudyMaterial.flashcards,
            quiz: fullStudyMaterial.quiz,
            sources: fullStudyMaterial.sources,
            points_earned: 10
          });

        if (!saveError) {
          toast({
            title: "Success!",
            description: "Study materials generated and saved successfully!",
          });
        }
      }

    } catch (error) {
      console.error('Error processing text:', error);
      toast({
        title: "Error",
        description: "Failed to process text. Please try again.",
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
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Study Materials Generator</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Input Your Study Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your study notes, textbook excerpts, or any educational content here. The AI will correct any errors, create flashcards, generate quizzes, and find relevant sources for you!"
                  className="min-h-[300px] resize-none"
                  disabled={isProcessing}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {inputText.length} characters
                    </span>
                    <div className="flex items-center gap-2">
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
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={processText}
                    disabled={isProcessing || !inputText.trim()}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isProcessing ? 'Processing...' : 'Generate Study Materials'}
                  </Button>
                </div>
                {isProcessing && currentStep && (
                  <div className="text-sm text-muted-foreground text-center">
                    {currentStep}
                  </div>
                )}
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
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generated study materials will appear here after processing your text.</p>
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

export default StudyMaterials;