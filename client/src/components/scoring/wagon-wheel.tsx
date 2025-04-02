import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut } from "lucide-react";

export interface ShotData {
  id?: string;
  angle: number;
  distance: number;
  runs: number;
  type: string;
  timestamp: Date;
}

interface WagonWheelProps {
  shots: ShotData[];
  width?: number;
  height?: number;
  showControls?: boolean;
  showLegend?: boolean;
  playerId?: number;
  matchId?: number;
}

export default function WagonWheel({ 
  shots, 
  width = 400,
  height = 400,
  showControls = true,
  showLegend = true,
  playerId,
  matchId
}: WagonWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filter, setFilter] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Filter shots based on selection
  const filteredShots = shots.filter(shot => {
    if (filter === "all") return true;
    if (filter === "boundaries") return shot.runs === 4 || shot.runs === 6;
    if (filter === "fours") return shot.runs === 4;
    if (filter === "sixes") return shot.runs === 6;
    if (filter === "singles") return shot.runs === 1;
    if (filter === "twos") return shot.runs === 2;
    if (filter === "threes") return shot.runs === 3;
    if (filter === "dots") return shot.runs === 0;
    return true;
  });
  
  // Get color based on runs
  const getShotColor = (runs: number) => {
    switch (runs) {
      case 0: return "#9CA3AF"; // gray-400
      case 1: return "#34D399"; // emerald-400
      case 2: return "#3B82F6"; // blue-500
      case 3: return "#8B5CF6"; // violet-500
      case 4: return "#F59E0B"; // amber-500
      case 6: return "#EF4444"; // red-500
      default: return "#9CA3AF"; // gray-400
    }
  };
  
  // Draw the wagon wheel
  const drawWagonWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions
    const canvasSize = Math.min(canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = (canvasSize / 2) * 0.9 * zoomLevel;
    
    // Draw cricket field
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#D1FAE5"; // light green
    ctx.fill();
    ctx.strokeStyle = "#059669"; // green-600
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw 30-yard circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = "#059669"; // green-600
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw pitch
    const pitchWidth = radius * 0.1;
    const pitchHeight = radius * 0.4;
    ctx.fillStyle = "#D4B78F"; // pitch color
    ctx.fillRect(centerX - pitchWidth / 2, centerY - pitchHeight / 2, pitchWidth, pitchHeight);
    ctx.strokeStyle = "#C1A47E";
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - pitchWidth / 2, centerY - pitchHeight / 2, pitchWidth, pitchHeight);
    
    // Draw cricket stumps at both ends of pitch
    const drawStumps = (x: number, y: number, width: number, height: number) => {
      const stumpsWidth = width * 0.6;
      const singleStumpWidth = stumpsWidth / 3;
      
      // Draw three stumps
      ctx.fillStyle = "#EEE";
      ctx.fillRect(x - stumpsWidth / 2, y - height / 2, singleStumpWidth, height);
      ctx.fillRect(x - singleStumpWidth / 2, y - height / 2, singleStumpWidth, height);
      ctx.fillRect(x + stumpsWidth / 2 - singleStumpWidth, y - height / 2, singleStumpWidth, height);
    };
    
    // Draw stumps at both ends
    drawStumps(
      centerX, 
      centerY - pitchHeight / 2, 
      pitchWidth, 
      pitchHeight * 0.1
    );
    drawStumps(
      centerX, 
      centerY + pitchHeight / 2, 
      pitchWidth, 
      pitchHeight * 0.1
    );
    
    // Add field labels
    ctx.font = "10px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Label boundary positions
    const boundaryPositions = [
      { angle: 0, label: "Fine Leg" },
      { angle: 45, label: "Square Leg" },
      { angle: 90, label: "Mid Wicket" },
      { angle: 135, label: "Mid On" },
      { angle: 180, label: "Straight" },
      { angle: 225, label: "Mid Off" },
      { angle: 270, label: "Cover" },
      { angle: 315, label: "Point" },
    ];
    
    boundaryPositions.forEach(pos => {
      const x = centerX + radius * Math.cos((pos.angle * Math.PI) / 180);
      const y = centerY + radius * Math.sin((pos.angle * Math.PI) / 180);
      ctx.fillText(pos.label, x, y);
    });
    
    // Draw shots
    filteredShots.forEach(shot => {
      const angleRadians = (shot.angle * Math.PI) / 180;
      const length = radius * shot.distance;
      const endX = centerX + length * Math.cos(angleRadians);
      const endY = centerY + length * Math.sin(angleRadians);
      
      // Draw line for shot
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = getShotColor(shot.runs);
      ctx.lineWidth = shot.runs === 4 || shot.runs === 6 ? 3 : 2;
      ctx.stroke();
      
      // Draw dot at end of shot
      ctx.beginPath();
      ctx.arc(endX, endY, shot.runs === 4 || shot.runs === 6 ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = getShotColor(shot.runs);
      ctx.fill();
    });
  };
  
  // Draw on mount and when shots, filter, or zoom changes
  useEffect(() => {
    drawWagonWheel();
  }, [shots, filter, zoomLevel, width, height]);
  
  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = width;
    canvas.height = height;
    drawWagonWheel();
  }, [width, height]);
  
  // Handle download of wagon wheel image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDownloading(true);
    
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `wagon-wheel${playerId ? `-player-${playerId}` : ''}${matchId ? `-match-${matchId}` : ''}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      {showControls && (
        <div className="flex justify-between w-full mb-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter shots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shots</SelectItem>
              <SelectItem value="boundaries">Boundaries</SelectItem>
              <SelectItem value="fours">4s Only</SelectItem>
              <SelectItem value="sixes">6s Only</SelectItem>
              <SelectItem value="singles">1s Only</SelectItem>
              <SelectItem value="twos">2s Only</SelectItem>
              <SelectItem value="threes">3s Only</SelectItem>
              <SelectItem value="dots">Dot Balls</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setZoomLevel(Math.min(zoomLevel + 0.1, 1.5))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setZoomLevel(Math.max(zoomLevel - 0.1, 0.7))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      )}
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={width} 
          height={height}
          className="border rounded-lg"
        />
        
        {shots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-lg">
            <div className="text-center">
              <p className="text-lg font-medium">No shot data available</p>
              <p className="text-sm text-muted-foreground">Record shots to see the wagon wheel</p>
            </div>
          </div>
        )}
      </div>
      
      {showLegend && shots.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#34D399] mr-2"></div>
            <span>1 run</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6] mr-2"></div>
            <span>2 runs</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#8B5CF6] mr-2"></div>
            <span>3 runs</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B] mr-2"></div>
            <span>4 runs</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#EF4444] mr-2"></div>
            <span>6 runs</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#9CA3AF] mr-2"></div>
            <span>0 runs</span>
          </div>
        </div>
      )}
      
      {filteredShots.length > 0 && (
        <div className="mt-4 text-sm text-center">
          <p>
            <span className="font-medium">
              {filteredShots.reduce((sum, shot) => sum + shot.runs, 0)} runs
            </span>{" "}
            from{" "}
            <span className="font-medium">{filteredShots.length} shots</span>
          </p>
          <p className="text-muted-foreground">
            {filteredShots.filter(s => s.runs === 4).length} fours,{" "}
            {filteredShots.filter(s => s.runs === 6).length} sixes
          </p>
        </div>
      )}
    </div>
  );
}