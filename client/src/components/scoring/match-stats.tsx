import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";

interface Player {
  id: number;
  name: string;
  role: string;
  battingStats?: {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
  };
  bowlingStats?: {
    overs: string;
    maidens: number;
    runs: number;
    wickets: number;
    economy: number;
  };
}

interface Team {
  name: string;
  players: Player[];
  score: number;
  wickets: number;
  overs: string;
}

interface Match {
  id: number;
  name: string;
  venue: string;
  date: string;
  overs: number;
  team1: Team;
  team2: Team;
  status: "upcoming" | "live" | "completed";
  currentInnings: 1 | 2;
  tossWinner?: string;
  tossDecision?: "bat" | "field";
  playerOfMatch?: string;
}

interface MatchStatsProps {
  match: Match;
}

export default function MatchStats({ match }: MatchStatsProps) {
  const [activeTab, setActiveTab] = useState("summary");
  
  // Calculate match summary data
  const battingTeam = match.currentInnings === 1 ? match.team1 : match.team2;
  const bowlingTeam = match.currentInnings === 1 ? match.team2 : match.team1;
  
  // Calculate run rate and required run rate
  const totalBalls = match.overs * 6;
  const currentOvers = parseFloat(battingTeam.overs);
  const currentBalls = Math.floor(currentOvers) * 6 + (currentOvers % 1) * 10;
  const runRate = currentBalls > 0 ? (battingTeam.score / currentBalls) * 6 : 0;
  
  let requiredRunRate = 0;
  let requiredRuns = 0;
  let ballsRemaining = 0;
  
  if (match.currentInnings === 2) {
    requiredRuns = match.team1.score + 1 - match.team2.score;
    ballsRemaining = totalBalls - currentBalls;
    requiredRunRate = ballsRemaining > 0 ? (requiredRuns / ballsRemaining) * 6 : 0;
  }
  
  // Generate partnerships data
  const partnerships = [
    { wicket: "1st", runs: 45, balls: 38, players: "Player 1 & Player 2" },
    { wicket: "2nd", runs: 62, balls: 42, players: "Player 2 & Player 3" },
    { wicket: "3rd", runs: 28, balls: 24, players: "Player 3 & Player 5" },
  ];
  
  // Generate wagon wheel data for sample pie chart
  const shotDistribution = [
    { name: "Off side", value: 54, color: "#1E88E5" },
    { name: "On side", value: 37, color: "#F9A825" },
    { name: "Straight", value: 9, color: "#43A047" },
  ];
  
  // Generate over-by-over data for bar chart
  const oversData = Array.from({ length: 10 }, (_, i) => ({
    over: i + 1,
    runs: Math.floor(Math.random() * 15),
    wickets: Math.random() > 0.7 ? 1 : 0,
  }));
  
  // Calculate boundary percentage
  const totalRuns = battingTeam.score;
  const boundaryRuns = (battingTeam.players.reduce((sum, p) => sum + (p.battingStats?.fours || 0), 0) * 4) +
                      (battingTeam.players.reduce((sum, p) => sum + (p.battingStats?.sixes || 0), 0) * 6);
  const boundaryPercentage = totalRuns > 0 ? (boundaryRuns / totalRuns) * 100 : 0;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Match Statistics</span>
          <Badge variant="outline" className={match.status === "live" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
            {match.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="batting">Batting</TabsTrigger>
            <TabsTrigger value="bowling">Bowling</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold mb-1">{battingTeam.name}</div>
                  <div className="text-3xl font-bold mb-2">
                    {battingTeam.score}/{battingTeam.wickets}
                    <span className="text-sm ml-2 text-muted-foreground">({battingTeam.overs} ov)</span>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">RR: </span>
                      <span className="font-medium">{runRate.toFixed(2)}</span>
                    </div>
                    {match.currentInnings === 2 && (
                      <div>
                        <span className="text-muted-foreground">Req: </span>
                        <span className="font-medium">{requiredRuns} runs ({Math.ceil(ballsRemaining/6)} ov)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-lg font-semibold mb-3">Match Progress</div>
                  {match.currentInnings === 2 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{match.team2.name}</span>
                        <span className="text-sm">{requiredRuns > 0 ? `Need ${requiredRuns} runs` : 'WON!'}</span>
                      </div>
                      <Progress value={(match.team2.score / (match.team1.score + 1)) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>{match.team2.score}/{match.team2.wickets}</span>
                        <span>Target: {match.team1.score + 1}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{match.team1.name}</span>
                        <span className="text-sm">{currentOvers}/{match.overs} overs</span>
                      </div>
                      <Progress value={(currentBalls / totalBalls) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>Run Rate: {runRate.toFixed(2)}</span>
                        <span>{match.team1.score}/{match.team1.wickets}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Partnerships</h3>
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-4">
                    {partnerships.map((partnership, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <div>
                            <span className="font-medium">{partnership.wicket} wicket: </span>
                            <span>{partnership.players}</span>
                          </div>
                          <div className="font-bold">
                            {partnership.runs} <span className="text-xs text-muted-foreground">({partnership.balls} balls)</span>
                          </div>
                        </div>
                        <Progress value={(partnership.runs / 100) * 100} className="h-1" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="batting" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-lg font-semibold mb-4">{battingTeam.name} - Batting</div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium text-muted-foreground pb-2">Batter</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">R</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">B</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">4s</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">6s</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {battingTeam.players.slice(0, 7).map((player, i) => (
                        <tr key={i} className="border-b border-b-gray-100">
                          <td className="py-2 font-medium">{player.name}</td>
                          <td className="py-2 text-right">{player.battingStats?.runs || 0}</td>
                          <td className="py-2 text-right">{player.battingStats?.balls || 0}</td>
                          <td className="py-2 text-right">{player.battingStats?.fours || 0}</td>
                          <td className="py-2 text-right">{player.battingStats?.sixes || 0}</td>
                          <td className="py-2 text-right">{player.battingStats?.strikeRate?.toFixed(1) || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-lg font-semibold mb-4">Shot Distribution</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={shotDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {shotDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-lg font-semibold mb-4">Boundary Analysis</div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Boundary %</span>
                        <span>{boundaryPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={boundaryPercentage} className="h-2" />
                    </div>
                    
                    <div className="pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-md">
                          <div className="text-2xl font-bold text-blue-700">
                            {battingTeam.players.reduce((sum, p) => sum + (p.battingStats?.fours || 0), 0)}
                          </div>
                          <div className="text-xs text-blue-600">FOURS</div>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-md">
                          <div className="text-2xl font-bold text-amber-700">
                            {battingTeam.players.reduce((sum, p) => sum + (p.battingStats?.sixes || 0), 0)}
                          </div>
                          <div className="text-xs text-amber-600">SIXES</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="bowling" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-lg font-semibold mb-4">{bowlingTeam.name} - Bowling</div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium text-muted-foreground pb-2">Bowler</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">O</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">M</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">R</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">W</th>
                        <th className="text-right font-medium text-muted-foreground pb-2">Econ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlingTeam.players.filter(p => p.bowlingStats).slice(0, 5).map((player, i) => (
                        <tr key={i} className="border-b border-b-gray-100">
                          <td className="py-2 font-medium">{player.name}</td>
                          <td className="py-2 text-right">{player.bowlingStats?.overs || "0.0"}</td>
                          <td className="py-2 text-right">{player.bowlingStats?.maidens || 0}</td>
                          <td className="py-2 text-right">{player.bowlingStats?.runs || 0}</td>
                          <td className="py-2 text-right">{player.bowlingStats?.wickets || 0}</td>
                          <td className="py-2 text-right">{player.bowlingStats?.economy?.toFixed(1) || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-lg font-semibold mb-4">Over Analysis</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={oversData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="over" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="runs" fill="#1E88E5" name="Runs" />
                      <Bar dataKey="wickets" fill="#E53935" name="Wickets" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-lg font-semibold mb-2">Key Metrics</div>
                  <Separator className="my-2" />
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Run Rate</span>
                      <span className="font-medium">{runRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Boundary %</span>
                      <span className="font-medium">{boundaryPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dot Ball %</span>
                      <span className="font-medium">38.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balls/Wicket</span>
                      <span className="font-medium">
                        {battingTeam.wickets > 0 
                          ? (currentBalls / battingTeam.wickets).toFixed(1) 
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-lg font-semibold mb-2">Projected Score</div>
                  <Separator className="my-2" />
                  {match.currentInnings === 1 && (
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-md bg-gray-50">
                          <div className="text-sm text-muted-foreground">Current</div>
                          <div className="text-lg font-bold">{runRate.toFixed(1)}</div>
                          <div className="text-lg font-semibold">{Math.round(runRate * match.overs)}</div>
                        </div>
                        <div className="text-center p-2 rounded-md bg-blue-50">
                          <div className="text-sm text-muted-foreground">+10%</div>
                          <div className="text-lg font-bold text-blue-700">{(runRate * 1.1).toFixed(1)}</div>
                          <div className="text-lg font-semibold text-blue-700">{Math.round(runRate * match.overs * 1.1)}</div>
                        </div>
                        <div className="text-center p-2 rounded-md bg-green-50">
                          <div className="text-sm text-muted-foreground">+20%</div>
                          <div className="text-lg font-bold text-green-700">{(runRate * 1.2).toFixed(1)}</div>
                          <div className="text-lg font-semibold text-green-700">{Math.round(runRate * match.overs * 1.2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {match.currentInnings === 2 && (
                    <div className="mt-4">
                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-2">Win Probability</div>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-50 text-blue-700">
                                {match.team2.name}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-red-50 text-red-700">
                                {match.team1.name}
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                            <div
                              style={{ width: "65%" }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center font-medium">
                        {requiredRuns > 0 ? (
                          <p>Need {requiredRuns} runs from {Math.ceil(ballsRemaining/6)} overs</p>
                        ) : (
                          <p className="text-green-600">Target achieved!</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-lg font-semibold mb-4">Phase-wise Analysis</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Powerplay (1-6)</div>
                    <div className="text-xl font-bold">42/1</div>
                    <div className="text-xs text-muted-foreground">Run Rate: 7.00</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Middle (7-15)</div>
                    <div className="text-xl font-bold">78/2</div>
                    <div className="text-xs text-muted-foreground">Run Rate: 8.67</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">Death (16-20)</div>
                    <div className="text-xl font-bold">54/3</div>
                    <div className="text-xs text-muted-foreground">Run Rate: 10.80</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}