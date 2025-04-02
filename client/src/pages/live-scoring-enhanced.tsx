import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Minus, RotateCcw, CheckSquare, X, UserPlus, Award, 
  Target, Zap, RefreshCcw, Check, AlignJustify, CircleDot,
  LineChart, BarChart4, TrendingUp, Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DetailedScoring from "@/components/scoring/detailed-scoring";
import MatchAnalysisDashboard from "@/components/scoring/match-analysis-dashboard";
import WagonWheel from "@/components/scoring/wagon-wheel";
import HeatMap from "@/components/scoring/heat-map";
import PlayerMatchup from "@/components/scoring/player-matchup";
import type { Match as MatchType, Team, User, BallByBall, HeatMapData } from "@/types/schema";

export default function LiveScoringEnhanced() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const matchId = params.matchId ? parseInt(params.matchId) : null;
  
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  
  // Fetch match data
  const { data: match, isLoading: isMatchLoading } = useQuery({
    queryKey: ['/api/matches', matchId],
    enabled: !!matchId,
  });
  
  // Fetch teams data
  const { data: teams, isLoading: isTeamsLoading } = useQuery({
    queryKey: ['/api/matches/teams', matchId],
    enabled: !!matchId,
  });
  
  // Fetch ball-by-ball data
  const { data: ballData, isLoading: isBallDataLoading } = useQuery({
    queryKey: ['/api/matches/balls', matchId],
    enabled: !!matchId,
  });
  
  // Fetch heat map data
  const { data: heatMapData, isLoading: isHeatMapDataLoading } = useQuery({
    queryKey: ['/api/matches/heatmap', matchId],
    enabled: !!matchId,
  });
  
  // Fetch player-vs-player data
  const { data: playerVsPlayerData, isLoading: isPlayerVsPlayerDataLoading } = useQuery({
    queryKey: ['/api/matches/player-matchups', matchId],
    enabled: !!matchId,
  });
  
  // Fetch highlights data
  const { data: highlightsData, isLoading: isHighlightsDataLoading } = useQuery({
    queryKey: ['/api/matches/highlights', matchId],
    enabled: !!matchId,
  });
  
  useEffect(() => {
    const allLoaded = !isMatchLoading && !isTeamsLoading && !isBallDataLoading;
    if (allLoaded) {
      setLoading(false);
    }
  }, [isMatchLoading, isTeamsLoading, isBallDataLoading]);

  // Sample shot data for WagonWheel (until real data is available)
  const sampleShots = [
    { angle: 45, distance: 0.8, runs: 4, type: 'drive', timestamp: new Date() },
    { angle: 120, distance: 0.9, runs: 6, type: 'pull', timestamp: new Date() },
    { angle: 200, distance: 0.6, runs: 2, type: 'cut', timestamp: new Date() },
    { angle: 300, distance: 0.5, runs: 1, type: 'defensive', timestamp: new Date() },
  ];
  
  // Sample player matchup data
  const samplePlayerMatchup = {
    batsmanId: 1,
    bowlerId: 2,
    batsmanName: "Rohit Sharma",
    bowlerName: "Jasprit Bumrah",
    stats: {
      ballsFaced: 15,
      runsScored: 24,
      fours: 3,
      sixes: 1,
      dotBalls: 6,
      dismissals: 0,
      strikeRate: 160,
      controlPercentage: 80,
      boundaryPercentage: 26.7,
      dotBallPercentage: 40,
      dismissalPercentage: 0,
    }
  };

  // Handle scoring completed
  const handleScoringComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/matches', matchId] });
    queryClient.invalidateQueries({ queryKey: ['/api/matches/balls', matchId] });
    toast({
      title: "Scoring Complete",
      description: "Match scoring has been completed successfully.",
    });
    setActiveTab("analysis");
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Loading match data...</h2>
        <p className="text-muted-foreground">Please wait while we fetch the latest information</p>
      </div>
    );
  }
  
  // If no match found
  if (!matchId || (!isMatchLoading && !match)) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Match Not Found</AlertTitle>
          <AlertDescription>
            The match you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
        
        <Button onClick={() => navigate('/matches')}>
          Return to Matches
        </Button>
      </div>
    );
  }
  
  // For demo purposes, use placeholder data if the real data is not available
  const matchData = match || {
    id: matchId || 1,
    title: "Sample Match",
    venue: "Sample Venue",
    matchType: "T20",
    overs: 20,
    team1Score: 0,
    team1Wickets: 0,
    team1Overs: "0.0",
    team2Score: 0,
    team2Wickets: 0,
    team2Overs: "0.0",
    status: "upcoming",
    currentInnings: 1,
  };
  
  const teamsData = teams || {
    team1: {
      id: 1,
      name: "Team A",
      players: Array(11).fill(0).map((_, i) => ({
        id: i + 1,
        username: `Player${i + 1}`,
        fullName: `Player ${i + 1}`,
        avatarUrl: null,
      })),
    },
    team2: {
      id: 2,
      name: "Team B",
      players: Array(11).fill(0).map((_, i) => ({
        id: i + 12,
        username: `Player${i + 12}`,
        fullName: `Player ${i + 12}`,
        avatarUrl: null,
      })),
    },
  };
  
  const ballDataArray = ballData || [];
  const heatMapDataArray = heatMapData || { batting: [], bowling: [] };
  const playerVsPlayerDataArray = playerVsPlayerData || [];
  const highlightsDataArray = highlightsData || [];
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold">{matchData.title}</h1>
            <p className="text-muted-foreground">{matchData.venue} • {matchData.matchType} • {matchData.overs} overs</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <LineChart className="h-4 w-4 mr-2" />
              Stats
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detailed Scoring</TabsTrigger>
            <TabsTrigger value="analysis">Match Analysis</TabsTrigger>
            <TabsTrigger value="matchups">Player Matchups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-4">
            <DetailedScoring 
              matchId={matchId || 1} 
              match={matchData as MatchType} 
              teams={teamsData as {
                team1: Team & { players: User[] };
                team2: Team & { players: User[] };
              }}
              onScoringComplete={handleScoringComplete}
            />
          </TabsContent>
          
          <TabsContent value="analysis" className="pt-4">
            <MatchAnalysisDashboard
              matchId={matchId || 1} 
              match={matchData as MatchType} 
              teams={teamsData as {
                team1: Team & { players: User[] };
                team2: Team & { players: User[] };
              }}
              ballData={ballDataArray as BallByBall[]}
              heatMapData={{
                batting: heatMapDataArray.batting as HeatMapData[],
                bowling: heatMapDataArray.bowling as HeatMapData[],
              }}
              playerVsPlayerData={playerVsPlayerDataArray}
              highlightsData={highlightsDataArray}
            />
          </TabsContent>
          
          <TabsContent value="matchups" className="pt-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shot Distribution</CardTitle>
                  <CardDescription>Visualization of shot placement around the ground</CardDescription>
                </CardHeader>
                <CardContent>
                  <WagonWheel shots={sampleShots} />
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Batting Heat Map</CardTitle>
                    <CardDescription>Scoring zones for batsmen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HeatMap 
                      battingData={{
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
                      }}
                      title="Batting Zones"
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Bowling Heat Map</CardTitle>
                    <CardDescription>Ball landing zones for bowlers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HeatMap 
                      bowlingData={{
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
                      }}
                      title="Bowling Zones"
                    />
                  </CardContent>
                </Card>
              </div>
              
              <PlayerMatchup {...samplePlayerMatchup} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}