import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageOCRProps {
  onTextExtracted: (text: string) => void;
}

const ImageOCR: React.FC<ImageOCRProps> = ({ onTextExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setExtractedText('');

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      console.log('Processing image with OCR...');
      
      // Call the OCR edge function
      const { data, error } = await supabase.functions.invoke('ocr-image-text', {
        body: { image: base64 }
      });

      if (error) {
        throw new Error(error.message || 'OCR processing failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract text from image');
      }

      const text = data.text || '';
      setExtractedText(text);
      onTextExtracted(text);

      toast({
        title: "Text Extracted Successfully! 📄",
        description: `Extracted ${text.length} characters from your image.`
      });

    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: "OCR Processing Failed",
        description: error instanceof Error ? error.message : "Failed to extract text from image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processImage(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processImage(files[0]);
    }
  };

  return (
    <Card className="w-full bg-card/40 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <FileText className="w-5 h-5 text-secondary" />
          Image to Text (OCR)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/30 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          
          <div className="flex flex-col items-center gap-3">
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg font-medium text-card-foreground">Processing Image...</p>
                <p className="text-sm text-muted-foreground">Extracting text using Google Cloud Vision</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-primary" />
                <div>
                  <p className="text-lg font-medium text-card-foreground">Upload an image to extract text</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag & drop or click to select an image file
                  </p>
                </div>
                <Button variant="outline" className="mt-2">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Extracted Text Display */}
        {extractedText && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-card-foreground">Extracted Text:</span>
            </div>
            <Textarea
              value={extractedText}
              readOnly
              className="min-h-[120px] resize-none bg-muted/30 border-muted"
              placeholder="Extracted text will appear here..."
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{extractedText.length} characters extracted</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(extractedText)}
                className="h-6 px-2"
              >
                Copy Text
              </Button>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
          <AlertCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-card-foreground">Powered by Google Cloud Vision</p>
            <p className="text-muted-foreground">
              Supports text extraction from images, documents, handwriting, and more.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageOCR;