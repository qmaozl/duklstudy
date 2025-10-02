import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AvatarSelectorProps {
  onComplete: () => void;
}

const AvatarSelector = ({ onComplete }: AvatarSelectorProps) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);

  const saveAvatar = async () => {
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_gender: selected })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save avatar.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Avatar selected!',
        description: 'Welcome to the game world!',
      });
      onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Choose Your Avatar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelected('male')}
              className={`p-6 rounded-lg border-2 transition-all ${
                selected === 'male'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-6xl mb-2">👨‍🎓</div>
              <p className="font-medium">Male Student</p>
            </button>
            <button
              onClick={() => setSelected('female')}
              className={`p-6 rounded-lg border-2 transition-all ${
                selected === 'female'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-6xl mb-2">👩‍🎓</div>
              <p className="font-medium">Female Student</p>
            </button>
          </div>
          <Button onClick={saveAvatar} disabled={loading} className="w-full" size="lg">
            {loading ? 'Saving...' : 'Start Your Journey'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvatarSelector;
