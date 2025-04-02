import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface HeatZoneData {
  [key: string]: number; // Zone identifier to activity level mapping
}

interface HeatMapProps {
  battingData?: HeatZoneData;
  bowlingData?: HeatZoneData;
  width?: number;
  height?: number;
  playerId?: number;
  matchId?: number;
  title?: string;
}

export default function HeatMap({ 
  battingData, 
  bowlingData,
  width = 400,
  height = 400,
  playerId,
  matchId,
  title = "Heat Map"
}: HeatMapProps) {
  const [viewType, setViewType] = useState<"batting" | "bowling">(battingData ? "batting" : "bowling");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Helper to get color intensity based on value
  const getColorIntensity = (value: number, max: number) => {
    const normalizedValue = Math.min(value / max, 1);
    return {
      backgroundColor: `rgba(255, 0, 0, ${normalizedValue * 0.7 + 0.1})`,
      opacity: normalizedValue * 0.8 + 0.2,
    };
  };
  
  // Get max value for proper color scaling
  const getMaxValue = (data: HeatZoneData) => {
    return Math.max(...Object.values(data));
  };
  
  // Render batting heat map
  const renderBattingHeatMap = () => {
    if (!battingData || Object.keys(battingData).length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <p>No batting zone data available</p>
          </div>
        </div>
      );
    }
    
    const maxValue = getMaxValue(battingData);
    
    return (
      <div 
        className="relative w-full aspect-square rounded-full bg-green-100 border border-green-300 overflow-hidden"
        style={{
          transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
          transformOrigin: 'center',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* Inner field circle */}
        <div className="absolute inset-[15%] rounded-full bg-green-200 border border-green-300"></div>
        
        {/* Pitch */}
        <div className="absolute top-[calc(50%-10%)] left-[calc(50%-5%)] w-[10%] h-[20%] bg-[#d4b78f] border border-[#c1a47e]"></div>
        
        {/* Boundary labels */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-semibold">Straight</div>
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-semibold">Fine Leg</div>
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-xs font-semibold">Third Man</div>
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-semibold">Mid Wicket</div>
        
        {/* Heat zones */}
        {/* Fine Leg */}
        <div 
          className="absolute bottom-[5%] left-[calc(50%-20%)] w-[40%] h-[30%] rounded-tl-[100%] rounded-tr-[100%]"
          style={getColorIntensity(battingData.fineLeg || 0, maxValue)}
        >
          <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.fineLeg || 0}
          </span>
        </div>
        
        {/* Square Leg */}
        <div 
          className="absolute bottom-[25%] right-[10%] w-[30%] h-[40%] rounded-tl-[100%]"
          style={getColorIntensity(battingData.squareLeg || 0, maxValue)}
        >
          <span className="absolute bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.squareLeg || 0}
          </span>
        </div>
        
        {/* Mid Wicket */}
        <div 
          className="absolute top-[25%] right-[10%] w-[30%] h-[40%] rounded-bl-[100%]"
          style={getColorIntensity(battingData.midwicket || 0, maxValue)}
        >
          <span className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.midwicket || 0}
          </span>
        </div>
        
        {/* Mid On */}
        <div 
          className="absolute top-[5%] right-[calc(50%-20%)] w-[40%] h-[30%] rounded-bl-[100%] rounded-br-[100%]"
          style={getColorIntensity(battingData.midOn || 0, maxValue)}
        >
          <span className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.midOn || 0}
          </span>
        </div>
        
        {/* Straight */}
        <div 
          className="absolute top-[5%] left-[calc(50%-20%)] w-[40%] h-[30%] rounded-bl-[100%] rounded-br-[100%]"
          style={getColorIntensity(battingData.straight || 0, maxValue)}
        >
          <span className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.straight || 0}
          </span>
        </div>
        
        {/* Mid Off */}
        <div 
          className="absolute top-[25%] left-[10%] w-[30%] h-[40%] rounded-br-[100%]"
          style={getColorIntensity(battingData.midOff || 0, maxValue)}
        >
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.midOff || 0}
          </span>
        </div>
        
        {/* Extra Cover */}
        <div 
          className="absolute bottom-[35%] left-[15%] w-[30%] h-[30%] rounded-tr-[100%]"
          style={getColorIntensity(battingData.extraCover || 0, maxValue)}
        >
          <span className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.extraCover || 0}
          </span>
        </div>
        
        {/* Cover */}
        <div 
          className="absolute bottom-[25%] left-[10%] w-[30%] h-[40%] rounded-tr-[100%]"
          style={getColorIntensity(battingData.cover || 0, maxValue)}
        >
          <span className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.cover || 0}
          </span>
        </div>
        
        {/* Point */}
        <div 
          className="absolute bottom-[15%] left-[30%] w-[25%] h-[25%] rounded-tr-[100%]"
          style={getColorIntensity(battingData.point || 0, maxValue)}
        >
          <span className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.point || 0}
          </span>
        </div>
        
        {/* Third Man */}
        <div 
          className="absolute bottom-[5%] left-[10%] w-[30%] h-[30%] rounded-tr-[100%]"
          style={getColorIntensity(battingData.thirdMan || 0, maxValue)}
        >
          <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white drop-shadow-md">
            {battingData.thirdMan || 0}
          </span>
        </div>
      </div>
    );
  };
  
  // Render bowling heat map
  const renderBowlingHeatMap = () => {
    if (!bowlingData || Object.keys(bowlingData).length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <p>No bowling zone data available</p>
          </div>
        </div>
      );
    }
    
    const maxValue = getMaxValue(bowlingData);
    
    return (
      <div 
        className="relative w-full aspect-[2/1] bg-[#d4b78f] border-2 border-[#c1a47e] overflow-hidden"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* Pitch markings */}
        <div className="absolute left-0 top-0 w-full h-full flex flex-col">
          {/* Crease lines */}
          <div className="absolute top-[10%] left-0 w-full h-[1px] bg-white"></div>
          <div className="absolute bottom-[10%] left-0 w-full h-[1px] bg-white"></div>
          
          {/* Middle stump line */}
          <div className="absolute top-[10%] left-1/2 w-[1px] h-[80%] bg-white"></div>
          
          {/* Off and leg side separations */}
          <div className="absolute top-[5%] left-[calc(50%-25%)] text-xs text-white">Off Side</div>
          <div className="absolute top-[5%] left-[calc(50%+15%)] text-xs text-white">Leg Side</div>
        </div>
        
        {/* Heat zones - Good length */}
        <div 
          className="absolute top-[35%] left-[15%] w-[20%] h-[30%]"
          style={getColorIntensity(bowlingData.goodOff || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.goodOff || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[35%] left-[40%] w-[20%] h-[30%]"
          style={getColorIntensity(bowlingData.goodMiddle || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.goodMiddle || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[35%] left-[65%] w-[20%] h-[30%]"
          style={getColorIntensity(bowlingData.goodLeg || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.goodLeg || 0}
          </span>
        </div>
        
        {/* Full length */}
        <div 
          className="absolute top-[15%] left-[15%] w-[20%] h-[20%]"
          style={getColorIntensity(bowlingData.fullOff || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.fullOff || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[15%] left-[40%] w-[20%] h-[20%]"
          style={getColorIntensity(bowlingData.fullMiddle || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.fullMiddle || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[15%] left-[65%] w-[20%] h-[20%]"
          style={getColorIntensity(bowlingData.fullLeg || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.fullLeg || 0}
          </span>
        </div>
        
        {/* Yorker */}
        <div 
          className="absolute top-[10%] left-[15%] w-[20%] h-[5%]"
          style={getColorIntensity(bowlingData.yorkerOff || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.yorkerOff || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[10%] left-[40%] w-[20%] h-[5%]"
          style={getColorIntensity(bowlingData.yorkerMiddle || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.yorkerMiddle || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[10%] left-[65%] w-[20%] h-[5%]"
          style={getColorIntensity(bowlingData.yorkerLeg || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.yorkerLeg || 0}
          </span>
        </div>
        
        {/* Short */}
        <div 
          className="absolute top-[65%] left-[15%] w-[20%] h-[20%]"
          style={getColorIntensity(bowlingData.shortOff || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.shortOff || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[65%] left-[40%] w-[20%] h-[20%]"
          style={getColorIntensity(bowlingData.shortMiddle || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.shortMiddle || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[65%] left-[65%] w-[20%] h-[20%]"
          style={getColorIntensity(bowlingData.shortLeg || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.shortLeg || 0}
          </span>
        </div>
        
        {/* Bouncer */}
        <div 
          className="absolute top-[85%] left-[15%] w-[20%] h-[10%]"
          style={getColorIntensity(bowlingData.bouncerOff || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.bouncerOff || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[85%] left-[40%] w-[20%] h-[10%]"
          style={getColorIntensity(bowlingData.bouncerMiddle || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.bouncerMiddle || 0}
          </span>
        </div>
        
        <div 
          className="absolute top-[85%] left-[65%] w-[20%] h-[10%]"
          style={getColorIntensity(bowlingData.bouncerLeg || 0, maxValue)}
        >
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-md">
            {bowlingData.bouncerLeg || 0}
          </span>
        </div>
        
        {/* Labels */}
        <div className="absolute left-0 top-[10%] h-[5%] bg-white bg-opacity-10 w-full flex items-center pl-2 text-xs">
          Yorker
        </div>
        <div className="absolute left-0 top-[15%] h-[20%] bg-white bg-opacity-10 w-full flex items-center pl-2 text-xs">
          Full
        </div>
        <div className="absolute left-0 top-[35%] h-[30%] bg-white bg-opacity-10 w-full flex items-center pl-2 text-xs">
          Good Length
        </div>
        <div className="absolute left-0 top-[65%] h-[20%] bg-white bg-opacity-10 w-full flex items-center pl-2 text-xs">
          Short
        </div>
        <div className="absolute left-0 top-[85%] h-[10%] bg-white bg-opacity-10 w-full flex items-center pl-2 text-xs">
          Bouncer
        </div>
      </div>
    );
  };
  
  // Control buttons for zoom and rotation
  const renderControls = () => {
    return (
      <div className="flex justify-between mt-4">
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
            onClick={() => setZoomLevel(Math.max(zoomLevel - 0.1, 0.8))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          {viewType === "batting" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setRotation((rotation + 45) % 360)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    );
  };
  
  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="font-medium text-lg">{title}</div>
        
        {battingData && bowlingData && (
          <Tabs 
            value={viewType} 
            onValueChange={(value) => setViewType(value as "batting" | "bowling")}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="batting">Batting</TabsTrigger>
              <TabsTrigger value="bowling">Bowling</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      
      <Select
        value={selectedFilter}
        onValueChange={setSelectedFilter}
      >
        <SelectTrigger className="w-[180px] mb-4">
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Shots</SelectItem>
          <SelectItem value="boundaries">Boundaries Only</SelectItem>
          <SelectItem value="dots">Dot Balls Only</SelectItem>
          <SelectItem value="wickets">Wickets Only</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="p-4 border rounded-md bg-gray-50">
        {viewType === "batting" ? renderBattingHeatMap() : renderBowlingHeatMap()}
      </div>
      
      {renderControls()}
      
      <div className="mt-6 text-sm text-muted-foreground">
        <p>Heat map shows the distribution and frequency of shots or deliveries across different zones.</p>
        <p>Redder areas indicate higher frequency or scoring rates in those zones.</p>
      </div>
    </div>
  );
}