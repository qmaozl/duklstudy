import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Plus, BookOpen } from 'lucide-react';
import { chineseTextOptions, ChineseTextKey } from '@/data/chineseTexts';
import { supabase } from '@/integrations/supabase/client';

const MemorisePro = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [customParagraphs, setCustomParagraphs] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchCustomParagraphs();
    }
  }, [user]);

  const fetchCustomParagraphs = async () => {
    const { data, error } = await supabase
      .from('custom_paragraphs')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCustomParagraphs(data);
    }
  };

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

  const handleSelectText = (textKey: ChineseTextKey | 'custom') => {
    if (textKey === 'custom') {
      navigate('/memorise-pro/custom-new');
    } else {
      navigate(`/memorise-pro/review/${encodeURIComponent(textKey)}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Brain className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Memorise Pro</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Master your memorization with AI-powered analysis
            </p>
          </div>

          {/* DSE Chinese Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                DSE Chinese Texts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {chineseTextOptions.map((textKey) => (
                  <Button
                    key={textKey}
                    variant="outline"
                    className="h-auto py-4 px-4 text-left justify-start hover:bg-primary/10"
                    onClick={() => handleSelectText(textKey)}
                  >
                    <span className="text-sm font-medium">{textKey}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Paragraphs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Custom Paragraphs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-8 px-4 border-dashed border-2 hover:bg-primary/10"
                  onClick={() => handleSelectText('custom')}
                >
                  <Plus className="h-6 w-6 mr-2" />
                  Add Custom Paragraph
                </Button>
                
                {customParagraphs.map((paragraph) => (
                  <Button
                    key={paragraph.id}
                    variant="outline"
                    className="h-auto py-4 px-4 text-left justify-start hover:bg-primary/10"
                    onClick={() => navigate(`/memorise-pro/custom/${paragraph.id}`)}
                  >
                    <span className="text-sm font-medium">{paragraph.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MemorisePro;
