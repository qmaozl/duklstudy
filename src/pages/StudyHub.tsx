import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { ArrowLeft, Book, Calendar, Search, Eye, Trash2, Folder, FileText, Youtube, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AdBanner } from '@/components/AdBanner';
import KahootStyleQuiz from '@/components/KahootStyleQuiz';
import FlashCard from '@/components/FlashCard';

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
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

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

  // Extract unique subjects from materials (from first key concept or source type)
  const subjects = ['all', ...new Set(materials.map(m => 
    m.key_concepts?.[0] || m.source_type
  ).filter(Boolean))];

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.key_concepts?.some(concept => 
        concept.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesSubject = selectedSubject === 'all' || 
      material.key_concepts?.[0] === selectedSubject ||
      (selectedSubject === material.source_type && !material.key_concepts?.[0]);
    
    return matchesSearch && matchesSubject;
  });

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
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Banner Ad */}
        <AdBanner format="horizontal" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Folder className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Study Hub</h1>
            </div>
            <p className="text-muted-foreground">
              All your study materials organized by subject
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Search and Filters */}
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
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject === 'all' ? 'All Subjects' : subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-4">
            <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {materials.length} Materials
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {materials.reduce((acc, m) => acc + (m.points_earned || 0), 0)} Points
            </Badge>
          </div>
        </div>

        {/* Materials Grid - Organized by Subject */}
        {filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Study Materials Found</h3>
                <p className="mb-4">Start creating study materials or adjust your filters!</p>
                <Button onClick={() => navigate('/video-summarizer')}>
                  Create Study Materials
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : selectedSubject === 'all' ? (
          // Group by subjects when "All Subjects" is selected
          <div className="space-y-8">
            {subjects.filter(s => s !== 'all').map((subject) => {
              const subjectMaterials = filteredMaterials.filter(m => 
                m.key_concepts?.[0] === subject || 
                (subject === m.source_type && !m.key_concepts?.[0])
              );
              
              if (subjectMaterials.length === 0) return null;
              
              return (
                <div key={subject}>
                  <div className="flex items-center gap-2 mb-4">
                    <Folder className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold">{subject}</h2>
                    <Badge variant="outline">{subjectMaterials.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectMaterials.map((material) => (
                      <Card key={material.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {material.source_type === 'youtube_video' && <Youtube className="h-4 w-4 text-red-500" />}
                              {material.source_type === 'upload' && <Upload className="h-4 w-4 text-blue-500" />}
                              {material.source_type === 'custom' && <FileText className="h-4 w-4 text-green-500" />}
                              <Badge variant="outline" className="text-xs">{material.source_type}</Badge>
                            </div>
                          </div>
                          <CardTitle className="text-base line-clamp-2">{material.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            {new Date(material.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-1">
                            {material.key_concepts?.slice(0, 2).map((concept, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">{concept}</Badge>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {material.flashcards?.length || 0} flashcards • {material.quiz?.questions?.length || 0} questions
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="default" className="flex-1" onClick={() => setSelectedMaterial(material)}>
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-5xl max-h-[85vh]">
                                <DialogHeader>
                                  <DialogTitle>{material.title}</DialogTitle>
                                </DialogHeader>
                                {selectedMaterial && (
                                  <ScrollArea className="h-[70vh] pr-4">
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
                                              <Badge key={index} variant="secondary">{concept}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-semibold mb-2">Summary</h4>
                                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMaterial.summary}</p>
                                        </div>
                                      </TabsContent>

                                      <TabsContent value="flashcards" className="space-y-3 mt-4">
                                        {selectedMaterial.flashcards?.map((card, index) => (
                                          <FlashCard
                                            key={index}
                                            question={card.question}
                                            answer={card.answer}
                                            cardNumber={index + 1}
                                          />
                                        ))}
                                      </TabsContent>

                                      <TabsContent value="quiz" className="mt-4">
                                        {selectedMaterial.quiz?.questions && selectedMaterial.quiz.questions.length > 0 ? (
                                          <KahootStyleQuiz
                                            questions={selectedMaterial.quiz.questions}
                                            studyMaterialId={selectedMaterial.id}
                                            onPointsEarned={() => {}}
                                            onWrongAnswer={() => {}}
                                          />
                                        ) : (
                                          <Card>
                                            <CardHeader>
                                              <CardTitle>No Quiz Available</CardTitle>
                                              <CardDescription>This material doesn't have quiz questions yet.</CardDescription>
                                            </CardHeader>
                                          </Card>
                                        )}
                                      </TabsContent>

                                      <TabsContent value="sources" className="space-y-3 mt-4">
                                        {selectedMaterial.sources && selectedMaterial.sources.length > 0 ? (
                                          selectedMaterial.sources.map((source, index) => (
                                            <Card key={index} className="border-l-4 border-l-accent">
                                              <CardContent className="p-4">
                                                <p className="text-sm">{source}</p>
                                              </CardContent>
                                            </Card>
                                          ))
                                        ) : (
                                          <Card>
                                            <CardContent className="p-4">
                                              <p className="text-sm text-muted-foreground">No sources available</p>
                                            </CardContent>
                                          </Card>
                                        )}
                                      </TabsContent>
                                    </Tabs>
                                  </ScrollArea>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="destructive" onClick={() => deleteMaterial(material.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Simple grid when specific subject is selected
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {material.source_type === 'youtube_video' && <Youtube className="h-4 w-4 text-red-500" />}
                      {material.source_type === 'upload' && <Upload className="h-4 w-4 text-blue-500" />}
                      {material.source_type === 'custom' && <FileText className="h-4 w-4 text-green-500" />}
                      <Badge variant="outline" className="text-xs">{material.source_type}</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base line-clamp-2">{material.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {new Date(material.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {material.key_concepts?.slice(0, 2).map((concept, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{concept}</Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {material.flashcards?.length || 0} flashcards • {material.quiz?.questions?.length || 0} questions
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="default" className="flex-1" onClick={() => setSelectedMaterial(material)}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[85vh]">
                        <DialogHeader>
                          <DialogTitle>{material.title}</DialogTitle>
                        </DialogHeader>
                        {selectedMaterial && (
                          <ScrollArea className="h-[70vh] pr-4">
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
                                      <Badge key={index} variant="secondary">{concept}</Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Summary</h4>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMaterial.summary}</p>
                                </div>
                              </TabsContent>

                              <TabsContent value="flashcards" className="space-y-3 mt-4">
                                {selectedMaterial.flashcards?.map((card, index) => (
                                  <FlashCard
                                    key={index}
                                    question={card.question}
                                    answer={card.answer}
                                    cardNumber={index + 1}
                                  />
                                ))}
                              </TabsContent>

                              <TabsContent value="quiz" className="mt-4">
                                {selectedMaterial.quiz?.questions && selectedMaterial.quiz.questions.length > 0 ? (
                                  <KahootStyleQuiz
                                    questions={selectedMaterial.quiz.questions}
                                    studyMaterialId={selectedMaterial.id}
                                    onPointsEarned={() => {}}
                                    onWrongAnswer={() => {}}
                                  />
                                ) : (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>No Quiz Available</CardTitle>
                                      <CardDescription>This material doesn't have quiz questions yet.</CardDescription>
                                    </CardHeader>
                                  </Card>
                                )}
                              </TabsContent>

                              <TabsContent value="sources" className="space-y-3 mt-4">
                                {selectedMaterial.sources && selectedMaterial.sources.length > 0 ? (
                                  selectedMaterial.sources.map((source, index) => (
                                    <Card key={index} className="border-l-4 border-l-accent">
                                      <CardContent className="p-4">
                                        <p className="text-sm">{source}</p>
                                      </CardContent>
                                    </Card>
                                  ))
                                ) : (
                                  <Card>
                                    <CardContent className="p-4">
                                      <p className="text-sm text-muted-foreground">No sources available</p>
                                    </CardContent>
                                  </Card>
                                )}
                              </TabsContent>
                            </Tabs>
                          </ScrollArea>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="destructive" onClick={() => deleteMaterial(material.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
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