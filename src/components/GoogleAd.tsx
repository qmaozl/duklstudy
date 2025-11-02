import { useEffect, useRef } from 'react';

interface GoogleAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
}

export function GoogleAd({ 
  slot, 
  format = 'auto', 
  responsive = true,
  className = ''
}: GoogleAdProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (adRef.current && window.adsbygoogle && !adRef.current.hasChildNodes()) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9200222959060303"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Predefined ad components for different placements
export function BannerAd({ className }: { className?: string }) {
  return (
    <GoogleAd 
      slot="1234567890" // Replace with your actual ad slot ID
      format="horizontal"
      className={className}
    />
  );
}

export function SidebarAd({ className }: { className?: string }) {
  return (
    <GoogleAd 
      slot="1234567891" // Replace with your actual ad slot ID
      format="vertical"
      className={className}
    />
  );
}

export function InArticleAd({ className }: { className?: string }) {
  return (
    <GoogleAd 
      slot="1234567892" // Replace with your actual ad slot ID
      format="fluid"
      className={className}
    />
  );
}
