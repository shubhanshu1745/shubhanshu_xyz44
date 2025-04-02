import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CircleSlash2, Flame, Swords, TrendingUp, TrendingDown, Percent, AlertTriangle, ThumbsUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlayerMatchupProps {
  batsmanId: number;
  bowlerId: number;
  matchId?: number;
  batsmanName: string;
  bowlerName: string;
  batsmanAvatar?: string;
  bowlerAvatar?: string;
  stats: {
    ballsFaced: number;
    runsScored: number;
    fours: number;
    sixes: number;
    dotBalls: number;
    dismissals: number;
    strikeRate?: number;
    controlPercentage?: number;
    boundaryPercentage?: number;
    dotBallPercentage?: number;
    dismissalPercentage?: number;
  };
}

export default function PlayerMatchup({
  batsmanName,
  bowlerName,
  batsmanAvatar,
  bowlerAvatar,
  stats
}: PlayerMatchupProps) {
  const [timeFrame, setTimeFrame] = useState("allTime");
  
  // Calculate statistics
  const strikeRate = stats.strikeRate || (stats.ballsFaced > 0 ? (stats.runsScored / stats.ballsFaced) * 100 : 0);
  const controlPercentage = stats.controlPercentage || (stats.ballsFaced > 0 ? ((stats.ballsFaced - stats.dotBalls - stats.fours - stats.sixes) / stats.ballsFaced) * 100 : 0);
  const boundaryPercentage = stats.boundaryPercentage || (stats.ballsFaced > 0 ? ((stats.fours + stats.sixes) / stats.ballsFaced) * 100 : 0);
  const dotBallPercentage = stats.dotBallPercentage || (stats.ballsFaced > 0 ? (stats.dotBalls / stats.ballsFaced) * 100 : 0);
  const dismissalPercentage = stats.dismissalPercentage || (stats.ballsFaced > 0 ? (stats.dismissals / stats.ballsFaced) * 100 : 0);
  
  // Determine advantage
  let advantage = "neutral";
  let advantageText = "Even contest";
  
  if (stats.ballsFaced < 6) {
    advantage = "insufficient";
    advantageText = "Insufficient data";
  } else if (strikeRate > 150 && dismissalPercentage < 10) {
    advantage = "batsman";
    advantageText = "Batsman advantage";
  } else if (dotBallPercentage > 50 && dismissalPercentage > 15) {
    advantage = "bowler";
    advantageText = "Bowler advantage";
  }
  
  const getAdvantageColor = () => {
    switch (advantage) {
      case "batsman": return "text-green-600";
      case "bowler": return "text-blue-600";
      case "insufficient": return "text-orange-500";
      default: return "text-gray-600";
    }
  };
  
  const getAdvantageIcon = () => {
    switch (advantage) {
      case "batsman": return <TrendingUp className="w-4 h-4 text-green-600 mr-1" />;
      case "bowler": return <TrendingDown className="w-4 h-4 text-blue-600 mr-1" />;
      case "insufficient": return <AlertTriangle className="w-4 h-4 text-orange-500 mr-1" />;
      default: return <Swords className="w-4 h-4 text-gray-600 mr-1" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Player Matchup Analysis</CardTitle>
        <CardDescription>Head-to-head statistics between batsman and bowler</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allTime">All Time</SelectItem>
                <SelectItem value="thisMatch">This Match</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
                <SelectItem value="lastFive">Last 5 Encounters</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Badge className={`flex items-center ${getAdvantageColor()}`}>
            {getAdvantageIcon()}
            {advantageText}
          </Badge>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="flex items-center">
            <div className="text-center mr-6">
              <Avatar className="h-16 w-16 mb-2 mx-auto">
                <AvatarImage src={batsmanAvatar} />
                <AvatarFallback>{batsmanName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="font-semibold">{batsmanName}</div>
              <div className="text-sm text-muted-foreground">Batsman</div>
            </div>
            
            <div className="text-center bg-gray-100 rounded-full p-3 flex items-center justify-center h-12 w-12">
              <Swords className="h-6 w-6 text-gray-700" />
            </div>
            
            <div className="text-center ml-6">
              <Avatar className="h-16 w-16 mb-2 mx-auto">
                <AvatarImage src={bowlerAvatar} />
                <AvatarFallback>{bowlerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="font-semibold">{bowlerName}</div>
              <div className="text-sm text-muted-foreground">Bowler</div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Detailed Stats</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balls Faced</span>
                  <span className="font-medium">{stats.ballsFaced}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Runs Scored</span>
                  <span className="font-medium">{stats.runsScored}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dismissals</span>
                  <span className="font-medium">{stats.dismissals}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Strike Rate</span>
                  <span className="font-medium">{strikeRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Boundaries</span>
                  <span className="font-medium">{stats.fours}x4s, {stats.sixes}x6s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dot Balls</span>
                  <span className="font-medium">{stats.dotBalls} ({dotBallPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Scoring Control</span>
                  <span className="text-sm text-muted-foreground">{controlPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={controlPercentage} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Boundary %</span>
                  <span className="text-sm text-muted-foreground">{boundaryPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={boundaryPercentage} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Dot Ball %</span>
                  <span className="text-sm text-muted-foreground">{dotBallPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={dotBallPercentage} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Dismissal Risk</span>
                  <span className="text-sm text-muted-foreground">{dismissalPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={dismissalPercentage} className="h-2" />
              </div>
            </div>
            
            <div className="pt-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {advantage === "batsman" ? (
                    <Flame className="h-5 w-5 text-orange-500 mr-2" />
                  ) : advantage === "bowler" ? (
                    <CircleSlash2 className="h-5 w-5 text-blue-600 mr-2" />
                  ) : advantage === "insufficient" ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  ) : (
                    <ThumbsUp className="h-5 w-5 text-gray-500 mr-2" />
                  )}
                  <span className="font-medium">Match Insight:</span>
                </div>
                <div className="text-sm">
                  {stats.ballsFaced < 6 ? (
                    <span className="text-orange-700">Not enough data for reliable analysis</span>
                  ) : advantage === "batsman" ? (
                    <span className="text-green-700">Favorable matchup for the batsman</span>
                  ) : advantage === "bowler" ? (
                    <span className="text-blue-700">Bowler has the upper hand in this contest</span>
                  ) : (
                    <span className="text-gray-700">Well-balanced contest between both players</span>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Batsman Stats</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <ul className="space-y-2">
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Runs</span>
                      <span className="font-medium">{stats.runsScored}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Strike Rate</span>
                      <span className="font-medium">{strikeRate.toFixed(2)}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Boundaries</span>
                      <span className="font-medium">{stats.fours}x4s, {stats.sixes}x6s</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Boundary %</span>
                      <span className="font-medium">{boundaryPercentage.toFixed(1)}%</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Runs per Over</span>
                      <span className="font-medium">{((stats.runsScored / stats.ballsFaced) * 6).toFixed(2)}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Bowler Stats</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <ul className="space-y-2">
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Wickets</span>
                      <span className="font-medium">{stats.dismissals}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Economy Rate</span>
                      <span className="font-medium">{((stats.runsScored / stats.ballsFaced) * 6).toFixed(2)}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dot Balls</span>
                      <span className="font-medium">{stats.dotBalls} ({dotBallPercentage.toFixed(1)}%)</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Strike Rate</span>
                      <span className="font-medium">{stats.dismissals > 0 ? (stats.ballsFaced / stats.dismissals).toFixed(1) : "-"}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Runs/Wicket</span>
                      <span className="font-medium">{stats.dismissals > 0 ? (stats.runsScored / stats.dismissals).toFixed(1) : "-"}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            {stats.ballsFaced >= 6 && (
              <Card className="mt-4">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">Ball-by-Ball Pattern</CardTitle>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">First 6 balls</div>
                      <div className="flex space-x-1">
                        {Array(6).fill(0).map((_, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            i % 3 === 0 ? "bg-gray-200 text-gray-800" : // Dot ball
                            i % 3 === 1 ? "bg-green-500 text-white" : // Run
                            "bg-blue-500 text-white" // Boundary
                          }`}>
                            {i % 3 === 0 ? "0" : i % 3 === 1 ? "1" : "4"}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {stats.ballsFaced > 12 && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Next 6 balls</div>
                        <div className="flex space-x-1">
                          {Array(6).fill(0).map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                              i % 4 === 0 ? "bg-gray-200 text-gray-800" : // Dot ball 
                              i % 4 === 1 ? "bg-green-500 text-white" : // Run
                              i % 4 === 2 ? "bg-blue-500 text-white" : // Four
                              "bg-amber-500 text-white" // Six
                            }`}>
                              {i % 4 === 0 ? "0" : i % 4 === 1 ? "2" : i % 4 === 2 ? "4" : "6"}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {stats.dismissals > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-red-600">Dismissal pattern:</span> Usually gets out after {Math.floor(stats.ballsFaced / stats.dismissals)} balls
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4 pt-4">
            <div className="text-center text-sm text-muted-foreground pb-4">
              Historical performance data across all encounters
            </div>
            
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Percent className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Trend charts will be available when more</p>
                <p>matchup data is collected</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}