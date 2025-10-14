import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Loader2, Download, Brain, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudyMaterial {
  summary: string;
  flashcards: Array<{ question: string; answer: string }>;
  quiz: {
    questions: Array<{
      question: string;
      options: { a: string; b: string; c: string; d: string };
      correct_answer: string;
    }>;
  };
}

export default function NotesSummarizer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or JPG/PNG image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const extractTextFromImage = async (imageBase64: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("ocr-image-text", {
      body: { image: imageBase64 },
    });

    if (error) throw error;
    return data.text || "";
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For PDF, we'll convert pages to images and use OCR
    // This is a simplified implementation
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // For now, we'll treat PDFs as images
          // In production, you'd use pdf.js to extract text directly
          const base64 = (reader.result as string).split(",")[1];
          const text = await extractTextFromImage(base64);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      let text = "";

      if (selectedFile.type === "application/pdf") {
        text = await extractTextFromPDF(selectedFile);
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        text = await extractTextFromImage(base64);
      }

      if (!text || text.trim().length < 50) {
        toast({
          title: "No text found",
          description: "Could not extract enough text from the file. Please try a different file.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      setExtractedText(text);

      // Generate study materials
      const { data: materials, error } = await supabase.functions.invoke(
        "generate-study-materials",
        {
          body: {
            corrected_text: text,
            num_questions: 8,
          },
        }
      );

      if (error) throw error;

      setStudyMaterial(materials);

      toast({
        title: "Success!",
        description: "Your notes have been processed and study materials generated.",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSummary = () => {
    if (!studyMaterial) return;

    const content = `# Summary\n\n${studyMaterial.summary}\n\n# Flashcards\n\n${studyMaterial.flashcards
      .map((fc, i) => `${i + 1}. Q: ${fc.question}\n   A: ${fc.answer}`)
      .join("\n\n")}`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-notes-summary.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToFlashcards = async () => {
    if (!studyMaterial) return;

    try {
      const { error } = await supabase.from("flashcard_sets").insert({
        user_id: user.id,
        title: `Notes from ${selectedFile?.name || "Upload"}`,
        description: "Generated from uploaded notes",
        cards: studyMaterial.flashcards,
      });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Flashcards saved to your collection.",
      });

      navigate("/flashcards");
    } catch (error) {
      console.error("Error saving flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to save flashcards.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Notes Summarizer</h1>
          <p className="text-muted-foreground">
            Upload your notes in PDF or image format and get AI-powered summaries, flashcards, and
            quizzes.
          </p>
        </div>

        {!studyMaterial ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Upload Your Notes</CardTitle>
              <CardDescription>
                Support for PDF, JPG, and PNG files (max 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, JPG, or PNG (max 10MB)
                  </p>
                </label>
              </div>

              <Button
                onClick={processFile}
                disabled={!selectedFile || isProcessing}
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
                    <Brain className="mr-2 h-4 w-4" />
                    Process Notes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button onClick={downloadSummary} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Summary
              </Button>
              <Button onClick={saveToFlashcards} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Save to Flashcards
              </Button>
              <Button
                onClick={() => {
                  setStudyMaterial(null);
                  setSelectedFile(null);
                  setExtractedText("");
                }}
                variant="outline"
              >
                Upload New File
              </Button>
            </div>

            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="flashcards">
                  Flashcards ({studyMaterial.flashcards.length})
                </TabsTrigger>
                <TabsTrigger value="quiz">
                  Quiz ({studyMaterial.quiz.questions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {studyMaterial.summary.split("\n").map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flashcards" className="space-y-4">
                {studyMaterial.flashcards.map((card, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">Card {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground mb-1">
                          Question
                        </p>
                        <p>{card.question}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground mb-1">Answer</p>
                        <p>{card.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="quiz" className="space-y-4">
                {studyMaterial.quiz.questions.map((q, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="font-medium">{q.question}</p>
                      <div className="grid gap-2">
                        {Object.entries(q.options).map(([key, value]) => (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border ${
                              key === q.correct_answer
                                ? "bg-green-50 dark:bg-green-950 border-green-500"
                                : "bg-muted"
                            }`}
                          >
                            <span className="font-semibold">{key.toUpperCase()}.</span> {value}
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
    </DashboardLayout>
  );
}
