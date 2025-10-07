import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardStudy() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [setTitle, setSetTitle] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && setId) {
      fetchFlashcardSet();
    }
  }, [user, setId]);

  const fetchFlashcardSet = async () => {
    if (!setId) return;

    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('id', setId)
      .single();

    if (error || !data) {
      console.error('Error fetching flashcard set:', error);
      navigate('/flashcards');
      return;
    }

    setSetTitle((data as any).title);
    setCards((data as any).cards || []);
    setLoading(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto text-center">
            <p>No cards found in this set</p>
            <Button onClick={() => navigate('/flashcards')} className="mt-4">
              Back to Flashcards
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/flashcards')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{setTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  Card {currentIndex + 1} of {cards.length}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Flashcard */}
          <div className="perspective-1000 min-h-[400px] flex items-center justify-center">
            <Card
              className={cn(
                "w-full h-[400px] cursor-pointer transition-all duration-500 transform-style-preserve-3d relative",
                isFlipped && "rotate-y-180"
              )}
              onClick={handleFlip}
            >
              {/* Front */}
              <div className={cn(
                "absolute inset-0 backface-hidden flex items-center justify-center p-8 text-center",
                "bg-card"
              )}>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Front</p>
                  <p className="text-2xl font-medium">{currentCard.front}</p>
                  <p className="text-xs text-muted-foreground">Click to flip</p>
                </div>
              </div>

              {/* Back */}
              <div className={cn(
                "absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center p-8 text-center",
                "bg-primary text-primary-foreground"
              )}>
                <div className="space-y-4">
                  <p className="text-sm opacity-80">Back</p>
                  <p className="text-2xl font-medium">{currentCard.back}</p>
                  <p className="text-xs opacity-80">Click to flip</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {cards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsFlipped(false);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentIndex
                      ? "bg-primary"
                      : "bg-muted hover:bg-muted-foreground"
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
