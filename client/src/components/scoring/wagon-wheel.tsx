import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ShotData {
  id: string;
  angle: number;
  distance: number;
  runs: number;
  timestamp: Date;
}

interface WagonWheelProps {
  shots: ShotData[];
  width?: number;
  height?: number;
}

export default function WagonWheel({ shots, width = 300, height = 300 }: WagonWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw cricket field (oval shape)
    const centerX = width / 2;
    const centerY = height / 2;
    const fieldRadiusX = width * 0.45;
    const fieldRadiusY = height * 0.45;

    // Draw the boundary
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, fieldRadiusX, fieldRadiusY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#1E88E5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw 30-yard circle
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, fieldRadiusX * 0.6, fieldRadiusY * 0.6, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#1E88E5';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw pitch
    ctx.beginPath();
    ctx.rect(centerX - 10, centerY - 40, 20, 80);
    ctx.fillStyle = '#d3d3d3';
    ctx.fill();
    ctx.strokeStyle = '#1E88E5';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw wickets
    ctx.beginPath();
    ctx.rect(centerX - 6, centerY - 42, 12, 4);
    ctx.rect(centerX - 6, centerY + 38, 12, 4);
    ctx.fillStyle = '#964B00';
    ctx.fill();

    // Draw compass points
    const directions = [
      { label: 'Fine Leg', angle: Math.PI * 0.75 },
      { label: 'Square Leg', angle: Math.PI * 0.5 },
      { label: 'Mid Wicket', angle: Math.PI * 0.35 },
      { label: 'Mid On', angle: Math.PI * 0.2 },
      { label: 'Straight', angle: 0 },
      { label: 'Mid Off', angle: Math.PI * 1.8 },
      { label: 'Cover', angle: Math.PI * 1.65 },
      { label: 'Point', angle: Math.PI * 1.5 },
      { label: 'Third Man', angle: Math.PI * 1.25 },
    ];

    ctx.font = '10px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';

    directions.forEach(dir => {
      const x = centerX + Math.cos(dir.angle) * (fieldRadiusX + 12);
      const y = centerY + Math.sin(dir.angle) * (fieldRadiusY + 12);
      ctx.fillText(dir.label, x, y);
    });

    // Draw shots
    shots.forEach(shot => {
      const distance = Math.min(shot.distance, 1); // 0-1 scale (percentage of max radius)
      const x = centerX + Math.cos(shot.angle) * fieldRadiusX * distance;
      const y = centerY + Math.sin(shot.angle) * fieldRadiusY * distance;
      
      // Draw line from center to shot location
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = getRunColor(shot.runs);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, shot.runs === 4 || shot.runs === 6 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = getRunColor(shot.runs);
      ctx.fill();
      
      // Add run number
      ctx.fillStyle = '#fff';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shot.runs.toString(), x, y);
    });
    
    // Draw legend
    const legendItems = [
      { label: '1-3 runs', color: '#64B5F6' },
      { label: '4 runs', color: '#1E88E5' },
      { label: '6 runs', color: '#F9A825' },
    ];
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '10px Arial';
    
    legendItems.forEach((item, index) => {
      const legendY = height - 40 + (index * 15);
      
      // Draw color box
      ctx.fillStyle = item.color;
      ctx.fillRect(10, legendY - 5, 10, 10);
      
      // Draw label
      ctx.fillStyle = '#333';
      ctx.fillText(item.label, 25, legendY);
    });
    
  }, [shots, width, height]);
  
  // Helper function to get color based on run count
  function getRunColor(runs: number): string {
    if (runs === 6) return '#F9A825'; // Gold for sixes
    if (runs === 4) return '#1E88E5'; // Blue for fours
    return '#64B5F6'; // Light blue for others
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center mb-2 font-semibold">Wagon Wheel</div>
        <div className="flex justify-center">
          <canvas 
            ref={canvasRef} 
            width={width} 
            height={height}
            style={{ 
              maxWidth: '100%',
              borderRadius: '8px',
              background: '#f9f9f9' 
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}