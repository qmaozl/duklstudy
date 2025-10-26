import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Award, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MCQQuestion {
  type: 'mcq';
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  marks: number;
}

interface FillBlankQuestion {
  type: 'fill_blank';
  question: string;
  correct_answer: string;
  marks: number;
}

interface ShortAnswerQuestion {
  type: 'short_answer';
  question: string;
  model_answer: string;
  marks: number;
}

interface TrueFalseQuestion {
  type: 'true_false';
  statement: string;
  correct_answer: boolean;
  explanation: string;
  marks: number;
}

type HKDSEQuestion = MCQQuestion | FillBlankQuestion | ShortAnswerQuestion | TrueFalseQuestion;

interface HKDSEQuizProps {
  questions: HKDSEQuestion[];
}

const HKDSEQuiz: React.FC<HKDSEQuizProps> = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const handleMCQAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  };

  const handleFillBlankAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  };

  const handleShortAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  };

  const handleTrueFalse = (answer: boolean) => {
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  };

  const checkAnswer = (question: HKDSEQuestion, answer: any): boolean => {
    switch (question.type) {
      case 'mcq':
        return answer === question.correct_answer;
      case 'fill_blank':
        return answer?.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      case 'true_false':
        return answer === question.correct_answer;
      case 'short_answer':
        // Short answers are marked manually, so we return true for now
        return true;
      default:
        return false;
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((question, index) => {
      if (answers[index] !== undefined) {
        if (question.type === 'short_answer') {
          // Give half marks for attempting short answer
          score += question.marks / 2;
        } else if (checkAnswer(question, answers[index])) {
          score += question.marks;
        }
      }
    });
    return score;
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      const score = calculateScore();
      toast({
        title: "Quiz Completed!",
        description: `You scored ${score}/${totalMarks} marks`,
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setIsStarted(false);
  };

  if (!isStarted) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="flex justify-center">
              <BookOpen className="h-20 w-20 text-primary animate-pulse" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2">HKDSE Style Quiz</h2>
              <p className="text-muted-foreground">
                Practice with Hong Kong exam-style questions
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-2xl font-bold">{questions.length}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-2xl font-bold">{totalMarks}</div>
                <div className="text-sm text-muted-foreground">Total Marks</div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="font-semibold mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                Question Types
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• Multiple Choice Questions (MCQ)</li>
                <li>• Fill in the Blanks</li>
                <li>• Short Answer Questions</li>
                <li>• True/False Statements</li>
              </ul>
            </div>

            <Button onClick={() => setIsStarted(true)} size="lg" className="bg-primary">
              <BookOpen className="h-5 w-5 mr-2" />
              Start Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / totalMarks) * 100);
    
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <Award className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
              <div className="text-5xl font-bold text-primary mb-2">{score}/{totalMarks}</div>
              <div className="text-xl text-muted-foreground">({percentage}%)</div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review Your Answers:</h3>
              {questions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect = checkAnswer(question, userAnswer);

                return (
                  <Card key={index} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            {question.type.replace('_', ' ').toUpperCase()} - {question.marks} mark{question.marks > 1 ? 's' : ''}
                          </Badge>
                          <CardTitle className="text-base">
                            Question {index + 1}
                          </CardTitle>
                        </div>
                        {isCorrect ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {question.type === 'mcq' && (
                        <>
                          <p className="font-medium">{question.question}</p>
                          <div className="text-sm space-y-1">
                            <p>Your answer: <span className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{userAnswer || 'Not answered'}</span></p>
                            {!isCorrect && <p>Correct answer: <span className="text-green-600 font-semibold">{question.correct_answer}</span></p>}
                          </div>
                        </>
                      )}
                      {question.type === 'fill_blank' && (
                        <>
                          <p className="font-medium">{question.question}</p>
                          <div className="text-sm space-y-1">
                            <p>Your answer: <span className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{userAnswer || 'Not answered'}</span></p>
                            {!isCorrect && <p>Correct answer: <span className="text-green-600 font-semibold">{question.correct_answer}</span></p>}
                          </div>
                        </>
                      )}
                      {question.type === 'true_false' && (
                        <>
                          <p className="font-medium">{question.statement}</p>
                          <div className="text-sm space-y-1">
                            <p>Your answer: <span className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{userAnswer === undefined ? 'Not answered' : userAnswer ? 'True' : 'False'}</span></p>
                            <p>Correct answer: <span className="text-green-600 font-semibold">{question.correct_answer ? 'True' : 'False'}</span></p>
                            <p className="text-muted-foreground italic">{question.explanation}</p>
                          </div>
                        </>
                      )}
                      {question.type === 'short_answer' && (
                        <>
                          <p className="font-medium">{question.question}</p>
                          <div className="text-sm space-y-2">
                            <div>
                              <p className="font-semibold">Your answer:</p>
                              <p className="text-muted-foreground">{userAnswer || 'Not answered'}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Model answer:</p>
                              <p className="text-green-600">{question.model_answer}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button onClick={restartQuiz} className="w-full">
              Restart Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge>Question {currentQuestionIndex + 1} of {questions.length}</Badge>
            <Badge variant="outline">{currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className="mb-2">
              {currentQuestion.type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.type === 'mcq' && (
            <>
              <p className="text-base font-medium">{currentQuestion.question}</p>
              <RadioGroup
                value={answers[currentQuestionIndex] || ''}
                onValueChange={handleMCQAnswer}
              >
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value={key} id={`option-${key}`} />
                    <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                      <span className="font-semibold mr-2">{key}.</span> {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {currentQuestion.type === 'fill_blank' && (
            <>
              <p className="text-base font-medium whitespace-pre-wrap">{currentQuestion.question}</p>
              <Input
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleFillBlankAnswer(e.target.value)}
                placeholder="Enter your answer"
                className="text-base"
              />
            </>
          )}

          {currentQuestion.type === 'short_answer' && (
            <>
              <p className="text-base font-medium">{currentQuestion.question}</p>
              <Textarea
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleShortAnswer(e.target.value)}
                placeholder="Write your answer here (1-2 sentences)"
                className="min-h-[120px]"
              />
            </>
          )}

          {currentQuestion.type === 'true_false' && (
            <>
              <p className="text-base font-medium">{currentQuestion.statement}</p>
              <RadioGroup
                value={answers[currentQuestionIndex] === undefined ? '' : answers[currentQuestionIndex].toString()}
                onValueChange={(value) => handleTrueFalse(value === 'true')}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="flex-1 cursor-pointer font-semibold">True</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="flex-1 cursor-pointer font-semibold">False</Label>
                </div>
              </RadioGroup>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={answers[currentQuestionIndex] === undefined}
              className="flex-1"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HKDSEQuiz;
