import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import WagonWheel from "@/components/scoring/wagon-wheel";
import HeatMap from "@/components/scoring/heat-map";
import PlayerMatchup from "@/components/scoring/player-matchup";
import PlayerPrediction from "@/components/stats/player-prediction";
import { AreaChart, BarChart, LineChart, PieChart } from "recharts";
import {
  BarChart2,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Filter,
  Info,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  RefreshCcw,
  Share2,
  Trophy,
  Users,
  User,
  Activity,
  TrendingUp,
  Target,
  GitCompare,
  Download,
  Calendar,
  ListFilter
} from "lucide-react";

// Types for match data
interface Player {
  id: number;
  name: string;
  role: string;
  battingStats?: {
    innings: number;
    runs: number;
    average: number;
    strikeRate: number;
    highestScore: number;
    fifties: number;
    hundreds: number;
  };
  bowlingStats?: {
    innings: number;
    wickets: number;
    average: number;
    economy: number;
    bestBowling: string;
    fourPlusWickets: number;
  };
}

interface Match {
  id: number;
  title: string;
  date: string;
  venue: string;
  result: string;
  team1: {
    id: number;
    name: string;
    score: string;
  };
  team2: {
    id: number;
    name: string;
    score: string;
  };
  winnerId: number;
}

interface Team {
  id: number;
  name: string;
  wins: number;
  losses: number;
  nrr: number;
  players: Player[];
}

interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  teams: Team[];
  matches: Match[];
  status: "upcoming" | "live" | "completed";
}

interface BattingLeaderboard {
  mostRuns: {
    player: Player;
    team: Team;
    runs: number;
    matches: number;
    average: number;
    strikeRate: number;
  }[];
  highestScores: {
    player: Player;
    team: Team;
    score: number;
    against: string;
    notOut: boolean;
  }[];
  bestAverages: {
    player: Player;
    team: Team;
    average: number;
    runs: number;
    innings: number;
  }[];
  bestStrikeRates: {
    player: Player;
    team: Team;
    strikeRate: number;
    runs: number;
    innings: number;
  }[];
}

interface BowlingLeaderboard {
  mostWickets: {
    player: Player;
    team: Team;
    wickets: number;
    matches: number;
    average: number;
    economy: number;
  }[];
  bestBowling: {
    player: Player;
    team: Team;
    figures: string;
    against: string;
  }[];
  bestAverages: {
    player: Player;
    team: Team;
    average: number;
    wickets: number;
    innings: number;
  }[];
  bestEconomyRates: {
    player: Player;
    team: Team;
    economy: number;
    overs: number;
    wickets: number;
  }[];
}

interface TeamPerformance {
  teamId: number;
  teamName: string;
  powerplayAvg: number;
  middleOversAvg: number;
  deathOversAvg: number;
  wicketsLostPowerplay: number;
  wicketsLostMiddleOvers: number;
  wicketsLostDeathOvers: number;
  dotBallPercentage: number;
  boundaryPercentage: number;
}

interface PerformanceChart {
  name: string;
  runs?: number;
  wickets?: number;
  economy?: number;
  strikeRate?: number;
  average?: number;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<"last7" | "last30" | "last90" | "allTime">("last30");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [secondaryTeam, setSecondaryTeam] = useState<number | null>(null);
  const [secondaryPlayer, setSecondaryPlayer] = useState<number | null>(null);

  const { data: tournaments } = useQuery({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      return [] as Tournament[];
    }
  });

  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      return [
        { id: 1, name: "Team A", wins: 5, losses: 2 },
        { id: 2, name: "Team B", wins: 4, losses: 3 },
        { id: 3, name: "Team C", wins: 6, losses: 1 },
        { id: 4, name: "Team D", wins: 2, losses: 5 },
      ] as Partial<Team>[];
    }
  });

  const { data: players } = useQuery({
    queryKey: ['/api/players'],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      return [
        { id: 1, name: "Player 1", role: "Batsman" },
        { id: 2, name: "Player 2", role: "Bowler" },
        { id: 3, name: "Player 3", role: "All-rounder" },
        { id: 4, name: "Player 4", role: "Wicket-keeper" },
      ] as Player[];
    }
  });

  const { data: battingStats } = useQuery({
    queryKey: ['/api/stats/batting', selectedTournament, selectedTeam, dateRange],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      return {
        mostRuns: [
          { 
            player: { id: 1, name: "Player 1" }, 
            team: { id: 1, name: "Team A" },
            runs: 320, 
            matches: 7, 
            average: 45.71, 
            strikeRate: 142.85
          },
          { 
            player: { id: 5, name: "Player 5" }, 
            team: { id: 2, name: "Team B" },
            runs: 285, 
            matches: 7, 
            average: 40.71, 
            strikeRate: 151.59
          },
          { 
            player: { id: 9, name: "Player 9" }, 
            team: { id: 3, name: "Team C" },
            runs: 278, 
            matches: 7, 
            average: 39.71, 
            strikeRate: 138.30
          }
        ]
      } as Partial<BattingLeaderboard>;
    }
  });

  const { data: bowlingStats } = useQuery({
    queryKey: ['/api/stats/bowling', selectedTournament, selectedTeam, dateRange],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      return {
        mostWickets: [
          { 
            player: { id: 2, name: "Player 2" }, 
            team: { id: 1, name: "Team A" },
            wickets: 12, 
            matches: 7, 
            average: 18.33, 
            economy: 7.6
          },
          { 
            player: { id: 6, name: "Player 6" }, 
            team: { id: 2, name: "Team B" },
            wickets: 10, 
            matches: 7, 
            average: 21.5, 
            economy: 8.2
          },
          { 
            player: { id: 10, name: "Player 10" }, 
            team: { id: 3, name: "Team C" },
            wickets: 9, 
            matches: 7, 
            average: 20.11, 
            economy: 7.9
          }
        ]
      } as Partial<BowlingLeaderboard>;
    }
  });

  const { data: teamPerformance } = useQuery({
    queryKey: ['/api/stats/team-performance', selectedTeam, dateRange],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      const runRateData = [
        { name: "1-6", team1: 7.8, team2: 8.2 },
        { name: "7-10", team1: 6.5, team2: 7.1 },
        { name: "11-15", team1: 8.2, team2: 7.5 },
        { name: "16-20", team1: 10.5, team2: 9.8 },
      ];
      
      const wicketsData = [
        { name: "1-6", team1: 1.2, team2: 1.5 },
        { name: "7-10", team1: 1.8, team2: 1.3 },
        { name: "11-15", team1: 2.5, team2: 2.1 },
        { name: "16-20", team1: 4.5, team2: 3.8 },
      ];
      
      const boundaryData = [
        { name: "1-6", team1: 7.2, team2: 8.1 },
        { name: "7-10", team1: 4.5, team2: 5.2 },
        { name: "11-15", team1: 6.3, team2: 5.8 },
        { name: "16-20", team1: 8.5, team2: 7.9 },
      ];
      
      return {
        runRateByPhase: runRateData,
        wicketsByPhase: wicketsData,
        boundariesByPhase: boundaryData
      };
    }
  });

  const { data: playerPerformance } = useQuery({
    queryKey: ['/api/stats/player-performance', selectedPlayer, dateRange],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      const battingData = [
        { name: "Match 1", runs: 45, strikeRate: 150 },
        { name: "Match 2", runs: 22, strikeRate: 122 },
        { name: "Match 3", runs: 67, strikeRate: 148 },
        { name: "Match 4", runs: 18, strikeRate: 128 },
        { name: "Match 5", runs: 52, strikeRate: 162 },
        { name: "Match 6", runs: 34, strikeRate: 136 },
        { name: "Match 7", runs: 75, strikeRate: 175 },
      ];
      
      const bowlingData = [
        { name: "Match 1", wickets: 1, economy: 8.5 },
        { name: "Match 2", wickets: 2, economy: 7.2 },
        { name: "Match 3", wickets: 0, economy: 9.0 },
        { name: "Match 4", wickets: 3, economy: 6.8 },
        { name: "Match 5", wickets: 1, economy: 8.0 },
        { name: "Match 6", wickets: 2, economy: 7.5 },
        { name: "Match 7", wickets: 3, economy: 6.5 },
      ];
      
      return {
        battingPerformance: battingData,
        bowlingPerformance: bowlingData
      };
    }
  });

  const getTeamName = (id: number | null) => {
    if (!id || !teams) return "All Teams";
    const team = teams.find(t => t.id === id);
    return team?.name || "Unknown Team";
  };

  const getPlayerName = (id: number | null) => {
    if (!id || !players) return "All Players";
    const player = players.find(p => p.id === id);
    return player?.name || "Unknown Player";
  };

  const renderPerformanceComparison = () => {
    if (!comparisonMode) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Team Comparison
          </CardTitle>
          <CardDescription>
            Comparing {getTeamName(selectedTeam)} vs {getTeamName(secondaryTeam)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="runRate">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="runRate">Run Rate</TabsTrigger>
              <TabsTrigger value="wickets">Wickets</TabsTrigger>
              <TabsTrigger value="boundaries">Boundaries</TabsTrigger>
            </TabsList>
            
            <TabsContent value="runRate" className="h-[300px]">
              {teamPerformance?.runRateByPhase && (
                <BarChart
                  data={teamPerformance.runRateByPhase}
                  width={800}
                  height={300}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorTeam1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTeam2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Legend />
                  <Tooltip />
                  <Bar dataKey="team1" name={getTeamName(selectedTeam)} fill="#8884d8" />
                  <Bar dataKey="team2" name={getTeamName(secondaryTeam)} fill="#82ca9d" />
                </BarChart>
              )}
            </TabsContent>
            
            <TabsContent value="wickets" className="h-[300px]">
              {teamPerformance?.wicketsByPhase && (
                <LineChart
                  data={teamPerformance.wicketsByPhase}
                  width={800}
                  height={300}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Legend />
                  <Tooltip />
                  <Line type="monotone" dataKey="team1" name={getTeamName(selectedTeam)} stroke="#8884d8" />
                  <Line type="monotone" dataKey="team2" name={getTeamName(secondaryTeam)} stroke="#82ca9d" />
                </LineChart>
              )}
            </TabsContent>
            
            <TabsContent value="boundaries" className="h-[300px]">
              {teamPerformance?.boundariesByPhase && (
                <AreaChart
                  data={teamPerformance.boundariesByPhase}
                  width={800}
                  height={300}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorTeam1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTeam2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Legend />
                  <Tooltip />
                  <Area type="monotone" dataKey="team1" name={getTeamName(selectedTeam)} stroke="#8884d8" fillOpacity={1} fill="url(#colorTeam1)" />
                  <Area type="monotone" dataKey="team2" name={getTeamName(secondaryTeam)} stroke="#82ca9d" fillOpacity={1} fill="url(#colorTeam2)" />
                </AreaChart>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Cricket Analytics Dashboard</h1>
        
        <div className="flex flex-wrap gap-2">
          <Select 
            value={dateRange} 
            onValueChange={(value) => setDateRange(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last30">Last 30 days</SelectItem>
              <SelectItem value="last90">Last 90 days</SelectItem>
              <SelectItem value="allTime">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => setComparisonMode(!comparisonMode)}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            {comparisonMode ? "Cancel Comparison" : "Compare Teams"}
          </Button>
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournaments?.length || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Refine analytics data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tournament</Label>
                <Select 
                  value={selectedTournament?.toString() || ""} 
                  onValueChange={(value) => setSelectedTournament(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Tournaments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Tournaments</SelectItem>
                    {tournaments?.map(tournament => (
                      <SelectItem key={tournament.id} value={tournament.id.toString()}>
                        {tournament.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Team</Label>
                <Select 
                  value={selectedTeam?.toString() || ""} 
                  onValueChange={(value) => setSelectedTeam(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Teams</SelectItem>
                    {teams?.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {comparisonMode && (
                <div className="space-y-2">
                  <Label>Compare with</Label>
                  <Select 
                    value={secondaryTeam?.toString() || ""} 
                    onValueChange={(value) => setSecondaryTeam(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map(team => (
                        team.id !== selectedTeam && (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Player</Label>
                <Select 
                  value={selectedPlayer?.toString() || ""} 
                  onValueChange={(value) => setSelectedPlayer(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Players" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Players</SelectItem>
                    {players?.map(player => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {comparisonMode && selectedPlayer && (
                <div className="space-y-2">
                  <Label>Compare with</Label>
                  <Select 
                    value={secondaryPlayer?.toString() || ""} 
                    onValueChange={(value) => setSecondaryPlayer(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players?.map(player => (
                        player.id !== selectedPlayer && (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.name}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Separator />
              
              <Button className="w-full" variant="outline" onClick={() => {
                setSelectedTournament(null);
                setSelectedTeam(null);
                setSelectedPlayer(null);
                setSecondaryTeam(null);
                setSecondaryPlayer(null);
              }}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Batting Leaders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4">
                  {battingStats?.mostRuns?.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 rounded-full size-6 flex items-center justify-center text-xs">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stat.player.name}</div>
                          <div className="text-xs text-muted-foreground">{stat.team.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stat.runs}</div>
                        <div className="text-xs text-muted-foreground">SR: {stat.strikeRate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bowling Leaders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4">
                  {bowlingStats?.mostWickets?.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 rounded-full size-6 flex items-center justify-center text-xs">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium">{stat.player.name}</div>
                          <div className="text-xs text-muted-foreground">{stat.team.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stat.wickets}</div>
                        <div className="text-xs text-muted-foreground">Econ: {stat.economy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-3/4 space-y-6">
          <Tabs defaultValue="team">
            <TabsList className="grid grid-cols-3 w-[400px]">
              <TabsTrigger value="team">
                <Users className="h-4 w-4 mr-2" />
                Team Analysis
              </TabsTrigger>
              <TabsTrigger value="player">
                <User className="h-4 w-4 mr-2" />
                Player Analysis
              </TabsTrigger>
              <TabsTrigger value="predictions">
                <TrendingUp className="h-4 w-4 mr-2" />
                Predictions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Team Performance
                  </CardTitle>
                  <CardDescription>
                    Performance analysis for {getTeamName(selectedTeam)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="runRate">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="runRate">Run Rate</TabsTrigger>
                      <TabsTrigger value="wickets">Wickets</TabsTrigger>
                      <TabsTrigger value="boundaries">Boundaries</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="runRate" className="h-[300px]">
                      {teamPerformance?.runRateByPhase && (
                        <BarChart
                          data={teamPerformance.runRateByPhase}
                          width={800}
                          height={300}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="team1" name="Run Rate" fill="#8884d8" />
                        </BarChart>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="wickets" className="h-[300px]">
                      {teamPerformance?.wicketsByPhase && (
                        <LineChart
                          data={teamPerformance.wicketsByPhase}
                          width={800}
                          height={300}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="team1" name="Wickets" stroke="#8884d8" />
                        </LineChart>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="boundaries" className="h-[300px]">
                      {teamPerformance?.boundariesByPhase && (
                        <AreaChart
                          data={teamPerformance.boundariesByPhase}
                          width={800}
                          height={300}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorTeam1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="team1" name="Boundaries" stroke="#8884d8" fillOpacity={1} fill="url(#colorTeam1)" />
                        </AreaChart>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              {renderPerformanceComparison()}
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Match-ups Analysis
                  </CardTitle>
                  <CardDescription>
                    Player vs Player match-up data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PlayerMatchup />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="player" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Player Performance
                  </CardTitle>
                  <CardDescription>
                    Performance analysis for {getPlayerName(selectedPlayer)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="batting">
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="batting">Batting</TabsTrigger>
                      <TabsTrigger value="bowling">Bowling</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="batting" className="h-[300px]">
                      {playerPerformance?.battingPerformance && (
                        <LineChart
                          data={playerPerformance.battingPerformance}
                          width={800}
                          height={300}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="runs" name="Runs" stroke="#8884d8" />
                          <Line yAxisId="right" type="monotone" dataKey="strikeRate" name="Strike Rate" stroke="#82ca9d" />
                        </LineChart>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="bowling" className="h-[300px]">
                      {playerPerformance?.bowlingPerformance && (
                        <LineChart
                          data={playerPerformance.bowlingPerformance}
                          width={800}
                          height={300}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="wickets" name="Wickets" stroke="#8884d8" />
                          <Line yAxisId="right" type="monotone" dataKey="economy" name="Economy" stroke="#82ca9d" />
                        </LineChart>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shot Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <WagonWheel 
                      data={[
                        { angle: 30, distance: 0.8, runs: 4, isWicket: false },
                        { angle: 60, distance: 0.6, runs: 4, isWicket: false },
                        { angle: 120, distance: 0.9, runs: 6, isWicket: false },
                        { angle: 180, distance: 0.7, runs: 4, isWicket: false },
                        { angle: 240, distance: 0.5, runs: 2, isWicket: false },
                        { angle: 300, distance: 0.6, runs: 2, isWicket: false },
                        { angle: 330, distance: 0.95, runs: 6, isWicket: false },
                      ]} 
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Heat Map</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <HeatMap 
                      playerId={selectedPlayer || 1}
                      isForBatting={true} 
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="predictions" className="space-y-6">
              <PlayerPrediction 
                playerId={selectedPlayer || undefined}
                opponentId={selectedTeam || undefined}
                matchType={selectedTournament ? "T20" : undefined}
                venue={selectedTournament ? "Eden Gardens, Kolkata" : undefined}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}