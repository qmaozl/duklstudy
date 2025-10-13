import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MindMapViewProps {
  summary: string;
  keyConcepts: string[];
}

const MindMapView: React.FC<MindMapViewProps> = ({ summary, keyConcepts }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 600;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw central topic
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'hsl(var(--primary-foreground))';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Main Topic', centerX, centerY);

    // Draw branches for key concepts
    const angleStep = (Math.PI * 2) / keyConcepts.length;
    const radius = 200;

    keyConcepts.forEach((concept, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Draw line
      ctx.strokeStyle = 'hsl(var(--secondary))';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw node
      ctx.fillStyle = 'hsl(var(--secondary))';
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw text
      ctx.fillStyle = 'hsl(var(--secondary-foreground))';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Word wrap for long concepts
      const words = concept.split(' ');
      const maxWidth = 70;
      let line = '';
      let lineY = y - 10;
      
      words.forEach((word, i) => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, x, lineY);
          line = word + ' ';
          lineY += 14;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, x, lineY);
    });

  }, [summary, keyConcepts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mind Map Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        {keyConcepts.length > 0 ? (
          <div className="relative w-full">
            <canvas
              ref={canvasRef}
              className="w-full border border-border rounded-lg bg-background"
              style={{ height: '600px' }}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No key concepts available for mind map generation</p>
          </div>
        )}
        
        {keyConcepts.length > 0 && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Key Concepts in this mind map:</p>
            <ul className="list-disc list-inside space-y-1">
              {keyConcepts.map((concept, idx) => (
                <li key={idx} className="text-sm">{concept}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MindMapView;
