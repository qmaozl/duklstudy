import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Target, Clock, Star, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import KahootQuizQuestion from './KahootQuizQuestion';

interface QuizQuestion {
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correct_answer: string;
}

interface KahootStyleQuizProps {
  questions: QuizQuestion[];
  studyMaterialId: string;
  onPointsEarned: (points: number) => void;
  onWrongAnswer: (questionData: QuizQuestion, selectedAnswer: string) => void;
}

interface QuizSession {
  id: string;
  current_question: number;
  total_score: number;
  current_streak: number;
  max_streak: number;
  questions_correct: number;
  questions_total: number;
}

const KahootStyleQuiz: React.FC<KahootStyleQuizProps> = ({
  questions,
  studyMaterialId,
  onPointsEarned,
  onWrongAnswer,
}) => {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const streakMultiplier = Math.min(1 + (quizSession?.current_streak || 0) * 0.2, 3); // Max 3x multiplier
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  useEffect(() => {
    if (user && isQuizStarted && !quizSession) {
      initializeQuizSession();
    }
  }, [user, isQuizStarted]);

  const initializeQuizSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert({
          user_id: user.id,
          study_material_id: studyMaterialId,
          questions_total: questions.length,
        })
        .select()
        .single();

      if (error) throw error;
      setQuizSession(data);
    } catch (error) {
      console.error('Error initializing quiz session:', error);
      toast({
        title: "Error",
        description: "Failed to start quiz session",
        variant: "destructive",
      });
    }
  };

  const updateQuizSession = async (updates: Partial<QuizSession>) => {
    if (!quizSession) return;

    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .update(updates)
        .eq('id', quizSession.id)
        .select()
        .single();

      if (error) throw error;
      setQuizSession(data);
    } catch (error) {
      console.error('Error updating quiz session:', error);
    }
  };

  const handleQuestionAnswer = async (isCorrect: boolean, answerTime: number, selectedAnswer: string) => {
    if (!quizSession) return;

    const basePoints = isCorrect ? 1000 : 0;
    const timeBonus = isCorrect ? Math.max(0, 500 - (answerTime * 10)) : 0;
    const streakBonus = isCorrect ? (quizSession.current_streak * 100) : 0;
    const totalPoints = Math.round(basePoints + timeBonus + streakBonus);

    const newStreak = isCorrect ? quizSession.current_streak + 1 : 0;
    const newScore = quizSession.total_score + totalPoints;
    const newCorrect = quizSession.questions_correct + (isCorrect ? 1 : 0);
    const newMaxStreak = Math.max(quizSession.max_streak, newStreak);

    // Update quiz session
    await updateQuizSession({
      current_question: currentQuestionIndex + 1,
      total_score: newScore,
      current_streak: newStreak,
      max_streak: newMaxStreak,
      questions_correct: newCorrect,
    });

    // Record individual quiz result
    if (user) {
      try {
        await supabase
          .from('quiz_results')
          .insert({
            user_id: user.id,
            study_material_id: studyMaterialId,
            question_index: currentQuestionIndex,
            selected_answer: selectedAnswer,
            correct_answer: questions[currentQuestionIndex].correct_answer,
            is_correct: isCorrect,
            points_earned: totalPoints,
            answer_time_seconds: answerTime,
            streak_count: quizSession.current_streak,
            bonus_points: timeBonus + streakBonus,
          });

        // Handle wrong answers
        if (!isCorrect) {
          await supabase
            .from('wrong_answers')
            .upsert({
              user_id: user.id,
              study_material_id: studyMaterialId,
              question_data: questions[currentQuestionIndex] as any,
              selected_answer: selectedAnswer,
              correct_answer: questions[currentQuestionIndex].correct_answer,
              retry_count: 0,
            });
          
          onWrongAnswer(questions[currentQuestionIndex], selectedAnswer);
        }

        // Update user points
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('points')
          .eq('user_id', user.id)
          .single();

        if (currentProfile && totalPoints > 0) {
          await supabase
            .from('profiles')
            .update({ points: (currentProfile.points || 0) + totalPoints })
            .eq('user_id', user.id);

          onPointsEarned(totalPoints);
        }
      } catch (error) {
        console.error('Error recording quiz result:', error);
      }
    }

    // Move to next question or finish quiz
    setTimeout(() => {
      if (currentQuestionIndex + 1 >= questions.length) {
        completeQuiz();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 2000);
  };

  const completeQuiz = async () => {
    if (!quizSession) return;

    setIsQuizCompleted(true);
    setShowResults(true);

    // Mark session as completed
    await updateQuizSession({
      session_completed_at: new Date().toISOString(),
    } as any);

    const accuracy = Math.round((quizSession.questions_correct / questions.length) * 100);
    const performanceMessage = accuracy >= 80 ? "Excellent!" : accuracy >= 60 ? "Good job!" : "Keep practicing!";

    toast({
      title: `Quiz Complete! ${performanceMessage}`,
      description: `Score: ${quizSession.total_score} | Accuracy: ${accuracy}% | Max Streak: ${quizSession.max_streak}`,
    });
  };

  const startQuiz = () => {
    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
    setIsQuizCompleted(false);
    setShowResults(false);
  };

  const restartQuiz = () => {
    setQuizSession(null);
    setIsQuizStarted(false);
    setCurrentQuestionIndex(0);
    setIsQuizCompleted(false);
    setShowResults(false);
  };

  if (showResults && quizSession) {
    const accuracy = Math.round((quizSession.questions_correct / questions.length) * 100);
    
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-yellow-500 animate-bounce" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Quiz Complete!
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/50 dark:bg-black/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{quizSession.total_score}</div>
                <div className="text-sm text-muted-foreground">Total Score</div>
              </div>
              <div className="bg-white/50 dark:bg-black/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="bg-white/50 dark:bg-black/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{quizSession.max_streak}</div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
              </div>
              <div className="bg-white/50 dark:bg-black/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{quizSession.questions_correct}/{questions.length}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
            </div>

            <Button onClick={restartQuiz} className="mt-6">
              <Target className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isQuizStarted) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Trophy className="h-20 w-20 text-yellow-500 animate-pulse" />
                <Zap className="h-8 w-8 text-blue-500 absolute -top-2 -right-2 animate-bounce" />
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Kahoot-Style Quiz
              </h2>
              <p className="text-lg text-muted-foreground mt-2">
                Test your knowledge and earn points!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-white/50 dark:bg-black/30 rounded-lg p-4">
                <div className="text-xl font-bold text-blue-600">{questions.length}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="bg-white/50 dark:bg-black/30 rounded-lg p-4">
                <div className="text-xl font-bold text-green-600">1000</div>
                <div className="text-sm text-muted-foreground">Max Points</div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="font-semibold mb-2 flex items-center">
                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                Scoring Rules
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 1000 base points for correct answers</li>
                <li>• Speed bonus up to 500 points</li>
                <li>• Streak multiplier up to 3x</li>
                <li>• Build streaks for maximum points!</li>
              </ul>
            </div>

            <Button onClick={startQuiz} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Zap className="h-5 w-5 mr-2" />
              Start Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentQuestionIndex >= questions.length) {
    return null; // Quiz completion is handled by completeQuiz
  }

  return (
    <div className="space-y-4">
      {/* Quiz Header */}
      <Card className="border-l-4 border-l-primary bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
              
              {quizSession && quizSession.current_streak > 0 && (
                <Badge className="bg-orange-500 text-white animate-pulse">
                  <Flame className="h-3 w-3 mr-1" />
                  {quizSession.current_streak} Streak
                </Badge>
              )}
              
              {streakMultiplier > 1 && (
                <Badge className="bg-purple-500 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  {streakMultiplier.toFixed(1)}x Points
                </Badge>
              )}
            </div>
            
            {quizSession && (
              <Badge className="bg-blue-500 text-white">
                <Trophy className="h-3 w-3 mr-1" />
                {quizSession.total_score}
              </Badge>
            )}
          </div>
          
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Question */}
      <KahootQuizQuestion
        question={questions[currentQuestionIndex]}
        questionNumber={currentQuestionIndex + 1}
        onAnswer={handleQuestionAnswer}
        streakMultiplier={streakMultiplier}
      />
    </div>
  );
};

export default KahootStyleQuiz;