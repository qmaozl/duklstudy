import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { compareTextLCS } from '@/utils/lcsCompare';

const CustomParagraphReview = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [paragraph, setParagraph] = useState<any>(null);
  const [isMemorizing, setIsMemorizing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchParagraph();
    }
  }, [user, id]);

  const fetchParagraph = async () => {
    const { data, error } = await supabase
      .from('custom_paragraphs' as any)
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (error || !data) {
      navigate('/memorise-pro');
      return;
    }

    setParagraph(data);
    setLoadingData(false);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!paragraph) {
    return null;
  }

  if (isMemorizing) {
    return (
      <MemorizingMode
        title={paragraph.title}
        text={paragraph.content}
        onBack={() => setIsMemorizing(false)}
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
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
              <CardTitle>{paragraph.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-lg leading-relaxed font-serif">
                  {paragraph.content}
                </div>
              </div>

              <Button
                onClick={() => setIsMemorizing(true)}
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
    </DashboardLayout>
  );
};

interface MemorizingModeProps {
  title: string;
  text: string;
  onBack: () => void;
}

const MemorizingMode: React.FC<MemorizingModeProps> = ({ title, text, onBack }) => {
  const [userInput, setUserInput] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = () => {
    setIsAnalyzing(true);
    
    // Use LCS-based character comparison
    const result = compareTextLCS(text, userInput);
    
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Review
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Type what you remember: {title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="Type the text from memory here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="min-h-[300px] text-lg font-serif whitespace-pre-wrap"
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
                  <div className="grid grid-cols-3 gap-4 text-center p-4 bg-muted rounded-lg">
                    <div>
                      <div className="text-2xl font-bold text-primary">{analysis.accuracy}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{analysis.correct}</div>
                      <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-500">{analysis.missed}</div>
                      <div className="text-xs text-muted-foreground">Missed</div>
                    </div>
                  </div>

                  <div className="p-6 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-4">Detailed Analysis:</h4>
                    <div className="text-xl leading-relaxed break-words">
                      {analysis.diffResult.map((item: any, index: number) => {
                        if (item.status === 'correct') {
                          return (
                            <span key={index} className="text-green-600 font-medium">
                              {item.original}
                            </span>
                          );
                        } else {
                          return (
                            <span
                              key={index}
                              className="relative text-gray-400 font-medium cursor-pointer hover:bg-gray-100 px-0.5 rounded group"
                              title="You missed this!"
                            >
                              {item.original}
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                You missed this!
                              </span>
                            </span>
                          );
                        }
                      })}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t flex gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-600 rounded"></span>
                        <span>Correct</span>
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
    </DashboardLayout>
  );
};

export default CustomParagraphReview;
