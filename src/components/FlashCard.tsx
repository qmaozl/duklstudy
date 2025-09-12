import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

interface FlashCardProps {
  question: string;
  answer: string;
  cardNumber: number;
}

const FlashCard: React.FC<FlashCardProps> = ({ question, answer, cardNumber }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative perspective-1000">
      <div 
        className={`relative w-full h-48 cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={handleCardClick}
      >
        {/* Front Side (Question) */}
        <Card className={`absolute inset-0 backface-hidden border-2 hover:border-primary/50 transition-colors ${
          !isFlipped ? 'border-blue-200' : ''
        }`}>
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center">
              <p className="font-medium text-center text-lg leading-relaxed">
                {question}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                Question {cardNumber}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RotateCcw className="h-3 w-3" />
                Click to flip
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Side (Answer) */}
        <Card className={`absolute inset-0 backface-hidden rotate-y-180 border-2 hover:border-primary/50 transition-colors ${
          isFlipped ? 'border-green-200' : ''
        }`}>
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center">
              <p className="text-center text-lg leading-relaxed text-muted-foreground">
                {answer}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                Answer {cardNumber}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RotateCcw className="h-3 w-3" />
                Click to flip back
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlashCard;