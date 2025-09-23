import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface SummarySectionProps {
  summary: string;
}

const SummarySection: React.FC<SummarySectionProps> = ({ summary }) => {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Pro users have no summary limits
  const isPro = subscription?.subscribed && subscription.subscription_tier === 'pro';

  // Check if summary appears to be truncated (common indicators) - only for free users
  const isTruncated = !isPro && (
    summary.length > 1000 ||
    summary.endsWith('...') ||
    summary.endsWith(' and') ||
    summary.endsWith(' or') ||
    summary.endsWith(' but') ||
    summary.endsWith(' with') ||
    summary.endsWith(' in') ||
    summary.endsWith(' to') ||
    summary.endsWith(' for') ||
    summary.endsWith(' of') ||
    summary.endsWith(' the') ||
    summary.endsWith(' a') ||
    !summary.match(/[.!?]$/) ||
    (summary.split('.').length > 5 && summary.length > 800)
  );

  // Show truncated version if not expanded
  const displaySummary = (!isExpanded && isTruncated)
    ? summary.substring(0, 500) + '...'
    : summary;

  const handleReadMore = () => {
    if (!isPro) navigate('/subscription');
    else setIsExpanded(true);
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