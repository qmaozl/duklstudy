import React, { useState, useEffect } from 'react';
import { BookX, RotateCcw, CheckCircle, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface WrongAnswer {
  id: string;
  question_data: any;
  selected_answer: string;
  correct_answer: string;
  retry_count: number;
  mastered: boolean;
  study_material_id: string;
  created_at: string;
}

interface WrongAnswersReviewProps {
  onPointsEarned: (points: number) => void;
}

const WrongAnswersReview: React.FC<WrongAnswersReviewProps> = ({ onPointsEarned }) => {
  const { user } = useAuth();
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState<{ [key: string]: { attempted: boolean; selectedAnswer: string } }>({});

  useEffect(() => {
    if (user) {
      fetchWrongAnswers();
    }
  }, [user]);

  const fetchWrongAnswers = async () => {
    try {
      const { data, error } = await supabase
        .from('wrong_answers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('mastered', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWrongAnswers((data || []) as WrongAnswer[]);
    } catch (error) {
      console.error('Error fetching wrong answers:', error);
      toast({
        title: "Error",
        description: "Failed to load wrong answers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAnswer = async (wrongAnswer: WrongAnswer, selectedAnswer: string) => {
    // First, update UI to show the attempt
    setRetryAttempts(prev => ({
      ...prev,
      [wrongAnswer.id]: { attempted: true, selectedAnswer }
    }));

    setRetryingId(wrongAnswer.id);
    
    const isCorrect = selectedAnswer === wrongAnswer.correct_answer;
    const points = isCorrect ? 15 : 0; // Extra points for correcting mistakes
    
    // Short delay to show the result
    setTimeout(async () => {
      try {
        if (isCorrect) {
          // Mark as mastered
          const { error: updateError } = await supabase
            .from('wrong_answers')
            .update({ 
              mastered: true, 
              retry_count: wrongAnswer.retry_count + 1 
            })
            .eq('id', wrongAnswer.id);

          if (updateError) throw updateError;

          // Award points
          if (user) {
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('points')
              .eq('user_id', user.id)
              .single();

            if (currentProfile) {
              const { error: pointsError } = await supabase
                .from('profiles')
                .update({ points: (currentProfile.points || 0) + points })
                .eq('user_id', user.id);

              if (!pointsError) {
                onPointsEarned(points);
              }
            }
          }

          toast({
            title: "Excellent! 🎉",
            description: `Correct! You earned ${points} points for mastering this question.`,
          });

          // Remove from list after a delay
          setTimeout(() => {
            setWrongAnswers(prev => prev.filter(wa => wa.id !== wrongAnswer.id));
            setRetryAttempts(prev => {
              const newAttempts = { ...prev };
              delete newAttempts[wrongAnswer.id];
              return newAttempts;
            });
          }, 2000);
        } else {
          // Increment retry count
          const { error: updateError } = await supabase
            .from('wrong_answers')
            .update({ retry_count: wrongAnswer.retry_count + 1 })
            .eq('id', wrongAnswer.id);

          if (updateError) throw updateError;

          toast({
            title: "Not quite right",
            description: "The correct answer is now revealed. Study it and try again later!",
            variant: "destructive",
          });

          // Update retry count in local state
          setWrongAnswers(prev => prev.map(wa => 
            wa.id === wrongAnswer.id 
              ? { ...wa, retry_count: wa.retry_count + 1 }
              : wa
          ));
        }
      } catch (error) {
        console.error('Error processing retry:', error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } finally {
        setRetryingId(null);
      }
    }, 300);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading wrong answers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookX className="h-5 w-5 text-orange-500" />
          Questions to Master
          {wrongAnswers.length > 0 && (
            <Badge variant="secondary">{wrongAnswers.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {wrongAnswers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
            <p>Great job! No questions to review.</p>
            <p className="text-sm">All your wrong answers have been mastered.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {wrongAnswers.map((wrongAnswer) => (
                <Card key={wrongAnswer.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm flex-1">
                          {wrongAnswer.question_data.question}
                        </p>
                        <Badge variant="outline" className="ml-2">
                          Attempts: {wrongAnswer.retry_count + 1}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(wrongAnswer.question_data.options).map(([key, value]) => {
                          const retryAttempt = retryAttempts[wrongAnswer.id];
                          const hasAttempted = retryAttempt?.attempted;
                          const isSelected = retryAttempt?.selectedAnswer === key;
                          const isCorrectAnswer = key === wrongAnswer.correct_answer;
                          const isOriginalWrongAnswer = key === wrongAnswer.selected_answer;

                          let buttonClass = 'p-2 rounded text-sm text-left border transition-colors cursor-pointer ';
                          
                          // Show results only AFTER retry attempt
                          if (hasAttempted) {
                            if (isSelected && isCorrectAnswer) {
                              buttonClass += 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200';
                            } else if (isSelected && !isCorrectAnswer) {
                              buttonClass += 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';
                            } else if (isCorrectAnswer) {
                              buttonClass += 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200';
                            } else {
                              buttonClass += 'bg-card border-border opacity-60';
                            }
                          } else {
                            // Before retry - only highlight original wrong answer as hint
                            if (isOriginalWrongAnswer) {
                              buttonClass += 'bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200';
                            } else {
                              buttonClass += 'bg-card border-border hover:bg-accent';
                            }
                          }

                          return (
                            <div 
                              key={key} 
                              className={buttonClass}
                              onClick={() => !hasAttempted ? handleRetryAnswer(wrongAnswer, key) : undefined}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold">{key.toUpperCase()}.</span> {String(value)}
                                </div>
                                {/* Only show labels AFTER retry attempt */}
                                {hasAttempted && isSelected && isCorrectAnswer && (
                                  <span className="text-green-600 text-xs font-bold">✓ Correct!</span>
                                )}
                                {hasAttempted && isSelected && !isCorrectAnswer && (
                                  <span className="text-red-600 text-xs">✗ Wrong</span>
                                )}
                                {hasAttempted && !isSelected && isCorrectAnswer && (
                                  <span className="text-green-600 text-xs">✓ Correct Answer</span>
                                )}
                                {!hasAttempted && isOriginalWrongAnswer && (
                                  <span className="text-orange-600 text-xs">Previous Answer</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        {retryAttempts[wrongAnswer.id]?.attempted ? (
                          <span className="text-blue-600">
                            {retryAttempts[wrongAnswer.id]?.selectedAnswer === wrongAnswer.correct_answer ? 
                              "Mastered! This question will be removed shortly." :
                              "Correct answer revealed. Study and try again later!"}
                          </span>
                        ) : (
                          <span>
                            Choose the correct answer (your previous wrong answer is highlighted)
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Trophy className="h-3 w-3" />
                          <span>+15 points</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default WrongAnswersReview;