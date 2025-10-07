import React, { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Play } from 'lucide-react';
import { chineseTexts, ChineseTextKey } from '@/data/chineseTexts';

const MemoriseReview = () => {
  const { textKey } = useParams<{ textKey: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMemorizing, setIsMemorizing] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const decodedKey = decodeURIComponent(textKey || '') as ChineseTextKey;
  const text = chineseTexts[decodedKey];

  if (!text) {
    navigate('/memorise-pro');
    return null;
  }

  const handleStartMemorizing = () => {
    setIsMemorizing(true);
  };

  if (isMemorizing) {
    return <MemorizingMode textKey={decodedKey} text={text} onBack={() => setIsMemorizing(false)} />;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/memorise-pro')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{decodedKey}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-lg leading-relaxed">{text}</div>
              </div>

              <Button
                onClick={handleStartMemorizing}
                size="lg"
                className="w-full gradient-primary"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Memorising!
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface MemorizingModeProps {
  textKey: string;
  text: string;
  onBack: () => void;
}

const MemorizingMode: React.FC<MemorizingModeProps> = ({ textKey, text, onBack }) => {
  const [userInput, setUserInput] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const normalizeText = (str: string) => {
    return str
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/[，。！？；：「」『』（）、]/g, '') // Remove Chinese punctuation
      .toLowerCase()
      .trim();
  };

  const analyzeText = () => {
    setIsAnalyzing(true);

    const normalizedOriginal = normalizeText(text);
    const normalizedUser = normalizeText(userInput);

    // Create character-level diff
    const originalChars = normalizedOriginal.split('');
    const userChars = normalizedUser.split('');
    
    // Use dynamic programming for better diff algorithm
    const dp: number[][] = [];
    for (let i = 0; i <= originalChars.length; i++) {
      dp[i] = [];
      for (let j = 0; j <= userChars.length; j++) {
        if (i === 0) dp[i][j] = j;
        else if (j === 0) dp[i][j] = i;
        else if (originalChars[i - 1] === userChars[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    // Backtrack to find the diff
    const diffResult: Array<{char: string, status: 'correct' | 'wrong' | 'missed', userChar?: string}> = [];
    let i = originalChars.length;
    let j = userChars.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && originalChars[i - 1] === userChars[j - 1]) {
        diffResult.unshift({ char: originalChars[i - 1], status: 'correct' });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] <= dp[i - 1][j])) {
        // User added extra character (skip it in userChars)
        j--;
      } else if (i > 0 && (j === 0 || dp[i - 1][j] < dp[i][j - 1])) {
        // User missed this character
        diffResult.unshift({ char: originalChars[i - 1], status: 'missed' });
        i--;
      } else {
        // Wrong character
        diffResult.unshift({ char: originalChars[i - 1], status: 'wrong', userChar: userChars[j - 1] });
        i--;
        j--;
      }
    }

    const correctCount = diffResult.filter(d => d.status === 'correct').length;
    const accuracy = ((correctCount / originalChars.length) * 100).toFixed(1);

    setAnalysis({
      diffResult,
      accuracy,
      total: originalChars.length,
      correct: correctCount,
      wrong: diffResult.filter(d => d.status === 'wrong').length,
      missed: diffResult.filter(d => d.status === 'missed').length
    });
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Type what you remember: {textKey}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="Type the text from memory here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="min-h-[300px] text-lg font-serif"
              />

              <Button
                onClick={analyzeText}
                disabled={!userInput.trim() || isAnalyzing}
                size="lg"
                className="w-full"
              >
                {isAnalyzing ? 'Analyzing...' : 'Submit & Analyze'}
              </Button>

              {analysis && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 text-center p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-2xl font-bold text-primary">{analysis.accuracy}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{analysis.correct}</div>
                      <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{analysis.wrong}</div>
                      <div className="text-xs text-muted-foreground">Wrong</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-500">{analysis.missed}</div>
                      <div className="text-xs text-muted-foreground">Missed</div>
                    </div>
                  </div>

                  {/* Inline Text Analysis */}
                  <div className="p-6 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-4">Detailed Analysis:</h4>
                    <div className="text-xl leading-relaxed whitespace-pre-wrap">
                      {analysis.diffResult.map((item: any, index: number) => {
                        if (item.status === 'correct') {
                          return (
                            <span key={index} className="text-green-600 font-medium">
                              {item.char}
                            </span>
                          );
                        } else if (item.status === 'wrong') {
                          return (
                            <span
                              key={index}
                              className="relative text-red-600 font-medium cursor-pointer hover:bg-red-100 px-0.5 rounded group"
                              title={`You wrote: ${item.userChar}`}
                            >
                              {item.char}
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                You wrote: {item.userChar}
                              </span>
                            </span>
                          );
                        } else {
                          return (
                            <span
                              key={index}
                              className="relative text-gray-400 font-medium cursor-pointer hover:bg-gray-100 px-0.5 rounded group"
                              title="You missed this!"
                            >
                              {item.char}
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                You missed this!
                              </span>
                            </span>
                          );
                        }
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-600 rounded"></span>
                        <span>Correct</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-600 rounded"></span>
                        <span>Wrong (hover to see what you wrote)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-gray-400 rounded"></span>
                        <span>Missed</span>
                      </div>
                    </div>
                  </div>

                  {analysis.correct === analysis.total && (
                    <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-3xl mb-2">🎉</div>
                      <div className="text-lg font-semibold text-green-800">
                        Perfect! You got everything right!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemoriseReview;
