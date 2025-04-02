import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ShotSelectorProps {
  onShotSelected: (angle: number, distance: number) => void;
}

export default function ShotSelector({ onShotSelected }: ShotSelectorProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate center of the field
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate position relative to center (converts to -1 to 1 range)
    const relX = (x - centerX) / (rect.width / 2);
    const relY = (y - centerY) / (rect.height / 2);
    
    // Calculate angle in radians (0 = right, π/2 = down, π = left, 3π/2 = up)
    const angle = Math.atan2(relY, relX);
    
    // Calculate distance from center (0 to 1)
    const distance = Math.min(1, Math.sqrt(relX * relX + relY * relY));
    
    setSelectedPoint({ x, y });
    
    // Return the angle and distance to parent component
    onShotSelected(angle, distance);
  };
  
  const confirmShot = () => {
    // Reset the selected point
    setSelectedPoint(null);
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center mb-2 font-semibold">Select Shot Direction</div>
        <div className="relative">
          <div 
            className="w-full aspect-square rounded-full border-2 border-blue-500 relative bg-green-100"
            onClick={handleClick}
          >
            {/* Field markings */}
            <div className="absolute inset-1/4 rounded-full border border-gray-300"></div>
            
            {/* Pitch */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-4 bg-yellow-200 border border-gray-400"></div>
            
            {/* Batsman position */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-blue-600"></div>
            
            {/* Directions */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700">Fine Leg</div>
            <div className="absolute top-1/4 left-2 text-xs font-medium text-gray-700">Square Leg</div>
            <div className="absolute bottom-1/4 left-2 text-xs font-medium text-gray-700">Mid Wicket</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700">Mid On</div>
            <div className="absolute bottom-1/4 right-2 text-xs font-medium text-gray-700">Cover</div>
            <div className="absolute top-1/4 right-2 text-xs font-medium text-gray-700">Point</div>
            <div className="absolute top-2 right-1/3 text-xs font-medium text-gray-700">Third Man</div>
            
            {/* Selected point marker */}
            {selectedPoint && (
              <div 
                className="absolute h-5 w-5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white text-xs animate-pulse"
                style={{ 
                  left: selectedPoint.x, 
                  top: selectedPoint.y
                }}
              ></div>
            )}
          </div>
          
          {selectedPoint && (
            <div className="mt-4 flex justify-center">
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={confirmShot}
              >
                Confirm Shot
              </Button>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            Click on the field to select the direction and distance of the shot
          </div>
        </div>
      </CardContent>
    </Card>
  );
}