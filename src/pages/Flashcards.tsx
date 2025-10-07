import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Plus, Trash2, Eye, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardSet {
  id: string;
  title: string;
  description?: string;
  cards: Flashcard[];
  created_at: string;
}

export default function Flashcards() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [currentCards, setCurrentCards] = useState<Array<{front: string, back: string}>>([
    { front: '', back: '' }
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchFlashcardSets();
    }
  }, [user, loading, navigate]);

  const fetchFlashcardSets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('flashcard_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching flashcard sets:', error);
      return;
    }

    setSets(data || []);
  };

  const addCardField = () => {
    setCurrentCards([...currentCards, { front: '', back: '' }]);
  };

  const removeCardField = (index: number) => {
    setCurrentCards(currentCards.filter((_, i) => i !== index));
  };

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...currentCards];
    updated[index][field] = value;
    setCurrentCards(updated);
  };

  const createFlashcardSet = async () => {
    if (!user || !newSetTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your flashcard set",
        variant: "destructive"
      });
      return;
    }

    const validCards = currentCards.filter(card => card.front.trim() && card.back.trim());

    if (validCards.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one card with both front and back content",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('flashcard_sets')
      .insert({
        user_id: user.id,
        title: newSetTitle,
        description: newSetDescription,
        cards: validCards.map((card, index) => ({
          id: `card-${Date.now()}-${index}`,
          ...card
        }))
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create flashcard set",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success!",
      description: "Flashcard set created successfully"
    });

    setNewSetTitle('');
    setNewSetDescription('');
    setCurrentCards([{ front: '', back: '' }]);
    setIsCreateDialogOpen(false);
    fetchFlashcardSets();
  };

  const deleteSet = async (setId: string) => {
    const { error } = await supabase
      .from('flashcard_sets')
      .delete()
      .eq('id', setId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete flashcard set",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Flashcard set deleted successfully"
    });

    fetchFlashcardSets();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <BookOpen className="h-10 w-10 text-primary" />
                Flashcard Hub
              </h1>
              <p className="text-muted-foreground mt-2">Create and study your flashcards</p>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Set
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Flashcard Set</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={newSetTitle}
                      onChange={(e) => setNewSetTitle(e.target.value)}
                      placeholder="e.g., Biology Chapter 5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Textarea
                      value={newSetDescription}
                      onChange={(e) => setNewSetDescription(e.target.value)}
                      placeholder="What are these flashcards about?"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Cards</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCardField}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Card
                      </Button>
                    </div>

                    {currentCards.map((card, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Card {index + 1}</span>
                            {currentCards.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCardField(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Front</label>
                            <Textarea
                              value={card.front}
                              onChange={(e) => updateCard(index, 'front', e.target.value)}
                              placeholder="Question or term"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Back</label>
                            <Textarea
                              value={card.back}
                              onChange={(e) => updateCard(index, 'back', e.target.value)}
                              placeholder="Answer or definition"
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button onClick={createFlashcardSet} className="w-full">
                    Create Flashcard Set
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Flashcard Sets Grid */}
          {sets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No flashcard sets yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first flashcard set to start studying
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Set
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sets.map((set) => (
                <Card key={set.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{set.title}</CardTitle>
                    {set.description && (
                      <p className="text-sm text-muted-foreground">{set.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {set.cards?.length || 0} cards
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/flashcards/study/${set.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Study
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSet(set.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
