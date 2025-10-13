import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Brain, Map, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ImageOCR from '@/components/ImageOCR';
import MindMapView from '@/components/MindMapView';
import { useNavigate } from 'react-router-dom';

interface StudyMaterial {
  summary: string;
  flashcards: Array<{
    front: string;
    back: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correct_answer: string;
  }>;
  key_concepts?: string[];
}

const NoteSummarizer = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive"
      });
      return;
    }

    setUploadedFileName(file.name);
    setIsProcessing(true);

    try {
      // Create a temporary file path for parsing
      const formData = new FormData();
      formData.append('file', file);

      // For now, we'll use a simple text extraction
      // In production, you'd use a proper PDF parsing library
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        // Basic text extraction (you can enhance this with pdf.js or similar)
        const extractedContent = text.slice(0, 10000); // Limit to prevent overload
        setExtractedText(extractedContent);
        await processText(extractedContent, file.name);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process PDF file",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleImageTextExtracted = async (text: string) => {
    setExtractedText(text);
    setUploadedFileName('Image Upload');
    await processText(text, 'Image Upload');
  };

  const processText = async (text: string, fileName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use this feature",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Generating study materials from text...');
      const { data, error } = await supabase.functions.invoke('generate-study-materials', {
        body: { 
          corrected_text: text,
          num_questions: 10
        }
      });

      if (error) throw error;

      console.log('Study materials generated:', data);
      setStudyMaterial(data);

      // Save to database
      const { error: dbError } = await supabase
        .from('study_materials')
        .insert({
          user_id: user.id,
          title: fileName,
          source_type: 'notes_upload',
          original_content: text,
          corrected_text: text,
          summary: data.summary,
          flashcards: data.flashcards,
          quiz: data.quiz,
          key_concepts: data.key_concepts || []
        });

      if (dbError) throw dbError;

      toast({
        title: "Success! 🎉",
        description: "Your notes have been processed and study materials created"
      });
    } catch (error) {
      console.error('Error processing text:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to generate study materials",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportAsPDF = () => {
    toast({
      title: "Export Feature",
      description: "PDF export will be available soon!",
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Notes Summarizer
        </h1>
        <p className="text-muted-foreground">
          Upload your notes in PDF or image format to generate summaries, flashcards, and mind maps
        </p>
      </div>

      {/* Upload Section */}
      {!studyMaterial && (
        <div className="grid gap-6 mb-8 md:grid-cols-2">
          {/* PDF Upload */}
          <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Upload PDF
              </CardTitle>
              <CardDescription>
                Upload your notes as a PDF document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePDFUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Click or drag PDF file here
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload with OCR */}
          <ImageOCR onTextExtracted={handleImageTextExtracted} />
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Card className="mb-8 bg-primary/10 border-primary/30">
          <CardContent className="flex items-center gap-4 p-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <p className="font-medium">Processing your notes...</p>
              <p className="text-sm text-muted-foreground">
                Extracting text, generating summaries, and creating study materials
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {studyMaterial && !isProcessing && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Study Materials Generated</h2>
              <p className="text-sm text-muted-foreground">From: {uploadedFileName}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportAsPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={() => {
                setStudyMaterial(null);
                setExtractedText('');
                setUploadedFileName('');
              }}>
                New Upload
              </Button>
            </div>
          </div>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">
                <Brain className="w-4 h-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="flashcards">
                <FileText className="w-4 h-4 mr-2" />
                Flashcards ({studyMaterial.flashcards?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="mindmap">
                <Map className="w-4 h-4 mr-2" />
                Mind Map
              </TabsTrigger>
              <TabsTrigger value="quiz">
                Quiz ({studyMaterial.quiz?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{studyMaterial.summary}</p>
                  </div>
                </CardContent>
              </Card>

              {studyMaterial.key_concepts && studyMaterial.key_concepts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Concepts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studyMaterial.key_concepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="flashcards" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {studyMaterial.flashcards?.map((card, idx) => (
                  <Card key={idx} className="bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Card {idx + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Front:</p>
                        <p className="font-medium">{card.front}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Back:</p>
                        <p>{card.back}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mindmap">
              <MindMapView 
                summary={studyMaterial.summary}
                keyConcepts={studyMaterial.key_concepts || []}
              />
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4">
              {studyMaterial.quiz?.map((question, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="font-medium">{question.question}</p>
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg border ${
                            option === question.correct_answer
                              ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300'
                              : 'bg-muted/30 border-muted'
                          }`}
                        >
                          {option}
                          {option === question.correct_answer && (
                            <span className="ml-2 text-xs">(Correct)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default NoteSummarizer;
