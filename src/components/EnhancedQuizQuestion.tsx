import React, { useState } from 'react';
import { Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface QuizQuestion {
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correct_answer: string;
}

interface EnhancedQuizQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  studyMaterialId: string;
  onPointsEarned: (points: number) => void;
  onWrongAnswer: (questionData: QuizQuestion, selectedAnswer: string) => void;
}

const EnhancedQuizQuestion: React.FC<EnhancedQuizQuestionProps> = ({ 
  question, 
  questionNumber, 
  studyMaterialId, 
  onPointsEarned,
  onWrongAnswer
}) => {
  const { user } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSelect = async (key: string) => {
    if (showResult || isSubmitting) return;
    
    setIsSubmitting(true);
    setSelectedAnswer(key);
    setShowResult(true);

    const isCorrect = key === question.correct_answer;
    const points = isCorrect ? 10 : 0;
    
    setPointsAwarded(points);
    
    try {
      // Record quiz result
      if (user) {
        const { error: quizError } = await supabase
          .from('quiz_results')
          .insert({
            user_id: user.id,
            study_material_id: studyMaterialId,
            question_index: questionNumber - 1,
            selected_answer: key,
            correct_answer: question.correct_answer,
            is_correct: isCorrect,
            points_earned: points
          });

        if (quizError) throw quizError;

        // If wrong, add to wrong answers tracking
        if (!isCorrect) {
          const { error: wrongAnswerError } = await supabase
            .from('wrong_answers')
            .upsert({
              user_id: user.id,
              study_material_id: studyMaterialId,
              question_data: question as any,
              selected_answer: key,
              correct_answer: question.correct_answer,
              retry_count: 0
            });

          if (!wrongAnswerError) {
            onWrongAnswer(question, key);
          }
        }

        // Update user points in profiles
        if (points > 0) {
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
      }
    } catch (error) {
      console.error('Error recording quiz result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setPointsAwarded(0);
  };

  return (
    <Card className="border-l-4 border-l-secondary relative">
      {pointsAwarded > 0 && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-yellow-500 text-white animate-pulse">
            <Trophy className="h-3 w-3 mr-1" />
            +{pointsAwarded}
          </Badge>
        </div>
      )}
      
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
                disabled={isSubmitting}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(question.options).map(([key, value]) => {
              let buttonClass = 'p-3 rounded text-sm text-left border transition-all duration-200 ';
              
              if (!showResult) {
                buttonClass += 'bg-card border-border hover:bg-accent hover:border-accent-foreground cursor-pointer';
              } else {
                if (key === question.correct_answer) {
                  buttonClass += 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200';
                } else if (key === selectedAnswer && key !== question.correct_answer) {
                  buttonClass += 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';
                } else {
                  buttonClass += 'bg-muted border-border opacity-60';
                }
              }

              return (
                <div 
                  key={key} 
                  className={buttonClass}
                  onClick={() => handleAnswerSelect(key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{key.toUpperCase()}.</span> {value}
                    </div>
                    {showResult && key === question.correct_answer && (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                    {showResult && key === selectedAnswer && key !== question.correct_answer && (
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {showResult && (
            <div className="flex items-center justify-between text-sm">
              <div className={selectedAnswer === question.correct_answer 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
              }>
                {selectedAnswer === question.correct_answer 
                  ? "🎉 Correct! Well done." 
                  : `❌ Incorrect. The correct answer is ${question.correct_answer.toUpperCase()}.`
                }
              </div>
              
              {pointsAwarded > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Trophy className="h-3 w-3 mr-1" />
                  +{pointsAwarded} points
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedQuizQuestion;