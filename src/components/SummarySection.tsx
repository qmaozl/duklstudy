import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SummarySectionProps {
  summary: string;
}

const SummarySection: React.FC<SummarySectionProps> = ({ summary }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if summary appears to be truncated (common indicators)
  const isTruncated = 
    summary.length > 1000 || // Longer than 1000 characters
    summary.endsWith('...') || // Ends with ellipsis
    summary.endsWith(' and') || // Ends mid-sentence
    summary.endsWith(' or') ||
    summary.endsWith(' but') ||
    summary.endsWith(' with') ||
    summary.endsWith(' in') ||
    summary.endsWith(' to') ||
    summary.endsWith(' for') ||
    summary.endsWith(' of') ||
    summary.endsWith(' the') ||
    summary.endsWith(' a') ||
    !summary.match(/[.!?]$/) || // Doesn't end with proper punctuation
    (summary.split('.').length > 5 && summary.length > 800); // Many sentences but still long

  // Show truncated version if not expanded
  const displaySummary = !isExpanded && isTruncated 
    ? summary.substring(0, 500) + '...'
    : summary;

  const handleReadMore = () => {
    navigate('/subscription');
  };

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">
        {displaySummary}
      </p>
      
      {isTruncated && !isExpanded && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Summary truncated due to length limits.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={handleReadMore}
            className="h-auto p-0 text-primary underline"
          >
            Read more with Pro →
          </Button>
        </div>
      )}
    </div>
  );
};

export default SummarySection;