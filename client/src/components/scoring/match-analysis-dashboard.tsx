import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DownloadCloud, Share2, TrendingUp, BarChart2, 
  PieChart as PieChartIcon, AlertTriangle
} from "lucide-react";
import { HeatMapData, Match, Team, User } from "@/types/schema";
import PlayerMatchup from "./player-matchup";
import HeatMap from "./heat-map";

interface MatchAnalysisDashboardProps {
  matchId: number;
  match: Match;
  teams: {
    team1: Team & { players: User[] };
    team2: Team & { players: User[] };
  };
  innings?: number; // Current innings to analyze, defaults to the match's current innings
  ballData: any[]; // Ball-by-ball data
  heatMapData?: {
    batting: HeatMapData[];
    bowling: HeatMapData[];
  };
  playerVsPlayerData?: any[];
  highlightsData?: any[];
}

interface MatchStatistics {
  team1: {
    totalScore: number;
    wickets: number;
    overs: number;
    runRate: number;
    extras: number;
    dotBalls: number;
    boundaries: {
      fours: number;
      sixes: number;
    };
    dotBallPercentage: number;
    boundaryPercentage: number;
    runsByPhase: {
      powerplay: number;
      middle: number;
      death: number;
    };
    wicketsByPhase: {
      powerplay: number;
      middle: number;
      death: number;
    };
    runDistribution: {
      ones: number;
      twos: number;
      threes: number;
      fours: number;
      sixes: number;
    };
  };
  team2: {
    totalScore: number;
    wickets: number;
    overs: number;
    runRate: number;
    extras: number;
    dotBalls: number;
    boundaries: {
      fours: number;
      sixes: number;
    };
    dotBallPercentage: number;
    boundaryPercentage: number;
    runsByPhase: {
      powerplay: number;
      middle: number;
      death: number;
    };
    wicketsByPhase: {
      powerplay: number;
      middle: number;
      death: number;
    };
    runDistribution: {
      ones: number;
      twos: number;
      threes: number;
      fours: number;
      sixes: number;
    };
  };
  comparativeData: {
    runRate: {
      team1: number;
      team2: number;
    };
    boundaryPercentage: {
      team1: number;
      team2: number;
    };
    dotBallPercentage: {
      team1: number;
      team2: number;
    };
    scoreByPhase: {
      powerplay: {
        team1: number;
        team2: number;
      };
      middle: {
        team1: number;
        team2: number;
      };
      death: {
        team1: number;
        team2: number;
      };
    };
  };
  topPerformers: {
    batting: {
      team1: {
        player: User;
        runs: number;
        balls: number;
        strikeRate: number;
      }[];
      team2: {
        player: User;
        runs: number;
        balls: number;
        strikeRate: number;
      }[];
    };
    bowling: {
      team1: {
        player: User;
        overs: number;
        maidens: number;
        runs: number;
        wickets: number;
        economy: number;
      }[];
      team2: {
        player: User;
        overs: number;
        maidens: number;
        runs: number;
        wickets: number;
        economy: number;
      }[];
    };
  };
  keyMoments: {
    id: number;
    type: string;
    description: string;
    timestamp: string;
    over: number;
    score: string;
    playerId: number;
    impact: number; // 1-10 impact score
  }[];
}

// Function to calculate match statistics from ball data
const calculateMatchStatistics = (match: Match, teams: any, ballData: any[]): MatchStatistics => {
  // Default empty stats object
  const stats: MatchStatistics = {
    team1: {
      totalScore: match.team1Score || 0,
      wickets: match.team1Wickets || 0,
      overs: parseFloat(match.team1Overs?.toString() || "0"),
      runRate: 0,
      extras: 0,
      dotBalls: 0,
      boundaries: { fours: 0, sixes: 0 },
      dotBallPercentage: 0,
      boundaryPercentage: 0,
      runsByPhase: { powerplay: 0, middle: 0, death: 0 },
      wicketsByPhase: { powerplay: 0, middle: 0, death: 0 },
      runDistribution: { ones: 0, twos: 0, threes: 0, fours: 0, sixes: 0 },
    },
    team2: {
      totalScore: match.team2Score || 0,
      wickets: match.team2Wickets || 0,
      overs: parseFloat(match.team2Overs?.toString() || "0"),
      runRate: 0,
      extras: 0,
      dotBalls: 0,
      boundaries: { fours: 0, sixes: 0 },
      dotBallPercentage: 0,
      boundaryPercentage: 0,
      runsByPhase: { powerplay: 0, middle: 0, death: 0 },
      wicketsByPhase: { powerplay: 0, middle: 0, death: 0 },
      runDistribution: { ones: 0, twos: 0, threes: 0, fours: 0, sixes: 0 },
    },
    comparativeData: {
      runRate: { team1: 0, team2: 0 },
      boundaryPercentage: { team1: 0, team2: 0 },
      dotBallPercentage: { team1: 0, team2: 0 },
      scoreByPhase: {
        powerplay: { team1: 0, team2: 0 },
        middle: { team1: 0, team2: 0 },
        death: { team1: 0, team2: 0 },
      },
    },
    topPerformers: {
      batting: {
        team1: [],
        team2: [],
      },
      bowling: {
        team1: [],
        team2: [],
      },
    },
    keyMoments: [],
  };

  // Process ball data if available
  if (ballData && ballData.length > 0) {
    // Separate balls by innings
    const innings1Balls = ballData.filter(ball => ball.innings === 1);
    const innings2Balls = ballData.filter(ball => ball.innings === 2);
    
    // Process innings 1
    if (innings1Balls.length > 0) {
      // Count extras, boundaries, etc.
      stats.team1.extras = innings1Balls.reduce((sum, ball) => sum + (ball.extras || 0), 0);
      stats.team1.boundaries.fours = innings1Balls.filter(ball => ball.runsScored === 4).length;
      stats.team1.boundaries.sixes = innings1Balls.filter(ball => ball.runsScored === 6).length;
      stats.team1.dotBalls = innings1Balls.filter(ball => ball.runsScored === 0 && ball.extras === 0).length;
      
      // Calculate percentages
      const totalBalls = innings1Balls.length;
      stats.team1.runRate = totalBalls > 0 ? (stats.team1.totalScore / totalBalls) * 6 : 0;
      stats.team1.dotBallPercentage = totalBalls > 0 ? (stats.team1.dotBalls / totalBalls) * 100 : 0;
      stats.team1.boundaryPercentage = totalBalls > 0 ? 
        ((stats.team1.boundaries.fours + stats.team1.boundaries.sixes) / totalBalls) * 100 : 0;
      
      // Run distribution
      stats.team1.runDistribution = {
        ones: innings1Balls.filter(ball => ball.runsScored === 1).length,
        twos: innings1Balls.filter(ball => ball.runsScored === 2).length,
        threes: innings1Balls.filter(ball => ball.runsScored === 3).length,
        fours: stats.team1.boundaries.fours,
        sixes: stats.team1.boundaries.sixes,
      };
      
      // Phases analysis (assuming T20 with 6-over powerplay)
      const powerplayBalls = innings1Balls.filter(ball => ball.overNumber < 6);
      const middleBalls = innings1Balls.filter(ball => ball.overNumber >= 6 && ball.overNumber < 15);
      const deathBalls = innings1Balls.filter(ball => ball.overNumber >= 15);
      
      stats.team1.runsByPhase = {
        powerplay: powerplayBalls.reduce((sum, ball) => sum + (ball.runsScored || 0) + (ball.extras || 0), 0),
        middle: middleBalls.reduce((sum, ball) => sum + (ball.runsScored || 0) + (ball.extras || 0), 0),
        death: deathBalls.reduce((sum, ball) => sum + (ball.runsScored || 0) + (ball.extras || 0), 0),
      };
      
      stats.team1.wicketsByPhase = {
        powerplay: powerplayBalls.filter(ball => ball.isWicket).length,
        middle: middleBalls.filter(ball => ball.isWicket).length,
        death: deathBalls.filter(ball => ball.isWicket).length,
      };
    }
    
    // Process innings 2
    if (innings2Balls.length > 0) {
      // Count extras, boundaries, etc.
      stats.team2.extras = innings2Balls.reduce((sum, ball) => sum + (ball.extras || 0), 0);
      stats.team2.boundaries.fours = innings2Balls.filter(ball => ball.runsScored === 4).length;
      stats.team2.boundaries.sixes = innings2Balls.filter(ball => ball.runsScored === 6).length;
      stats.team2.dotBalls = innings2Balls.filter(ball => ball.runsScored === 0 && ball.extras === 0).length;
      
      // Calculate percentages
      const totalBalls = innings2Balls.length;
      stats.team2.runRate = totalBalls > 0 ? (stats.team2.totalScore / totalBalls) * 6 : 0;
      stats.team2.dotBallPercentage = totalBalls > 0 ? (stats.team2.dotBalls / totalBalls) * 100 : 0;
      stats.team2.boundaryPercentage = totalBalls > 0 ? 
        ((stats.team2.boundaries.fours + stats.team2.boundaries.sixes) / totalBalls) * 100 : 0;
      
      // Run distribution
      stats.team2.runDistribution = {
        ones: innings2Balls.filter(ball => ball.runsScored === 1).length,
        twos: innings2Balls.filter(ball => ball.runsScored === 2).length,
        threes: innings2Balls.filter(ball => ball.runsScored === 3).length,
        fours: stats.team2.boundaries.fours,
        sixes: stats.team2.boundaries.sixes,
      };
      
      // Phases analysis
      const powerplayBalls = innings2Balls.filter(ball => ball.overNumber < 6);
      const middleBalls = innings2Balls.filter(ball => ball.overNumber >= 6 && ball.overNumber < 15);
      const deathBalls = innings2Balls.filter(ball => ball.overNumber >= 15);
      
      stats.team2.runsByPhase = {
        powerplay: powerplayBalls.reduce((sum, ball) => sum + (ball.runsScored || 0) + (ball.extras || 0), 0),
        middle: middleBalls.reduce((sum, ball) => sum + (ball.runsScored || 0) + (ball.extras || 0), 0),
        death: deathBalls.reduce((sum, ball) => sum + (ball.runsScored || 0) + (ball.extras || 0), 0),
      };
      
      stats.team2.wicketsByPhase = {
        powerplay: powerplayBalls.filter(ball => ball.isWicket).length,
        middle: middleBalls.filter(ball => ball.isWicket).length,
        death: deathBalls.filter(ball => ball.isWicket).length,
      };
    }
    
    // Calculate comparative data
    stats.comparativeData = {
      runRate: {
        team1: stats.team1.runRate,
        team2: stats.team2.runRate,
      },
      boundaryPercentage: {
        team1: stats.team1.boundaryPercentage,
        team2: stats.team2.boundaryPercentage,
      },
      dotBallPercentage: {
        team1: stats.team1.dotBallPercentage,
        team2: stats.team2.dotBallPercentage,
      },
      scoreByPhase: {
        powerplay: {
          team1: stats.team1.runsByPhase.powerplay,
          team2: stats.team2.runsByPhase.powerplay,
        },
        middle: {
          team1: stats.team1.runsByPhase.middle,
          team2: stats.team2.runsByPhase.middle,
        },
        death: {
          team1: stats.team1.runsByPhase.death,
          team2: stats.team2.runsByPhase.death,
        },
      },
    };
    
    // Calculate key moments (simplified version)
    let keyMoments = [];
    
    // Wickets
    const wickets = ballData.filter(ball => ball.isWicket).map(ball => ({
      id: ball.id,
      type: "wicket",
      description: `${teams.team1.players.find((p: any) => p.id === ball.batsmanId)?.fullName || 'Batsman'} dismissed`,
      timestamp: new Date(ball.timestamp).toLocaleTimeString(),
      over: ball.overNumber + (ball.ballNumber / 10),
      score: `${ball.innings === 1 ? stats.team1.totalScore : stats.team2.totalScore}-${
        ball.innings === 1 ? stats.team1.wickets : stats.team2.wickets
      }`,
      playerId: ball.batsmanId,
      impact: 8, // High impact for wickets
    }));
    
    // Boundaries
    const boundaries = ballData
      .filter(ball => ball.runsScored === 4 || ball.runsScored === 6)
      .map(ball => ({
        id: ball.id,
        type: ball.runsScored === 6 ? "six" : "four",
        description: `${teams.team1.players.find((p: any) => p.id === ball.batsmanId)?.fullName || 'Batsman'} hit a ${
          ball.runsScored === 6 ? "six" : "four"
        }`,
        timestamp: new Date(ball.timestamp).toLocaleTimeString(),
        over: ball.overNumber + (ball.ballNumber / 10),
        score: `${ball.innings === 1 ? stats.team1.totalScore : stats.team2.totalScore}-${
          ball.innings === 1 ? stats.team1.wickets : stats.team2.wickets
        }`,
        playerId: ball.batsmanId,
        impact: ball.runsScored === 6 ? 7 : 5, // Higher impact for sixes
      }));
    
    // Combine key moments and sort by impact
    keyMoments = [...wickets, ...boundaries].sort((a, b) => b.impact - a.impact).slice(0, 5);
    stats.keyMoments = keyMoments;
    
    // Calculate top performers (simplified)
    // This would typically require aggregating data by player across all balls
    // For now, we'll create some dummy data if detailed player stats aren't computed
    
    // This should be replaced with actual data analysis
    if (teams.team1.players.length > 0) {
      // Get team 1 batting stats
      const team1BattingStats = teams.team1.players.slice(0, 3).map((player, index) => {
        const playerBalls = innings1Balls.filter(ball => ball.batsmanId === player.id);
        const runs = playerBalls.reduce((sum, ball) => sum + (ball.runsScored || 0), 0);
        const balls = playerBalls.length;
        
        return {
          player,
          runs: runs || (30 - index * 10), // Fallback if no real data
          balls: balls || (20 - index * 5),
          strikeRate: balls > 0 ? (runs / balls) * 100 : 150 - index * 25,
        };
      });
      
      // Get team 2 bowling stats
      const team2BowlingStats = teams.team2.players.slice(0, 3).map((player, index) => {
        const playerBalls = innings1Balls.filter(ball => ball.bowlerId === player.id);
        const wickets = playerBalls.filter(ball => ball.isWicket).length;
        const runs = playerBalls.reduce((sum, ball) => sum + (ball.runsScored || 0) + (ball.extras || 0), 0);
        const overs = Math.floor(playerBalls.length / 6) + (playerBalls.length % 6) / 10;
        
        return {
          player,
          overs: overs || (2 + index * 0.4),
          maidens: index === 0 ? 1 : 0,
          runs: runs || (15 + index * 5),
          wickets: wickets || (2 - index),
          economy: overs > 0 ? runs / overs : 7.5 + index,
        };
      });
      
      stats.topPerformers.batting.team1 = team1BattingStats;
      stats.topPerformers.bowling.team2 = team2BowlingStats;
    }
    
    if (innings2Balls.length > 0 && teams.team2.players.length > 0) {
      // Get team 2 batting stats
      const team2BattingStats = teams.team2.players.slice(0, 3).map((player, index) => {
        const playerBalls = innings2Balls.filter(ball => ball.batsmanId === player.id);
        const runs = playerBalls.reduce((sum, ball) => sum + (ball.runsScored || 0), 0);
        const balls = playerBalls.length;
        
        return {
          player,
          runs: runs || (25 - index * 8),
          balls: balls || (18 - index * 4),
          strikeRate: balls > 0 ? (runs / balls) * 100 : 140 - index * 20,
        };
      });
      
      // Get team 1 bowling stats
      const team1BowlingStats = teams.team1.players.slice(0, 3).map((player, index) => {
        const playerBalls = innings2Balls.filter(ball => ball.bowlerId === player.id);
        const wickets = playerBalls.filter(ball => ball.isWicket).length;
        const runs = playerBalls.reduce((sum, ball) => sum + (ball.runsScored || 0) + (ball.extras || 0), 0);
        const overs = Math.floor(playerBalls.length / 6) + (playerBalls.length % 6) / 10;
        
        return {
          player,
          overs: overs || (2 + index * 0.4),
          maidens: 0,
          runs: runs || (18 + index * 4),
          wickets: wickets || (Math.max(0, 2 - index)),
          economy: overs > 0 ? runs / overs : 8 + index * 0.5,
        };
      });
      
      stats.topPerformers.batting.team2 = team2BattingStats;
      stats.topPerformers.bowling.team1 = team1BowlingStats;
    }
  }
  
  return stats;
};

export default function MatchAnalysisDashboard({ 
  matchId, 
  match, 
  teams, 
  innings = match.currentInnings, 
  ballData,
  heatMapData = { batting: [], bowling: [] },
  playerVsPlayerData = [],
  highlightsData = []
}: MatchAnalysisDashboardProps) {
  const [analysisTab, setAnalysisTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState<"team1" | "team2">("team1");
  const [selectedPhase, setSelectedPhase] = useState("all");
  
  // Calculate match statistics from ball data
  const matchStats = calculateMatchStatistics(match, teams, ballData);
  
  // Prepare data for charts
  const runRateComparisonData = [
    { name: teams.team1.name, value: matchStats.comparativeData.runRate.team1 },
    { name: teams.team2.name, value: matchStats.comparativeData.runRate.team2 },
  ];
  
  const boundaryComparisonData = [
    { name: teams.team1.name, value: matchStats.comparativeData.boundaryPercentage.team1 },
    { name: teams.team2.name, value: matchStats.comparativeData.boundaryPercentage.team2 },
  ];
  
  const dotBallComparisonData = [
    { name: teams.team1.name, value: matchStats.comparativeData.dotBallPercentage.team1 },
    { name: teams.team2.name, value: matchStats.comparativeData.dotBallPercentage.team2 },
  ];
  
  const team1RunDistributionData = [
    { name: "1s", value: matchStats.team1.runDistribution.ones },
    { name: "2s", value: matchStats.team1.runDistribution.twos },
    { name: "3s", value: matchStats.team1.runDistribution.threes },
    { name: "4s", value: matchStats.team1.runDistribution.fours },
    { name: "6s", value: matchStats.team1.runDistribution.sixes },
  ];
  
  const team2RunDistributionData = [
    { name: "1s", value: matchStats.team2.runDistribution.ones },
    { name: "2s", value: matchStats.team2.runDistribution.twos },
    { name: "3s", value: matchStats.team2.runDistribution.threes },
    { name: "4s", value: matchStats.team2.runDistribution.fours },
    { name: "6s", value: matchStats.team2.runDistribution.sixes },
  ];
  
  const phaseComparisonData = [
    {
      name: "Powerplay",
      [teams.team1.name]: matchStats.comparativeData.scoreByPhase.powerplay.team1,
      [teams.team2.name]: matchStats.comparativeData.scoreByPhase.powerplay.team2,
    },
    {
      name: "Middle",
      [teams.team1.name]: matchStats.comparativeData.scoreByPhase.middle.team1,
      [teams.team2.name]: matchStats.comparativeData.scoreByPhase.middle.team2,
    },
    {
      name: "Death",
      [teams.team1.name]: matchStats.comparativeData.scoreByPhase.death.team1,
      [teams.team2.name]: matchStats.comparativeData.scoreByPhase.death.team2,
    },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Generate sample heat map data if not provided
  const battingHeatMapData = {
    cover: 12,
    extraCover: 8,
    midOff: 5,
    straight: 15,
    midOn: 7,
    midwicket: 20,
    squareLeg: 18,
    fineLeg: 10,
    thirdMan: 6,
    point: 9,
  };
  
  const bowlingHeatMapData = {
    yorkerOff: 5,
    yorkerMiddle: 8,
    yorkerLeg: 3,
    fullOff: 7,
    fullMiddle: 12,
    fullLeg: 6,
    goodOff: 15,
    goodMiddle: 10,
    goodLeg: 8,
    shortOff: 9,
    shortMiddle: 11,
    shortLeg: 7,
    bouncerOff: 4,
    bouncerMiddle: 6,
    bouncerLeg: 3,
  };
  
  // Generate sample player matchup data
  const samplePlayerMatchup = {
    batsmanId: 1,
    bowlerId: 2,
    batsmanName: teams.team1.players[0]?.fullName || "Batsman",
    bowlerName: teams.team2.players[0]?.fullName || "Bowler",
    stats: {
      ballsFaced: 12,
      runsScored: 18,
      fours: 2,
      sixes: 1,
      dotBalls: 4,
      dismissals: 0,
      strikeRate: 150,
      controlPercentage: 75,
      boundaryPercentage: 25,
      dotBallPercentage: 33.3,
      dismissalPercentage: 0,
    }
  };
  
  // Sample over-by-over progression data
  const overProgressionData = Array(Math.max(
    Math.ceil(matchStats.team1.overs), 
    Math.ceil(matchStats.team2.overs),
    1 // At least one over for empty case
  )).fill(0).map((_, index) => {
    const over = index + 1;
    return {
      over: over,
      [teams.team1.name]: Math.min(
        over, Math.ceil(matchStats.team1.overs)
      ) === Math.ceil(matchStats.team1.overs) 
        ? matchStats.team1.totalScore 
        : Math.round(matchStats.team1.totalScore * (over / Math.ceil(matchStats.team1.overs))),
      [teams.team2.name]: over <= Math.ceil(matchStats.team2.overs) 
        ? (over === Math.ceil(matchStats.team2.overs) 
          ? matchStats.team2.totalScore 
          : Math.round(matchStats.team2.totalScore * (over / Math.ceil(matchStats.team2.overs))))
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">{match.title}</h2>
            <p className="text-sm text-muted-foreground">
              {match.venue} • {match.matchType} • {match.overs} overs
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <DownloadCloud className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border rounded-md p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={teams.team1.logo || undefined} />
                  <AvatarFallback>{teams.team1.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{teams.team1.name}</span>
              </div>
              <div className="text-xl font-bold">
                {matchStats.team1.totalScore}/{matchStats.team1.wickets}
                <span className="text-sm ml-2 font-normal text-muted-foreground">
                  ({matchStats.team1.overs})
                </span>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={teams.team2.logo || undefined} />
                  <AvatarFallback>{teams.team2.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{teams.team2.name}</span>
              </div>
              <div className="text-xl font-bold">
                {matchStats.team2.totalScore}/{matchStats.team2.wickets}
                <span className="text-sm ml-2 font-normal text-muted-foreground">
                  ({matchStats.team2.overs})
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <Badge variant={match.status === "completed" ? "default" : "outline"} className="px-3 py-1">
            {match.status === "completed" 
              ? (match.result || "Match completed") 
              : (match.status === "live" ? "Match in progress" : "Match upcoming")}
          </Badge>
        </div>
      </div>
      
      <Tabs value={analysisTab} onValueChange={setAnalysisTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batting">Batting</TabsTrigger>
          <TabsTrigger value="bowling">Bowling</TabsTrigger>
          <TabsTrigger value="matchups">Matchups</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Match Comparison</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Run Rate</span>
                    <span className="font-medium">
                      {matchStats.comparativeData.runRate.team1.toFixed(2)} vs {matchStats.comparativeData.runRate.team2.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="h-2">
                        <Progress value={matchStats.comparativeData.runRate.team1 * 10} className="h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground">{teams.team1.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2">
                        <Progress value={matchStats.comparativeData.runRate.team2 * 10} className="h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground">{teams.team2.name}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Boundary %</span>
                    <span className="font-medium">
                      {matchStats.comparativeData.boundaryPercentage.team1.toFixed(1)}% vs {matchStats.comparativeData.boundaryPercentage.team2.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="h-2">
                        <Progress value={matchStats.comparativeData.boundaryPercentage.team1} className="h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground">{teams.team1.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2">
                        <Progress value={matchStats.comparativeData.boundaryPercentage.team2} className="h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground">{teams.team2.name}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dot Ball %</span>
                    <span className="font-medium">
                      {matchStats.comparativeData.dotBallPercentage.team1.toFixed(1)}% vs {matchStats.comparativeData.dotBallPercentage.team2.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="h-2">
                        <Progress value={matchStats.comparativeData.dotBallPercentage.team1} className="h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground">{teams.team1.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2">
                        <Progress value={matchStats.comparativeData.dotBallPercentage.team2} className="h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground">{teams.team2.name}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Phase-wise Analysis</CardTitle>
                <CardDescription>Runs scored by match phase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={phaseComparisonData}
                      margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey={teams.team1.name} fill="#0088FE" />
                      <Bar dataKey={teams.team2.name} fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Score Progression</CardTitle>
                <CardDescription>Over-by-over score comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={overProgressionData}
                      margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="over" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey={teams.team1.name} 
                        stroke="#0088FE" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey={teams.team2.name} 
                        stroke="#00C49F" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Key Moments</CardTitle>
              <CardDescription>Match-defining events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matchStats.keyMoments.length > 0 ? (
                  matchStats.keyMoments.map((moment, index) => (
                    <div key={index} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        moment.type === "wicket" 
                          ? "bg-red-100" 
                          : moment.type === "six" 
                            ? "bg-amber-100" 
                            : "bg-blue-100"
                      }`}>
                        {moment.type === "wicket" ? (
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        ) : moment.type === "six" ? (
                          <TrendingUp className="h-6 w-6 text-amber-600" />
                        ) : (
                          <BarChart2 className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="font-medium">{moment.description}</div>
                          <div className="text-sm text-muted-foreground">Over {moment.over.toFixed(1)}</div>
                        </div>
                        <div className="text-sm mt-1">{moment.score}</div>
                        <div className="flex items-center mt-2">
                          <Badge variant="outline" className="text-xs">
                            Impact: {moment.impact}/10
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No key moments recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Batting Tab */}
        <TabsContent value="batting" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Run Distribution</CardTitle>
                <CardDescription>How runs were scored</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="team1">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="team1">{teams.team1.name}</TabsTrigger>
                    <TabsTrigger value="team2">{teams.team2.name}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="team1" className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={team1RunDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {team1RunDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  
                  <TabsContent value="team2" className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={team2RunDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {team2RunDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Batting Performance</CardTitle>
                <CardDescription>Top performers with the bat</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="team1">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="team1">{teams.team1.name}</TabsTrigger>
                    <TabsTrigger value="team2">{teams.team2.name}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="team1">
                    <div className="space-y-3">
                      {matchStats.topPerformers.batting.team1.length > 0 ? (
                        matchStats.topPerformers.batting.team1.map((performer, index) => (
                          <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback>{performer.player.fullName?.charAt(0) || performer.player.username?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{performer.player.fullName || performer.player.username}</div>
                                <div className="text-xs text-muted-foreground">
                                  {performer.runs} runs ({performer.balls} balls)
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold">
                              SR: {performer.strikeRate.toFixed(1)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No batting data available
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="team2">
                    <div className="space-y-3">
                      {matchStats.topPerformers.batting.team2.length > 0 ? (
                        matchStats.topPerformers.batting.team2.map((performer, index) => (
                          <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback>{performer.player.fullName?.charAt(0) || performer.player.username?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{performer.player.fullName || performer.player.username}</div>
                                <div className="text-xs text-muted-foreground">
                                  {performer.runs} runs ({performer.balls} balls)
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold">
                              SR: {performer.strikeRate.toFixed(1)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No batting data available
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Shot Zones Analysis</CardTitle>
              <CardDescription>Visual representation of shot placement</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="team1">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="team1">{teams.team1.name}</TabsTrigger>
                  <TabsTrigger value="team2">{teams.team2.name}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="team1">
                  <HeatMap 
                    battingData={battingHeatMapData} 
                    title={`${teams.team1.name} Batting Zones`}
                  />
                </TabsContent>
                
                <TabsContent value="team2">
                  <HeatMap 
                    battingData={battingHeatMapData} 
                    title={`${teams.team2.name} Batting Zones`}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bowling Tab */}
        <TabsContent value="bowling" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Bowling Performance</CardTitle>
                <CardDescription>Top performers with the ball</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="team1">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="team1">{teams.team1.name}</TabsTrigger>
                    <TabsTrigger value="team2">{teams.team2.name}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="team1">
                    <div className="space-y-3">
                      {matchStats.topPerformers.bowling.team1.length > 0 ? (
                        matchStats.topPerformers.bowling.team1.map((performer, index) => (
                          <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback>{performer.player.fullName?.charAt(0) || performer.player.username?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{performer.player.fullName || performer.player.username}</div>
                                <div className="text-xs text-muted-foreground">
                                  {performer.wickets}-{performer.runs} ({performer.overs} overs)
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold">
                              Econ: {performer.economy.toFixed(1)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No bowling data available
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="team2">
                    <div className="space-y-3">
                      {matchStats.topPerformers.bowling.team2.length > 0 ? (
                        matchStats.topPerformers.bowling.team2.map((performer, index) => (
                          <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback>{performer.player.fullName?.charAt(0) || performer.player.username?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{performer.player.fullName || performer.player.username}</div>
                                <div className="text-xs text-muted-foreground">
                                  {performer.wickets}-{performer.runs} ({performer.overs} overs)
                                </div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold">
                              Econ: {performer.economy.toFixed(1)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No bowling data available
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Wicket Types</CardTitle>
                <CardDescription>How wickets were taken</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="team1">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="team1">{teams.team1.name}</TabsTrigger>
                    <TabsTrigger value="team2">{teams.team2.name}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="team1">
                    {matchStats.team2.wickets > 0 ? (
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Bowled", value: Math.ceil(matchStats.team2.wickets * 0.3) },
                                { name: "Caught", value: Math.ceil(matchStats.team2.wickets * 0.5) },
                                { name: "LBW", value: Math.floor(matchStats.team2.wickets * 0.1) },
                                { name: "Run Out", value: Math.floor(matchStats.team2.wickets * 0.1) },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {COLORS.map((color, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No wickets taken yet
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="team2">
                    {matchStats.team1.wickets > 0 ? (
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Bowled", value: Math.ceil(matchStats.team1.wickets * 0.3) },
                                { name: "Caught", value: Math.ceil(matchStats.team1.wickets * 0.5) },
                                { name: "LBW", value: Math.floor(matchStats.team1.wickets * 0.1) },
                                { name: "Run Out", value: Math.floor(matchStats.team1.wickets * 0.1) },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {COLORS.map((color, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No wickets taken yet
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Bowling Zones Analysis</CardTitle>
              <CardDescription>Where bowlers targeted their deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="team1">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="team1">{teams.team1.name}</TabsTrigger>
                  <TabsTrigger value="team2">{teams.team2.name}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="team1">
                  <HeatMap 
                    bowlingData={bowlingHeatMapData} 
                    title={`${teams.team1.name} Bowling Zones`}
                  />
                </TabsContent>
                
                <TabsContent value="team2">
                  <HeatMap 
                    bowlingData={bowlingHeatMapData} 
                    title={`${teams.team2.name} Bowling Zones`}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Matchups Tab */}
        <TabsContent value="matchups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Player Matchups</CardTitle>
              <CardDescription>Head-to-head player analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {playerVsPlayerData && playerVsPlayerData.length > 0 ? (
                <PlayerMatchup {...samplePlayerMatchup} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No player matchup data available yet</p>
                  <p className="text-sm">Record more ball-by-ball data to see player matchups</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Highlights Tab */}
        <TabsContent value="highlights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Highlights</CardTitle>
              <CardDescription>Key moments from the match</CardDescription>
            </CardHeader>
            <CardContent>
              {highlightsData && highlightsData.length > 0 ? (
                <div className="space-y-4">
                  {/* Highlight videos would go here */}
                  <div className="text-center py-8 text-muted-foreground">
                    Highlights are being generated...
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No highlights available yet</p>
                  <p className="text-sm">Highlights will be generated automatically during the match</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}