import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { ArrowLeft, Book, Calendar, Search, Eye, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface StudyMaterial {
  id: string;
  title: string;
  source_type: string;
  created_at: string;
  summary: string;
  key_concepts: string[];
  flashcards: any; // Using any to handle Json type from Supabase
  quiz: any; // Using any to handle Json type from Supabase
  sources: string[];
  points_earned: number;
}

const StudyHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    if (user) {
      fetchMaterials();
    }
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Error",
        description: "Failed to load study materials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMaterials(prev => prev.filter(m => m.id !== id));
      setSelectedMaterial(null);
      
      toast({
        title: "Success",
        description: "Study material deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "Failed to delete study material.",
        variant: "destructive",
      });
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.key_concepts.some(concept => 
      concept.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Study Hub</h1>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your study materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              {materials.length} Materials
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {materials.reduce((acc, m) => acc + (m.points_earned || 0), 0)} Points Earned
            </Badge>
          </div>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Study Materials Yet</h3>
                <p className="mb-4">Start creating study materials to see them here!</p>
                <Button onClick={() => navigate('/study-materials')}>
                  Create Study Materials
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {material.title}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {material.source_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(material.created_at).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {material.key_concepts?.slice(0, 3).map((concept, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {concept}
                      </Badge>
                    ))}
                    {material.key_concepts?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{material.key_concepts.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {material.summary}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">
                      {material.flashcards?.length || 0} flashcards, {material.quiz?.questions?.length || 0} quiz questions
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedMaterial(material)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{material.title}</DialogTitle>
                          </DialogHeader>
                          {selectedMaterial && (
                            <ScrollArea className="h-[60vh]">
                              <Tabs defaultValue="summary" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="summary">Summary</TabsTrigger>
                                  <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                                  <TabsTrigger value="sources">Sources</TabsTrigger>
                                </TabsList>

                                <TabsContent value="summary" className="space-y-4 mt-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Key Concepts</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedMaterial.key_concepts?.map((concept, index) => (
                                        <Badge key={index} variant="secondary">
                                          {concept}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Summary</h4>
                                    <p className="text-sm leading-relaxed">
                                      {selectedMaterial.summary}
                                    </p>
                                  </div>
                                </TabsContent>

                                <TabsContent value="flashcards" className="space-y-3 mt-4">
                                  {selectedMaterial.flashcards?.map((card, index) => (
                                    <Card key={index} className="border-l-4 border-l-primary">
                                      <CardContent className="p-4">
                                        <div className="space-y-2">
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground">QUESTION</span>
                                            <p className="text-sm font-medium">{card.question}</p>
                                          </div>
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground">ANSWER</span>
                                            <p className="text-sm">{card.answer}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </TabsContent>

                                <TabsContent value="quiz" className="space-y-4 mt-4">
                                  {selectedMaterial.quiz?.questions?.map((question, index) => (
                                    <Card key={index} className="border-l-4 border-l-secondary">
                                      <CardContent className="p-4">
                                        <div className="space-y-3">
                                          <p className="font-medium text-sm">
                                            {index + 1}. {question.question}
                                          </p>
                                          <div className="grid grid-cols-1 gap-2">
                                            {Object.entries(question.options || {}).map(([key, value]) => (
                                              <div 
                                                key={key} 
                                                className={`p-2 rounded text-xs ${
                                                  key === question.correct_answer 
                                                    ? 'bg-green-100 border border-green-300 text-green-800' 
                                                    : 'bg-gray-50 border border-gray-200'
                                                }`}
                                              >
                                                <span className="font-medium">{key.toUpperCase()}.</span> {String(value)}
                                                {key === question.correct_answer && (
                                                  <span className="ml-2 text-green-600">✓ Correct</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </TabsContent>

                                <TabsContent value="sources" className="space-y-3 mt-4">
                                  {selectedMaterial.sources?.map((source, index) => (
                                    <Card key={index} className="border-l-4 border-l-accent">
                                      <CardContent className="p-4">
                                        <p className="text-sm">{source}</p>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </TabsContent>
                              </Tabs>
                            </ScrollArea>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteMaterial(material.id)}
                      >
                        <Trash2 className="h-3 w-3" />
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
    </div>
  );
};

export default StudyHub;