import { Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t border-border/40 bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Dukl Study. All rights reserved.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => window.open('https://www.instagram.com/dukl.app/', '_blank')}
          >
            <Instagram className="h-5 w-5" />
            <span>Follow us on Instagram</span>
          </Button>
        </div>
      </div>
    </footer>
  );
}
