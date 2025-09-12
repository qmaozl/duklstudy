import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Zap, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuizQuestion {
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correct_answer: string;
}

interface KahootQuizQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  onAnswer: (isCorrect: boolean, answerTime: number, selectedAnswer: string) => void;
  streakMultiplier: number;
}

const ANSWER_COLORS = {
  a: 'bg-red-500 hover:bg-red-600 border-red-600',
  b: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
  c: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  d: 'bg-green-500 hover:bg-green-600 border-green-600',
};

const ANSWER_COLORS_CORRECT = {
  a: 'bg-red-400 border-red-500 animate-pulse',
  b: 'bg-blue-400 border-blue-500 animate-pulse',
  c: 'bg-yellow-400 border-yellow-500 animate-pulse',
  d: 'bg-green-400 border-green-500 animate-pulse',
};

const ANSWER_COLORS_WRONG = {
  a: 'bg-gray-400 border-gray-500 opacity-60',
  b: 'bg-gray-400 border-gray-500 opacity-60',
  c: 'bg-gray-400 border-gray-500 opacity-60',
  d: 'bg-gray-400 border-gray-500 opacity-60',
};

const KahootQuizQuestion: React.FC<KahootQuizQuestionProps> = ({
  question,
  questionNumber,
  onAnswer,
  streakMultiplier,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answerTime, setAnswerTime] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerRef, setTimerRef] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef) {
      clearInterval(timerRef);
    }
    
    setTimeLeft(30);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswerTime(0);
    setIsAnswered(false);

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Time up - auto submit no answer if not already answered
          if (!isAnswered) {
            handleTimeUp();
          }
          return 0;
        }
        return prevTime - 1;
      });
      
      // Always increment answer time unless time is up
      setAnswerTime((prev) => prev + 1);
    }, 1000);

    setTimerRef(timer);
    return () => clearInterval(timer);
  }, [question]);

  const handleTimeUp = () => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    setSelectedAnswer('timeout');
    setShowResult(true);
    
    // Call onAnswer for timeout (timer continues to 0)
    setTimeout(() => {
      onAnswer(false, 30, 'timeout');
    }, 200);
  };

  const handleAnswerSelect = (key: string) => {
    // Prevent double clicks and clicks during results
    if (isAnswered || showResult) return;

    setIsAnswered(true);
    setSelectedAnswer(key);
    
    // Show immediate feedback after a short delay (timer continues running)
    setTimeout(() => {
      setShowResult(true);
    }, 500);

    const isCorrect = key === question.correct_answer;
    const finalAnswerTime = 30 - timeLeft;

    setTimeout(() => {
      onAnswer(isCorrect, finalAnswerTime, key);
    }, 1500);
  };

  const getButtonStyle = (key: string) => {
    // If answer is selected but result not shown yet, highlight the selected answer
    if (isAnswered && !showResult && key === selectedAnswer) {
      return `${ANSWER_COLORS[key as keyof typeof ANSWER_COLORS]} text-white font-bold ring-4 ring-white/50 animate-pulse`;
    }
    
    if (!showResult) {
      return `${ANSWER_COLORS[key as keyof typeof ANSWER_COLORS]} text-white font-bold transition-all duration-200 transform hover:scale-105 active:scale-95`;
    }

    // Show results
    if (key === question.correct_answer) {
      return `${ANSWER_COLORS_CORRECT[key as keyof typeof ANSWER_COLORS_CORRECT]} text-white font-bold ring-4 ring-green-300`;
    }

    if (key === selectedAnswer && selectedAnswer !== question.correct_answer) {
      return `bg-red-600 border-red-700 text-white font-bold ring-4 ring-red-300 animate-shake`;
    }

    return `${ANSWER_COLORS_WRONG[key as keyof typeof ANSWER_COLORS_WRONG]} text-white font-bold`;
  };

  const timePercentage = (timeLeft / 30) * 100;
  const getTimerStyle = () => {
    if (timeLeft > 10) return 'text-green-100 bg-green-600/80';
    if (timeLeft > 5) return 'text-yellow-100 bg-yellow-600/80';
    return 'text-red-100 bg-red-600/80 animate-pulse';
  };

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardContent className="p-0">
        {/* Timer and Question Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-white/20 text-white text-sm">
              <Target className="h-3 w-3 mr-1" />
              Question {questionNumber}
            </Badge>
            
            <div className="flex items-center gap-4">
              {streakMultiplier > 1 && (
                <Badge className="bg-orange-500 text-white animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  {streakMultiplier.toFixed(1)}x
                </Badge>
              )}
              
              <div className={`flex items-center gap-2 ${getTimerStyle()} px-3 py-1 rounded-full font-bold`}>
                <Clock className="h-4 w-4" />
                <span className="font-bold text-lg">{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Time Progress Bar */}
          <div className="w-full bg-white/30 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-center">
            {question.question}
          </h3>
        </div>

        {/* Answer Options */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(question.options).map(([key, value]) => (
              <Button
                key={key}
                onClick={() => handleAnswerSelect(key)}
                disabled={isAnswered || showResult}
                className={`h-auto p-6 text-left justify-start min-h-[80px] relative overflow-hidden ${getButtonStyle(key)} ${
                  (isAnswered || showResult) ? 'cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">{key.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm md:text-base leading-tight">{value}</p>
                  </div>
                  
                  {(showResult || (isAnswered && key === selectedAnswer)) && (
                    <div className="flex-shrink-0 ml-4">
                      {key === question.correct_answer ? (
                        <CheckCircle className="h-6 w-6 text-white animate-bounce" />
                      ) : key === selectedAnswer && showResult ? (
                        <XCircle className="h-6 w-6 text-white animate-pulse" />
                      ) : isAnswered && key === selectedAnswer && !showResult ? (
                        <div className="h-6 w-6 border-2 border-white rounded-full animate-spin border-t-transparent" />
                      ) : null}
                    </div>
                  )}
                </div>
                
                {/* Ripple effect for answers */}
                {!showResult && (
                  <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200" />
                )}
              </Button>
            ))}
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className="mt-6 text-center animate-fade-in">
              {selectedAnswer === question.correct_answer ? (
                <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-6 w-6" />
                    <span className="text-lg font-bold">Correct!</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Great job! You answered in {30 - timeLeft} seconds.
                  </p>
                </div>
              ) : selectedAnswer === 'timeout' ? (
                <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-orange-700 dark:text-orange-300">
                    <Clock className="h-6 w-6" />
                    <span className="text-lg font-bold">Time's Up!</span>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                    The correct answer was <strong>{question.correct_answer.toUpperCase()}</strong>
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-300">
                    <XCircle className="h-6 w-6" />
                    <span className="text-lg font-bold">Incorrect</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    The correct answer was <strong>{question.correct_answer.toUpperCase()}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KahootQuizQuestion;