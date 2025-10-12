import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, Sparkles } from 'lucide-react';
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
      title: "Study Hub",
      description: "Access all your generated flashcards, quizzes, and summaries in one place",
      icon: <Book className="h-8 w-8" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      action: () => navigate('/study-hub'),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
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