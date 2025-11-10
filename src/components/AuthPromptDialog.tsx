import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles } from 'lucide-react';

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20">
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Create Your Free Account
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Sign up now to unlock all features and start your study journey with DUKL.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          <Button
            size="lg"
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold text-base h-12"
            onClick={() => {
              onOpenChange(false);
              navigate('/auth?mode=signup');
            }}
          >
            Sign Up - It's Free
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="w-full border-primary/30 hover:bg-primary/10 font-medium text-base h-12"
            onClick={() => {
              onOpenChange(false);
              navigate('/auth?mode=login');
            }}
          >
            Already have an account? Sign In
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Crown className="w-4 h-4 text-accent" />
          <span>No credit card required</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
