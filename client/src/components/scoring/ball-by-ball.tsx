import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface BallEvent {
  id: string;
  over: number;
  ball: number;
  runs: number;
  isFour: boolean;
  isSix: boolean;
  isWicket: boolean;
  isWide: boolean;
  isNoBall: boolean;
  isLegBye: boolean;
  isBye: boolean;
  batsman: string;
  bowler: string;
  dismissalType?: string;
  playerOut?: string;
  fielder?: string;
  timestamp: Date;
  commentary?: string;
}

interface OverSummary {
  over: number;
  runs: number;
  wickets: number;
  events: BallEvent[];
}

interface BallByBallProps {
  ballEvents: BallEvent[];
  currentInnings: number;
}

export default function BallByBall({ ballEvents, currentInnings }: BallByBallProps) {
  const [activeTab, setActiveTab] = useState("all");
  
  // Group balls by over
  const overs: OverSummary[] = [];
  let currentOver = -1;
  
  // Analyze each ball and build over summaries
  ballEvents.forEach(ball => {
    if (ball.over !== currentOver) {
      currentOver = ball.over;
      overs.push({
        over: ball.over,
        runs: 0,
        wickets: 0,
        events: []
      });
    }
    
    const overIndex = overs.length - 1;
    overs[overIndex].events.push(ball);
    overs[overIndex].runs += ball.runs;
    if (ball.isWicket) {
      overs[overIndex].wickets += 1;
    }
  });
  
  // Filter balls based on active tab
  const filteredBalls = ballEvents.filter(ball => {
    if (activeTab === "all") return true;
    if (activeTab === "boundaries" && (ball.isFour || ball.isSix)) return true;
    if (activeTab === "wickets" && ball.isWicket) return true;
    return false;
  });
  
  // Get ball display value
  const getBallDisplay = (ball: BallEvent) => {
    if (ball.isWicket) return "W";
    if (ball.isWide) return `${ball.runs}W`;
    if (ball.isNoBall) return `${ball.runs}N`;
    if (ball.isLegBye) return `${ball.runs}LB`;
    if (ball.isBye) return `${ball.runs}B`;
    return ball.runs.toString();
  };
  
  // Get ball class name
  const getBallClassName = (ball: BallEvent) => {
    const baseClass = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium";
    if (ball.isWicket) return `${baseClass} bg-red-500 text-white`;
    if (ball.isFour) return `${baseClass} bg-blue-500 text-white`;
    if (ball.isSix) return `${baseClass} bg-amber-500 text-white`;
    if (ball.isWide || ball.isNoBall) return `${baseClass} bg-purple-500 text-white`;
    if (ball.isLegBye || ball.isBye) return `${baseClass} bg-gray-400 text-white`;
    if (ball.runs === 0) return `${baseClass} bg-gray-200 text-gray-800`;
    return `${baseClass} bg-green-500 text-white`;
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          Ball by Ball - Innings {currentInnings}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Balls</TabsTrigger>
            <TabsTrigger value="boundaries">Boundaries</TabsTrigger>
            <TabsTrigger value="wickets">Wickets</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {activeTab === "all" ? (
          <div className="space-y-4">
            {overs.map((over, i) => (
              <div key={i} className="border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">Over {over.over + 1}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50">
                      {over.runs} runs
                    </Badge>
                    {over.wickets > 0 && (
                      <Badge variant="outline" className="bg-red-50">
                        {over.wickets} wicket{over.wickets > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {over.events.map((ball, j) => (
                    <div key={j} className="flex flex-col items-center">
                      <div className={getBallClassName(ball)}>
                        {getBallDisplay(ball)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">{j + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {filteredBalls.map((ball, i) => (
                <div key={i} className="border rounded-md p-3">
                  <div className="flex items-center gap-3">
                    <div className={getBallClassName(ball)}>
                      {getBallDisplay(ball)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {ball.batsman} to {ball.bowler}
                      </div>
                      <div className="text-sm text-gray-500">
                        Over {ball.over + 1}.{ball.ball}
                      </div>
                      {ball.isWicket && (
                        <div className="text-sm text-red-600 font-medium">
                          WICKET: {ball.dismissalType}
                          {ball.fielder && ` (Fielder: ${ball.fielder})`}
                        </div>
                      )}
                      {ball.commentary && (
                        <div className="text-sm mt-1">{ball.commentary}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {filteredBalls.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {activeTab === "boundaries" ? "boundaries" : "wickets"} in this innings yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}