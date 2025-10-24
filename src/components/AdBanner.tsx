import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AdBannerProps {
  /**
   * Ad slot format:
   * - 'horizontal' (728x90) - Top banners
   * - 'rectangle' (300x250) - Sidebar ads
   * - 'vertical' (160x600) - Tall sidebar
   */
  format?: 'horizontal' | 'rectangle' | 'vertical';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  format = 'horizontal',
  className = ''
}) => {
  const { subscription } = useAuth();
  const navigate = useNavigate();
  const isPro = subscription?.subscription_tier === 'pro';

  // Don't show ads to Pro subscribers
  if (isPro) {
    return null;
  }

  const dimensions = {
    horizontal: { width: 728, height: 90 },
    rectangle: { width: 300, height: 250 },
    vertical: { width: 160, height: 600 }
  };

  const size = dimensions[format];

  useEffect(() => {
    // Initialize Google AdSense ads when component mounts
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <Card className={`overflow-hidden bg-muted/30 ${className}`}>
      {/* Placeholder for Google AdSense */}
      <div 
        className="relative flex items-center justify-center"
        style={{ 
          width: format === 'horizontal' ? '100%' : `${size.width}px`,
          maxWidth: '100%',
          height: `${size.height}px` 
        }}
      >
        {/* AdSense ad unit will be inserted here */}
        <ins 
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-9200222959060303"
          data-ad-slot="auto"
          data-ad-format={format === 'horizontal' ? 'horizontal' : 'rectangle'}
          data-full-width-responsive={format === 'horizontal' ? 'true' : 'false'}
        />
        
        {/* Fallback CTA if ads don't load */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm">
          <Crown className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-foreground">Remove ads with Pro</p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/subscription')}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </Card>
  );
};
