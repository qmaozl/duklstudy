import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Youtube, Book, MessageCircle, Upload, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FeatureCards = () => {
  const navigate = useNavigate();
  
  const handleComingSoon = (feature: string) => {
    toast({
      title: "Coming Soon!",
      description: `${feature} is being developed and will be available soon.`,
    });
  };

  const features = [
    {
      title: "Generate Materials",
      description: "Input your study text and let AI create summaries, flashcards, and quizzes instantly",
      icon: <Upload className="h-8 w-8" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      action: () => navigate('/study-materials'),
    },
    {
      title: "Summarize Video",
      description: "Paste a YouTube link and get AI-generated summaries, flashcards, and quizzes",
      icon: <Youtube className="h-8 w-8" />,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      action: () => navigate('/video-summarizer'),
    },
    {
      title: "Study Hub",
      description: "Access all your generated flashcards, quizzes, and summaries in one place",
      icon: <Book className="h-8 w-8" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      action: () => navigate('/study-hub'),
    },
    {
      title: "AI Tutor",
      description: "Chat with StudyBot, your personal AI tutor available 24/7 for any questions",
      icon: <MessageCircle className="h-8 w-8" />,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      action: () => navigate('/ai-tutor'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {features.map((feature, index) => (
        <Card
          key={index}
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${feature.borderColor} shadow-soft`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${feature.bgColor} ${feature.borderColor} border`}>
                <div className={feature.color}>
                  {feature.icon}
                </div>
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
            <Button 
              onClick={feature.action}
              className="w-full"
              variant="outline"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Try {feature.title}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeatureCards;