import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Ready to Start?
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Create an account or sign in to unlock all features and start your study journey.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            size="lg"
            onClick={() => {
              onOpenChange(false);
              navigate("/auth?mode=signup");
            }}
            className="w-full"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Create Account
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              navigate("/auth?mode=login");
            }}
            className="w-full"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
