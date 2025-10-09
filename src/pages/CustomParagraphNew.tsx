import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CustomParagraphNew = () => {
  const { user, loading, subscription } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      // Check usage limit for free users
      const isPro = subscription?.subscription_tier === 'pro';
      
      if (!isPro) {
        const { data: existingParagraphs, error: countError } = await supabase
          .from('custom_paragraphs' as any)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) throw countError;

        const count = existingParagraphs?.length || 0;
        if (count >= 3) {
          toast({
            title: "Limit reached",
            description: "Free users can create up to 3 custom paragraphs. Upgrade to Pro for unlimited access!",
            variant: "destructive"
          });
          setSaving(false);
          return;
        }
      }

      // Save the paragraph
      const { error } = await supabase
        .from('custom_paragraphs' as any)
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim()
        });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Your custom paragraph has been created."
      });

      navigate('/memorise-pro');
    } catch (error) {
      console.error('Error saving paragraph:', error);
      toast({
        title: "Error",
        description: "Failed to save paragraph. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

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
            Back to Memorise Pro
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Create Custom Paragraph</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Enter paragraph title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Enter the text you want to memorize..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] font-serif text-lg whitespace-pre-wrap"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
                className="w-full"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save Paragraph'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomParagraphNew;
