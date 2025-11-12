import React from 'react';

interface FeatureShowcaseCardProps {
  icon: React.ReactNode;
  label: string;
  exampleText: string;
  screenshot?: string;
}

export const FeatureShowcaseCard = ({ 
  icon, 
  label, 
  exampleText, 
  screenshot 
}: FeatureShowcaseCardProps) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header with icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-saas-blue flex items-center justify-center text-white shadow-md">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-saas-charcoal">{label}</h3>
      </div>
      
      {/* Example Card */}
      <div className="bg-saas-gray-lighter border border-saas-border rounded-xl p-6 space-y-4 hover-lift">
        <p className="text-saas-gray-medium italic leading-relaxed">{exampleText}</p>
        {screenshot && (
          <div className="rounded-lg overflow-hidden shadow-lg">
            <img 
              src={screenshot} 
              alt={label} 
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
};
