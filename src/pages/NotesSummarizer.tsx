import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Loader2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import FlashCard from '@/components/FlashCard';
import MindMap from '@/components/MindMap';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import KahootStyleQuiz from '@/components/KahootStyleQuiz';
import HKDSEQuiz from '@/components/HKDSEQuiz';

interface ProcessedFile {
  file: File;
  preview: string | null;
  extractedText: string;
  summary: string;
  flashcards: Array<{ question: string; answer: string }>;
  keyConcepts: string[];
  quiz: any;
  hkdseQuiz: any;
  studyMaterialId: string;
}

const NotesSummarizer = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const fileType = file.type;
      return fileType === 'application/pdf' || fileType.startsWith('image/');
    });

    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: 'Invalid file type',
        description: 'Some files were skipped. Only PDF and image files (JPG, PNG) are supported.',
        variant: 'destructive',
      });
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const newProcessedFiles: ProcessedFile[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStep(`Processing file ${i + 1} of ${files.length}: ${file.name}`);

        // Convert file to base64
        const base64File = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        // Create preview for images
        let preview: string | null = null;
        if (file.type.startsWith('image/')) {
          preview = base64File;
        }

        const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';

        // Extract text from file
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-notes', {
          body: { file: base64File, fileType }
        });

        if (extractError) {
          console.error('Extract error:', extractError);
          throw new Error(extractError.message || 'Failed to extract text');
        }

        const text = extractData.text;

        // Generate study materials
        const { data: studyData, error: studyError } = await supabase.functions.invoke('generate-study-materials', {
          body: { corrected_text: text, num_questions: 10 }
        });

        if (studyError) {
          console.error('Study data error:', studyError);
          throw new Error(studyError.message || 'Failed to generate study materials');
        }

        // Generate HKDSE quiz
        const { data: hkdseData, error: hkdseError } = await supabase.functions.invoke('generate-hkdse-quiz', {
          body: { text, num_questions: 10 }
        });

        if (hkdseError) {
          console.warn('HKDSE quiz generation failed:', hkdseError);
        }

        let savedId = '';
        if (userId) {
          const { data: savedData, error: saveError } = await supabase
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
            }])
            .select()
            .single();

          if (savedData) {
            savedId = savedData.id;
          }
        }

        newProcessedFiles.push({
          file,
          preview,
          extractedText: text,
          summary: studyData.summary || 'No summary generated',
          flashcards: studyData.flashcards || [],
          keyConcepts: studyData.key_concepts || [],
          quiz: studyData.quiz || null,
          hkdseQuiz: hkdseData?.questions || null,
          studyMaterialId: savedId,
        });
      }

      setProcessedFiles(newProcessedFiles);
      setCurrentPageIndex(0);
      setFiles([]);
      setProcessingStep('');
      
      toast({
        title: 'Success!',
        description: `${newProcessedFiles.length} file(s) processed and saved`,
      });
    } catch (error: any) {
      console.error('Error processing files:', error);
      setProcessingStep('');
      toast({
        title: 'Error',
        description: error.message || 'Failed to process your notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentFile = processedFiles[currentPageIndex];

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Notes Summarizer</h1>
          <p className="text-muted-foreground">
            Upload your notes in PDF or image format to generate summaries, flashcards, and mind maps
          </p>
        </div>

        {isProcessing ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Processing Your Notes
              </CardTitle>
              <CardDescription>
                This may take a minute. Please don't close this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {processingStep.includes('Uploading') ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <span className="text-sm font-medium">Uploading file</span>
                </div>
                <div className="flex items-center gap-3">
                  {processingStep.includes('Extracting') ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : processingStep.includes('Generating') || processingStep.includes('Creating') || processingStep.includes('Saving') ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  <span className="text-sm font-medium">Extracting text from your notes</span>
                </div>
                <div className="flex items-center gap-3">
                  {processingStep.includes('Generating') ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : processingStep.includes('Creating') || processingStep.includes('Saving') ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  <span className="text-sm font-medium">Generating AI summary and flashcards</span>
                </div>
                <div className="flex items-center gap-3">
                  {processingStep.includes('Creating') ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : processingStep.includes('Saving') ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  <span className="text-sm font-medium">Creating mind map</span>
                </div>
                <div className="flex items-center gap-3">
                  {processingStep.includes('Saving') ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  <span className="text-sm font-medium">Saving to your library</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-32 w-full mt-4" />
              </div>
            </CardContent>
          </Card>
        ) : processedFiles.length === 0 && files.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Notes</CardTitle>
              <CardDescription>
                Supports multiple PDF and image files (JPG, PNG)
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
                  multiple
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Multiple PDFs or images up to 10MB each
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>
        ) : processedFiles.length > 0 ? (
          <div className="space-y-4">
            {processedFiles.length > 1 && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentPageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm font-medium">
                      Page {currentPageIndex + 1} of {processedFiles.length}: {currentFile.file.name}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPageIndex(prev => Math.min(processedFiles.length - 1, prev + 1))}
                      disabled={currentPageIndex === processedFiles.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="hkdse">HKDSE</TabsTrigger>
              <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>AI-generated summary of your notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-relaxed">{currentFile.summary}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flashcards">
              <Card>
                <CardHeader>
                  <CardTitle>Flashcards</CardTitle>
                  <CardDescription>
                    {currentFile.flashcards.length} flashcards generated from your notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentFile.flashcards.map((card, index) => (
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

            <TabsContent value="quiz">
              {currentFile.quiz && currentFile.quiz.questions && currentFile.quiz.questions.length > 0 ? (
                <KahootStyleQuiz
                  questions={currentFile.quiz.questions}
                  studyMaterialId={currentFile.studyMaterialId}
                  onPointsEarned={() => {}}
                  onWrongAnswer={() => {}}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz</CardTitle>
                    <CardDescription>No quiz questions available</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="hkdse">
              {currentFile.hkdseQuiz && currentFile.hkdseQuiz.length > 0 ? (
                <HKDSEQuiz questions={currentFile.hkdseQuiz} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>HKDSE Quiz</CardTitle>
                    <CardDescription>No HKDSE questions available</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="mindmap">
              <Card>
                <CardHeader>
                  <CardTitle>Mind Map</CardTitle>
                  <CardDescription>Visual representation of key concepts</CardDescription>
                </CardHeader>
                <CardContent>
                  <MindMap concepts={currentFile.keyConcepts} />
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
                    value={currentFile.extractedText}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        ) : null}

        {processedFiles.length > 0 && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setProcessedFiles([]);
                setCurrentPageIndex(0);
              }}
            >
              Upload New Files
            </Button>
          </div>
        )}
        
        {files.length > 0 && !isProcessing && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Files Ready to Process ({files.length})</CardTitle>
              <CardDescription>Review your files before processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="flex-1"
                  size="lg"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Process {files.length} File{files.length > 1 ? 's' : ''}
                </Button>
                <label htmlFor="file-upload-more">
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                  >
                    <span>Add More</span>
                  </Button>
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-more"
                  multiple
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotesSummarizer;
