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

    const originalChars = normalizedOriginal.split('');
    const userChars = normalizedUser.split('');

    const missed: string[] = [];
    const wrong: string[] = [];
    const extra: string[] = [];

    // Simple diff algorithm
    let i = 0, j = 0;
    while (i < originalChars.length || j < userChars.length) {
      if (i < originalChars.length && j < userChars.length) {
        if (originalChars[i] === userChars[j]) {
          i++;
          j++;
        } else {
          // Check if it's a skip
          if (j + 1 < userChars.length && originalChars[i] === userChars[j + 1]) {
            extra.push(userChars[j]);
            j++;
          } else if (i + 1 < originalChars.length && originalChars[i + 1] === userChars[j]) {
            missed.push(originalChars[i]);
            i++;
          } else {
            wrong.push(`Expected: ${originalChars[i]}, Got: ${userChars[j]}`);
            i++;
            j++;
          }
        }
      } else if (i < originalChars.length) {
        missed.push(originalChars[i]);
        i++;
      } else {
        extra.push(userChars[j]);
        j++;
      }
    }

    const accuracy = ((originalChars.length - missed.length - wrong.length) / originalChars.length * 100).toFixed(1);

    setAnalysis({
      missed,
      wrong,
      extra,
      accuracy
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
                <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">Accuracy: {analysis.accuracy}%</h3>
                  </div>

                  {analysis.missed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-destructive mb-2">Missed Characters ({analysis.missed.length}):</h4>
                      <p className="text-sm">{analysis.missed.join(', ')}</p>
                    </div>
                  )}

                  {analysis.wrong.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-orange-600 mb-2">Wrong Characters ({analysis.wrong.length}):</h4>
                      <div className="text-sm space-y-1">
                        {analysis.wrong.map((w: string, i: number) => (
                          <p key={i}>{w}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.extra.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 mb-2">Extra Characters ({analysis.extra.length}):</h4>
                      <p className="text-sm">{analysis.extra.join(', ')}</p>
                    </div>
                  )}

                  {analysis.missed.length === 0 && analysis.wrong.length === 0 && analysis.extra.length === 0 && (
                    <div className="text-center text-green-600 font-semibold">
                      Perfect! You got everything right! 🎉
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
