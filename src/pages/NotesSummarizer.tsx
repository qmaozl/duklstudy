import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import FlashCard from '@/components/FlashCard';
import MindMap from '@/components/MindMap';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/DashboardLayout';

const NotesSummarizer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState<Array<{ question: string; answer: string }>>([]);
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (fileType === 'application/pdf' || fileType.startsWith('image/')) {
        setFile(selectedFile);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF or image file (JPG, PNG)',
          variant: 'destructive',
        });
      }
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64File = e.target?.result as string;
        const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';

        // Extract text from file
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-notes', {
          body: { file: base64File, fileType }
        });

        if (extractError) throw extractError;

        const text = extractData.text;
        setExtractedText(text);

        // Generate study materials
        const { data: studyData, error: studyError } = await supabase.functions.invoke('generate-study-materials', {
          body: { corrected_text: text, num_questions: 10 }
        });

        if (studyError) throw studyError;

        setSummary(studyData.summary || 'No summary generated');
        setFlashcards(studyData.flashcards || []);
        setKeyConcepts(studyData.key_concepts || []);

        if (userId) {
          const { error: saveError } = await supabase
            .from('study_materials')
            .insert([{
              user_id: userId,
              source_type: 'upload',
              title: file.name,
              original_content: text,
              summary: studyData.summary,
              flashcards: studyData.flashcards,
              key_concepts: studyData.key_concepts,
              quiz: studyData.quiz,
            }]);

          if (saveError) throw saveError;
        }

        toast({
          title: 'Success!',
          description: 'Your notes have been processed and saved',
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Notes Summarizer</h1>
          <p className="text-muted-foreground">
            Upload your notes in PDF or image format to generate summaries, flashcards, and mind maps
          </p>
        </div>

        {!extractedText ? (
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Notes</CardTitle>
              <CardDescription>
                Supports PDF and image files (JPG, PNG)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF or images up to 10MB
                  </p>
                </label>
              </div>

              {file && (
                <Button
                  onClick={processFile}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Process Notes
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
              <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
              <TabsTrigger value="text">Extracted Text</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>AI-generated summary of your notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flashcards">
              <Card>
                <CardHeader>
                  <CardTitle>Flashcards</CardTitle>
                  <CardDescription>
                    {flashcards.length} flashcards generated from your notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {flashcards.map((card, index) => (
                    <FlashCard
                      key={index}
                      question={card.question}
                      answer={card.answer}
                      cardNumber={index + 1}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mindmap">
              <Card>
                <CardHeader>
                  <CardTitle>Mind Map</CardTitle>
                  <CardDescription>Visual representation of key concepts</CardDescription>
                </CardHeader>
                <CardContent>
                  <MindMap concepts={keyConcepts} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text">
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Text</CardTitle>
                  <CardDescription>Raw text extracted from your file</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={extractedText}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {extractedText && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setExtractedText('');
                setSummary('');
                setFlashcards([]);
                setKeyConcepts([]);
              }}
            >
              Upload Another File
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotesSummarizer;
