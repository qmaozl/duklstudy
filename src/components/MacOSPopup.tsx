import { X } from 'lucide-react';
import { useEffect } from 'react';

interface MacOSPopupProps {
  onClose: () => void;
  children: React.ReactNode;
}

const MacOSPopup = ({ onClose, children }: MacOSPopupProps) => {
  useEffect(() => {
    // Prevent body scroll when popup is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-[90vw] h-[85vh] bg-background/95 rounded-xl shadow-2xl overflow-hidden border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mac OS Style Title Bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              aria-label="Close"
            />
            <button
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
              aria-label="Minimize"
            />
            <button
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
              aria-label="Maximize"
            />
          </div>
          <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
            DUKL Study
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="w-full h-[calc(100%-52px)] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MacOSPopup;
