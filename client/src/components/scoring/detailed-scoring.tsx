import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Minus, RotateCcw, X, Loader2, AlertCircle,
  Check, CheckCircle2, RotateCw, Undo2, Save, SkipForward
} from "lucide-react";
import type { BallByBall, Team, User, Match } from "@/types/schema";
import WagonWheel from "./wagon-wheel";

// Type definition for shot placement
interface ShotPlacement {
  angle: number;
  distance: number;
  runs: number;
  type: string;
  timestamp: Date;
}

interface DetailedScoringProps {
  matchId: number;
  match: Match;
  teams: {
    team1: Team & { players: User[] };
    team2: Team & { players: User[] };
  };
  onScoringComplete?: () => void;
}

export default function DetailedScoring({ 
  matchId, 
  match, 
  teams,
  onScoringComplete 
}: DetailedScoringProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for current ball scoring
  const [innings, setInnings] = useState(match.currentInnings || 1);
  const [currentOver, setCurrentOver] = useState(0);
  const [currentBall, setCurrentBall] = useState(1);
  const [batting, setBatting] = useState<{team: Team, players: User[]}>(() => {
    return innings === 1 ? 
      { team: teams.team1, players: teams.team1.players } : 
      { team: teams.team2, players: teams.team2.players };
  });
  const [bowling, setBowling] = useState<{team: Team, players: User[]}>(() => {
    return innings === 1 ? 
      { team: teams.team2, players: teams.team2.players } : 
      { team: teams.team1, players: teams.team1.players };
  });
  
  // Striker and non-striker state
  const [striker, setStriker] = useState(batting.players[0]?.id);
  const [nonStriker, setNonStriker] = useState(batting.players[1]?.id);
  const [currentBowler, setCurrentBowler] = useState(bowling.players[0]?.id);
  
  // Shot details state
  const [runsScored, setRunsScored] = useState(0);
  const [extras, setExtras] = useState(0);
  const [extrasType, setExtrasType] = useState<string | null>(null);
  const [isWicket, setIsWicket] = useState(false);
  const [dismissalType, setDismissalType] = useState<string | null>(null);
  const [fielderId, setFielderId] = useState<number | null>(null);
  const [shotType, setShotType] = useState<string | null>(null);
  const [shotDirection, setShotDirection] = useState(0);
  const [shotDistance, setShotDistance] = useState(0.5);
  const [ballSpeed, setBallSpeed] = useState<number | null>(null);
  const [ballLength, setBallLength] = useState<string | null>(null);
  const [ballLine, setBallLine] = useState<string | null>(null);
  const [commentary, setCommentary] = useState("");
  
  // UI state
  const [isWicketDialogOpen, setIsWicketDialogOpen] = useState(false);
  const [isShotPlacementOpen, setIsShotPlacementOpen] = useState(false);
  const [isBallAttributesOpen, setIsBallAttributesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shotsData, setShotsData] = useState<ShotPlacement[]>([]);
  
  // Match statistics
  const [matchStats, setMatchStats] = useState({
    batting: {
      score: match.currentInnings === 1 ? match.team1Score : match.team2Score,
      wickets: match.currentInnings === 1 ? match.team1Wickets : match.team2Wickets,
      overs: parseFloat(match.currentInnings === 1 ? match.team1Overs.toString() : match.team2Overs.toString()),
      runRate: 0,
      extras: 0,
      projectedScore: 0,
      boundaryPercentage: 0,
      dotBallPercentage: 0,
      fours: 0,
      sixes: 0,
    },
    bowling: {
      maidens: 0,
      economyRate: 0,
      dotBalls: 0,
      wides: 0,
      noBalls: 0,
      wickets: match.currentInnings === 1 ? match.team1Wickets : match.team2Wickets,
    },
    currentPartnership: {
      runs: 0,
      balls: 0,
    },
    requiredRunRate: 0,
    requiredRuns: 0,
    ballsRemaining: 0,
  });
  
  // Query for ball-by-ball data
  const { data: ballsData, isLoading } = useQuery({
    queryKey: ['/api/matches/balls', matchId],
    enabled: !!matchId,
  });
  
  // Mutation for adding a new ball
  const addBallMutation = useMutation({
    mutationFn: async (ballData: any) => {
      return fetch(`/api/matches/${matchId}/ball`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ballData),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to add ball');
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/matches/balls', matchId] });
      queryClient.invalidateQueries({ queryKey: ['/api/matches', matchId] });
      
      // Reset form for next ball
      resetBallForm();
      advanceToNextBall();
      
      toast({
        title: "Ball recorded",
        description: "The ball has been added to the scorecard.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error recording ball",
        description: error.message || "There was an error recording the ball. Please try again.",
      });
    },
  });
  
  // Mutation for updating innings/match status
  const updateMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      return fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update match');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches', matchId] });
      
      toast({
        title: "Match updated",
        description: "The match status has been updated successfully.",
      });
      
      if (match.currentInnings === 2 && onScoringComplete) {
        onScoringComplete();
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating match",
        description: error.message || "There was an error updating the match. Please try again.",
      });
    },
  });
  
  // Update match statistics based on ball data
  useEffect(() => {
    if (!ballsData || !ballsData.length) return;
    
    const currentInningsBalls = ballsData.filter((ball: BallByBall) => ball.innings === innings);
    if (!currentInningsBalls.length) return;
    
    // Calculate innings statistics
    const totalRuns = currentInningsBalls.reduce((sum: number, ball: BallByBall) => 
      sum + (ball.runsScored || 0) + (ball.extras || 0), 0);
    
    const totalExtras = currentInningsBalls.reduce((sum: number, ball: BallByBall) => 
      sum + (ball.extras || 0), 0);
    
    const totalBalls = currentInningsBalls.length;
    const totalOvers = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
    
    const fours = currentInningsBalls.filter((ball: BallByBall) => ball.runsScored === 4).length;
    const sixes = currentInningsBalls.filter((ball: BallByBall) => ball.runsScored === 6).length;
    
    const dotBalls = currentInningsBalls.filter((ball: BallByBall) => 
      ball.runsScored === 0 && ball.extras === 0 && !ball.isWicket).length;
    
    const wides = currentInningsBalls.filter((ball: BallByBall) => 
      ball.extrasType === 'wide').length;
    
    const noBalls = currentInningsBalls.filter((ball: BallByBall) => 
      ball.extrasType === 'no_ball').length;
    
    const wickets = currentInningsBalls.filter((ball: BallByBall) => 
      ball.isWicket).length;
    
    // Calculate current partnership
    // This is simplified - a real implementation would track batsmen changes
    const strikerBalls = currentInningsBalls.filter((ball: BallByBall) => 
      ball.batsmanId === striker);
    
    const nonStrikerBalls = currentInningsBalls.filter((ball: BallByBall) => 
      ball.batsmanId === nonStriker);
    
    const partnershipRuns = strikerBalls.reduce((sum: number, ball: BallByBall) => 
      sum + (ball.runsScored || 0), 0) + nonStrikerBalls.reduce((sum: number, ball: BallByBall) => 
      sum + (ball.runsScored || 0), 0);
    
    const partnershipBalls = strikerBalls.length + nonStrikerBalls.length;
    
    // Required run rate (for 2nd innings)
    let requiredRuns = 0;
    let requiredRunRate = 0;
    let ballsRemaining = 0;
    
    if (innings === 2 && match.team1Score !== undefined) {
      const target = match.team1Score + 1;
      requiredRuns = target - totalRuns;
      const totalPossibleBalls = match.overs * 6;
      ballsRemaining = totalPossibleBalls - totalBalls;
      requiredRunRate = ballsRemaining > 0 ? (requiredRuns / ballsRemaining) * 6 : 0;
    }
    
    // Update match stats
    setMatchStats({
      batting: {
        score: totalRuns,
        wickets,
        overs: totalOvers,
        runRate: totalBalls > 0 ? (totalRuns / totalBalls) * 6 : 0,
        extras: totalExtras,
        projectedScore: totalBalls > 0 ? Math.round(totalRuns * (match.overs * 6) / totalBalls) : 0,
        boundaryPercentage: totalBalls > 0 ? ((fours + sixes) / totalBalls) * 100 : 0,
        dotBallPercentage: totalBalls > 0 ? (dotBalls / totalBalls) * 100 : 0,
        fours,
        sixes,
      },
      bowling: {
        maidens: 0, // Would need over-by-over analysis
        economyRate: totalBalls > 0 ? (totalRuns / totalBalls) * 6 : 0,
        dotBalls,
        wides,
        noBalls,
        wickets,
      },
      currentPartnership: {
        runs: partnershipRuns,
        balls: partnershipBalls,
      },
      requiredRunRate,
      requiredRuns,
      ballsRemaining,
    });
    
    // Update current over and ball
    if (totalBalls > 0) {
      setCurrentOver(Math.floor(totalBalls / 6));
      setCurrentBall((totalBalls % 6) + 1);
      
      // If we've completed an over, reset ball to 1
      if (totalBalls % 6 === 0) {
        setCurrentBall(1);
      }
    }
    
    // Update wagon wheel data
    const shots = currentInningsBalls
      .filter((ball: BallByBall) => 
        ball.shotDirection !== undefined && 
        ball.shotDistance !== undefined && 
        ball.runsScored !== undefined
      )
      .map((ball: BallByBall) => ({
        angle: ball.shotDirection || 0,
        distance: ball.shotDistance || 0.5,
        runs: ball.runsScored || 0,
        type: ball.shotType || 'other',
        timestamp: new Date(ball.timestamp || Date.now()),
      }));
    
    setShotsData(shots);
    
  }, [ballsData, innings, striker, nonStriker, match.team1Score, match.overs]);
  
  // Reset ball form
  const resetBallForm = () => {
    setRunsScored(0);
    setExtras(0);
    setExtrasType(null);
    setIsWicket(false);
    setDismissalType(null);
    setFielderId(null);
    setShotType(null);
    setShotDirection(0);
    setShotDistance(0.5);
    setBallSpeed(null);
    setBallLength(null);
    setBallLine(null);
    setCommentary("");
  };
  
  // Handle runs scored
  const handleRunsScored = (runs: number) => {
    setRunsScored(runs);
    
    // Auto-set shot type for boundaries
    if (runs === 4) {
      setShotType(shotType || 'drive');
    } else if (runs === 6) {
      setShotType(shotType || 'pull');
    }
    
    // For odd runs, rotate strike
    if (runs % 2 === 1) {
      rotateStrike();
    }
  };
  
  // Handle extras
  const handleExtras = (type: string, amount: number = 1) => {
    setExtras(amount);
    setExtrasType(type);
    
    // For wide and no ball, don't increment ball count
    // but we will handle this when submitting
  };
  
  // Handle wicket
  const handleWicket = () => {
    setIsWicket(true);
    setIsWicketDialogOpen(true);
  };
  
  // Handle shot placement
  const handleShotPlacement = () => {
    setIsShotPlacementOpen(true);
  };
  
  // Handle ball attributes
  const handleBallAttributes = () => {
    setIsBallAttributesOpen(true);
  };
  
  // Rotate strike (swap striker and non-striker)
  const rotateStrike = () => {
    const temp = striker;
    setStriker(nonStriker);
    setNonStriker(temp);
  };
  
  // Advance to next ball
  const advanceToNextBall = () => {
    if (currentBall < 6) {
      setCurrentBall(currentBall + 1);
    } else {
      // End of over
      setCurrentBall(1);
      setCurrentOver(currentOver + 1);
      
      // Rotate strike at end of over
      rotateStrike();
      
      // TODO: Prompt for new bowler
    }
  };
  
  // Change bowler
  const changeBowler = (bowlerId: number) => {
    setCurrentBowler(bowlerId);
  };
  
  // End innings
  const handleEndInnings = () => {
    if (innings === 1) {
      // Update match to start second innings
      updateMatchMutation.mutate({
        currentInnings: 2,
        team1Score: matchStats.batting.score,
        team1Wickets: matchStats.batting.wickets,
        team1Overs: matchStats.batting.overs.toString(),
        status: "live",
      });
      
      // Reset for second innings
      setInnings(2);
      setCurrentOver(0);
      setCurrentBall(1);
      setBatting({ team: teams.team2, players: teams.team2.players });
      setBowling({ team: teams.team1, players: teams.team1.players });
      setStriker(teams.team2.players[0]?.id);
      setNonStriker(teams.team2.players[1]?.id);
      setCurrentBowler(teams.team1.players[0]?.id);
      resetBallForm();
      
    } else {
      // End of match
      const winner = matchStats.batting.score > match.team1Score ? teams.team2.id : teams.team1.id;
      const winMargin = matchStats.batting.score > match.team1Score 
        ? `${10 - matchStats.batting.wickets} wickets` 
        : `${match.team1Score - matchStats.batting.score} runs`;
      
      updateMatchMutation.mutate({
        team2Score: matchStats.batting.score,
        team2Wickets: matchStats.batting.wickets,
        team2Overs: matchStats.batting.overs.toString(),
        status: "completed",
        result: matchStats.batting.score > match.team1Score 
          ? `${teams.team2.name} won by ${winMargin}` 
          : matchStats.batting.score === match.team1Score
            ? "Match tied"
            : `${teams.team1.name} won by ${winMargin}`,
        winner: winner,
      });
    }
  };
  
  // Submit ball
  const handleSubmitBall = () => {
    setIsSubmitting(true);
    
    // Prepare ball data
    const ballData = {
      matchId,
      innings,
      overNumber: currentOver,
      ballNumber: currentBall,
      batsmanId: striker,
      bowlerId: currentBowler,
      runsScored,
      extras,
      extrasType: extrasType || undefined,
      isWicket,
      dismissalType: dismissalType || undefined,
      playerOutId: isWicket ? striker : undefined,
      fielderId: fielderId || undefined,
      commentary,
      shotType: shotType || undefined,
      shotDirection,
      shotDistance,
      ballSpeed: ballSpeed || undefined,
      ballLength: ballLength || undefined,
      ballLine: ballLine || undefined,
    };
    
    // Submit the ball
    addBallMutation.mutate(ballData);
  };
  
  // Handle ball attributes submission
  const handleBallAttributesSubmit = (attributes: any) => {
    setBallSpeed(attributes.speed);
    setBallLength(attributes.length);
    setBallLine(attributes.line);
    setIsBallAttributesOpen(false);
  };
  
  // Handle shot placement submission
  const handleShotPlacementSubmit = (placement: any) => {
    setShotDirection(placement.direction);
    setShotDistance(placement.distance);
    setShotType(placement.type);
    setIsShotPlacementOpen(false);
  };
  
  // Handle wicket submission
  const handleWicketSubmit = (wicketDetails: any) => {
    setDismissalType(wicketDetails.type);
    setFielderId(wicketDetails.fielderId);
    setIsWicketDialogOpen(false);
  };
  
  // Render new batsman selection after wicket
  const renderNewBatsmanSelection = () => {
    if (!isWicket) return null;
    
    const availableBatsmen = batting.players.filter(
      player => player.id !== striker && player.id !== nonStriker
    );
    
    return (
      <div className="mt-4 border rounded-md p-4 bg-red-50">
        <div className="font-semibold mb-2">Select new batsman</div>
        <Select
          onValueChange={(value) => setStriker(parseInt(value))}
          defaultValue={availableBatsmen[0]?.id.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select batsman" />
          </SelectTrigger>
          <SelectContent>
            {availableBatsmen.map((player) => (
              <SelectItem key={player.id} value={player.id.toString()}>
                {player.fullName || player.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  
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
          <Badge variant={innings === 1 ? "outline" : "secondary"}>
            Innings {innings}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border rounded-md p-3">
            <div className="text-sm text-muted-foreground mb-1">Batting</div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={batting.team.logo || undefined} />
                  <AvatarFallback>{batting.team.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{batting.team.name}</span>
              </div>
              <div className="text-xl font-bold">
                {matchStats.batting.score}/{matchStats.batting.wickets}
                <span className="text-sm ml-2 font-normal text-muted-foreground">
                  ({matchStats.batting.overs})
                </span>
              </div>
            </div>
            <div className="text-sm mt-1 flex justify-between">
              <span className="text-muted-foreground">
                RR: {matchStats.batting.runRate.toFixed(2)}
              </span>
              {innings === 2 && (
                <span className={matchStats.requiredRunRate > 12 ? "text-red-600" : "text-muted-foreground"}>
                  Req: {matchStats.requiredRunRate.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          
          <div className="border rounded-md p-3">
            <div className="text-sm text-muted-foreground mb-1">Bowling</div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={bowling.team.logo || undefined} />
                  <AvatarFallback>{bowling.team.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{bowling.team.name}</span>
              </div>
              {innings === 2 && match.team1Score !== undefined && (
                <div>
                  <span className="font-medium">Target: {match.team1Score + 1}</span>
                </div>
              )}
            </div>
            
            <div className="text-sm mt-1 flex justify-between">
              <span className="text-muted-foreground">
                Wickets: {matchStats.bowling.wickets}
              </span>
              <span className="text-muted-foreground">
                Econ: {matchStats.bowling.economyRate.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm">Current Over: {currentOver}.{currentBall-1}</span>
          <span className="text-sm text-muted-foreground">
            {match.overs - currentOver - (currentBall > 1 ? 1 : 0)} overs remaining
          </span>
        </div>
        
        <div className="flex space-x-1 mb-4">
          {Array(6).fill(0).map((_, i) => {
            const hasBall = ballsData && ballsData.find((ball: BallByBall) => 
              ball.innings === innings && 
              ball.overNumber === currentOver && 
              ball.ballNumber === i + 1
            );
            
            const displayValue = hasBall 
              ? hasBall.isWicket 
                ? "W" 
                : hasBall.extrasType 
                  ? `${hasBall.runsScored + hasBall.extras}${hasBall.extrasType === 'wide' ? 'wd' : 'nb'}`
                  : hasBall.runsScored
              : "•";
            
            const bgColor = hasBall
              ? hasBall.isWicket
                ? "bg-red-500 text-white"
                : hasBall.runsScored === 4
                  ? "bg-blue-500 text-white"
                  : hasBall.runsScored === 6
                    ? "bg-amber-500 text-white"
                    : hasBall.runsScored > 0
                      ? "bg-green-500 text-white"
                      : "bg-gray-100"
              : "bg-gray-100";
            
            return (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${bgColor} ${i + 1 === currentBall ? "ring-2 ring-offset-2 ring-black" : ""}`}
              >
                {displayValue}
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">Batsmen</div>
            <div className="space-y-2">
              {striker && batting.players.find(p => p.id === striker) && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">*</Badge>
                    <span>{batting.players.find(p => p.id === striker)?.fullName || batting.players.find(p => p.id === striker)?.username}</span>
                  </div>
                  <div className="text-sm font-medium">
                    0 (0)
                  </div>
                </div>
              )}
              
              {nonStriker && batting.players.find(p => p.id === nonStriker) && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="w-[31px] mr-2"></span>
                    <span>{batting.players.find(p => p.id === nonStriker)?.fullName || batting.players.find(p => p.id === nonStriker)?.username}</span>
                  </div>
                  <div className="text-sm font-medium">
                    0 (0)
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              Partnership: {matchStats.currentPartnership.runs} ({matchStats.currentPartnership.balls} balls)
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-2">Bowler</div>
            {currentBowler && bowling.players.find(p => p.id === currentBowler) && (
              <div className="flex justify-between items-center">
                <div>
                  <span>{bowling.players.find(p => p.id === currentBowler)?.fullName || bowling.players.find(p => p.id === currentBowler)?.username}</span>
                </div>
                <div className="text-sm font-medium">
                  0-0
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => {
                  // Show dialog to change bowler
                }}
              >
                Change Bowler
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="basicScoring" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basicScoring">Basic Scoring</TabsTrigger>
          <TabsTrigger value="detailedScoring">Detailed Scoring</TabsTrigger>
          <TabsTrigger value="matchAnalysis">Match Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basicScoring" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="text-lg font-semibold mb-2">Runs Scored</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[0, 1, 2, 3, 4, 6].map((run) => (
                    <Button
                      key={run}
                      variant={runsScored === run ? "default" : "outline"}
                      className={`h-14 w-14 text-xl font-bold ${
                        run === 4 ? "hover:bg-blue-500 hover:text-white" :
                        run === 6 ? "hover:bg-amber-500 hover:text-white" :
                        ""
                      }`}
                      onClick={() => handleRunsScored(run)}
                    >
                      {run}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-center mb-4">
                    <div className="text-lg font-semibold mb-2">Extras</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        variant={extrasType === "wide" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleExtras("wide")}
                      >
                        Wide
                      </Button>
                      <Button
                        variant={extrasType === "no_ball" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleExtras("no_ball")}
                      >
                        No Ball
                      </Button>
                      <Button
                        variant={extrasType === "bye" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleExtras("bye")}
                      >
                        Bye
                      </Button>
                      <Button
                        variant={extrasType === "leg_bye" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleExtras("leg_bye")}
                      >
                        Leg Bye
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={isWicket ? "destructive" : "outline"}
                      className="flex-1"
                      onClick={handleWicket}
                    >
                      Wicket
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleShotPlacement}
                    >
                      <RotateCw className="mr-2 h-4 w-4" /> Shot Placement
                    </Button>
                  </div>
                  
                  <div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleBallAttributes}
                    >
                      <RotateCw className="mr-2 h-4 w-4" /> Ball Attributes
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="addCommentary">Add Commentary</Label>
                    <Switch
                      id="addCommentary"
                      checked={!!commentary}
                      onCheckedChange={(checked) => {
                        if (!checked) setCommentary("");
                      }}
                    />
                  </div>
                  
                  {!!commentary || commentary === "" ? (
                    <div>
                      <Input
                        placeholder="Enter commentary..."
                        value={commentary}
                        onChange={(e) => setCommentary(e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              
              {renderNewBatsmanSelection()}
              
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={resetBallForm}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => rotateStrike()}
                  >
                    <RotateCw className="mr-2 h-4 w-4" /> Rotate Strike
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={handleSubmitBall}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Record Ball
                  </Button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button
                variant="destructive"
                onClick={handleEndInnings}
              >
                {innings === 1 ? "End Innings" : "End Match"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="detailedScoring" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Scoring</CardTitle>
              <CardDescription>
                Advanced scoring options and detailed ball attributes
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-medium mb-2">Shot Details</div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Shot Type</Label>
                    <Select value={shotType || ""} onValueChange={setShotType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shot type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drive">Drive</SelectItem>
                        <SelectItem value="cut">Cut</SelectItem>
                        <SelectItem value="pull">Pull</SelectItem>
                        <SelectItem value="hook">Hook</SelectItem>
                        <SelectItem value="sweep">Sweep</SelectItem>
                        <SelectItem value="reverse_sweep">Reverse Sweep</SelectItem>
                        <SelectItem value="flick">Flick</SelectItem>
                        <SelectItem value="defensive">Defensive</SelectItem>
                        <SelectItem value="edge">Edge</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Shot Direction (Angle)</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground w-12">0°</span>
                      <Slider
                        value={[shotDirection]}
                        max={360}
                        step={5}
                        onValueChange={values => setShotDirection(values[0])}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">{shotDirection}°</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Shot Distance</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground w-12">In</span>
                      <Slider
                        value={[shotDistance * 100]}
                        max={100}
                        step={5}
                        onValueChange={values => setShotDistance(values[0] / 100)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">Boundary</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-2">Ball Details</div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ball Speed (km/h)</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="number" 
                        placeholder="Speed" 
                        value={ballSpeed || ""}
                        onChange={e => setBallSpeed(parseInt(e.target.value) || null)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ball Length</Label>
                    <Select value={ballLength || ""} onValueChange={setBallLength}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yorker">Yorker</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="good">Good Length</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="bouncer">Bouncer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ball Line</Label>
                    <Select value={ballLine || ""} onValueChange={setBallLine}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select line" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off Side</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="leg">Leg Side</SelectItem>
                        <SelectItem value="wide">Wide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="default"
                className="ml-auto"
                onClick={handleSubmitBall}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Record Ball
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="matchAnalysis" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Match Statistics</CardTitle>
                <CardDescription>
                  Detailed stats for current innings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Batting</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border rounded p-2">
                        <div className="text-xs text-muted-foreground">Run Rate</div>
                        <div className="text-lg font-semibold">{matchStats.batting.runRate.toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-muted-foreground">Projected</div>
                        <div className="text-lg font-semibold">{matchStats.batting.projectedScore}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-muted-foreground">Extras</div>
                        <div className="text-lg font-semibold">{matchStats.batting.extras}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-muted-foreground">Boundaries</div>
                        <div className="text-lg font-semibold">
                          {matchStats.batting.fours}x4s, {matchStats.batting.sixes}x6s
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Bowling</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border rounded p-2">
                        <div className="text-xs text-muted-foreground">Economy</div>
                        <div className="text-lg font-semibold">{matchStats.bowling.economyRate.toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-muted-foreground">Dot Balls</div>
                        <div className="text-lg font-semibold">
                          {matchStats.bowling.dotBalls} ({((matchStats.bowling.dotBalls / (currentOver * 6 + currentBall - 1)) * 100).toFixed(1)}%)
                        </div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-muted-foreground">Extras</div>
                        <div className="text-lg font-semibold">
                          {matchStats.bowling.wides}wd, {matchStats.bowling.noBalls}nb
                        </div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-muted-foreground">Wickets</div>
                        <div className="text-lg font-semibold">{matchStats.bowling.wickets}</div>
                      </div>
                    </div>
                  </div>
                  
                  {innings === 2 && (
                    <div className="border rounded p-3 bg-blue-50">
                      <div className="text-sm font-medium mb-1">Chase Summary</div>
                      <div className="text-2xl font-bold">
                        {matchStats.requiredRuns} needed from {Math.ceil(matchStats.ballsRemaining / 6)} overs
                      </div>
                      <div className="text-sm mt-1">
                        Required RR: <span className={matchStats.requiredRunRate > 12 ? "text-red-600 font-semibold" : "font-semibold"}>
                          {matchStats.requiredRunRate.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Wagon Wheel</CardTitle>
                <CardDescription>
                  Visual representation of shot placement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shotsData.length > 0 ? (
                  <WagonWheel shots={shotsData} />
                ) : (
                  <div className="flex items-center justify-center h-[300px] border rounded-md">
                    <div className="text-center text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No shot data available yet</p>
                      <p className="text-sm">Record shots to see the wagon wheel</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Wicket Dialog */}
      <Dialog open={isWicketDialogOpen} onOpenChange={setIsWicketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wicket Details</DialogTitle>
            <DialogDescription>
              Record how the batsman was dismissed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dismissal Type</Label>
              <Select
                onValueChange={(value) => setDismissalType(value)}
                defaultValue="bowled"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dismissal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bowled">Bowled</SelectItem>
                  <SelectItem value="caught">Caught</SelectItem>
                  <SelectItem value="lbw">LBW</SelectItem>
                  <SelectItem value="run_out">Run Out</SelectItem>
                  <SelectItem value="stumping">Stumping</SelectItem>
                  <SelectItem value="hit_wicket">Hit Wicket</SelectItem>
                  <SelectItem value="retired_hurt">Retired Hurt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(dismissalType === "caught" || dismissalType === "run_out" || dismissalType === "stumping") && (
              <div className="space-y-2">
                <Label>Fielder</Label>
                <Select
                  onValueChange={(value) => setFielderId(parseInt(value))}
                  defaultValue=""
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fielder" />
                  </SelectTrigger>
                  <SelectContent>
                    {bowling.players.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.fullName || player.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWicketDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleWicketSubmit({
                  type: dismissalType,
                  fielderId
                });
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Shot Placement Dialog */}
      <Dialog open={isShotPlacementOpen} onOpenChange={setIsShotPlacementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shot Placement</DialogTitle>
            <DialogDescription>
              Record the direction and distance of the shot
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="aspect-square relative border rounded-full mb-4 bg-gray-50 flex items-center justify-center">
              <div className="h-[80%] w-[80%] rounded-full border border-dashed border-gray-300 absolute"></div>
              <div className="h-[60%] w-[60%] rounded-full border border-dashed border-gray-300 absolute"></div>
              <div className="h-[40%] w-[40%] rounded-full border border-dashed border-gray-300 absolute"></div>
              <div className="h-[20%] w-[20%] rounded-full border border-dashed border-gray-300 absolute"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-2 bg-gray-300"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center rotate-90">
                <div className="h-12 w-2 bg-gray-300"></div>
              </div>
              
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-gray-600">
                Straight
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-xs text-gray-600">
                Fine Leg
              </div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 text-xs text-gray-600">
                Point
              </div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 text-xs text-gray-600">
                Mid Wicket
              </div>
              
              <Button
                className="h-16 w-16 rounded-full text-xs"
                variant="outline"
                onClick={() => {
                  // Ideally this would use canvas interaction for placement
                  // But for simplicity, we'll just record a default
                  handleShotPlacementSubmit({
                    direction: 45,
                    distance: 0.7,
                    type: 'drive'
                  });
                }}
              >
                Tap to<br />place
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shot Type</Label>
                <Select
                  value={shotType || ""}
                  onValueChange={setShotType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shot type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drive">Drive</SelectItem>
                    <SelectItem value="cut">Cut</SelectItem>
                    <SelectItem value="pull">Pull</SelectItem>
                    <SelectItem value="hook">Hook</SelectItem>
                    <SelectItem value="sweep">Sweep</SelectItem>
                    <SelectItem value="reverse_sweep">Reverse Sweep</SelectItem>
                    <SelectItem value="flick">Flick</SelectItem>
                    <SelectItem value="defensive">Defensive</SelectItem>
                    <SelectItem value="edge">Edge</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShotPlacementOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleShotPlacementSubmit({
                  direction: shotDirection,
                  distance: shotDistance,
                  type: shotType
                });
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Ball Attributes Dialog */}
      <Dialog open={isBallAttributesOpen} onOpenChange={setIsBallAttributesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ball Attributes</DialogTitle>
            <DialogDescription>
              Record details about the delivery
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ball Speed (km/h)</Label>
              <Input 
                type="number" 
                placeholder="Speed" 
                value={ballSpeed || ""}
                onChange={e => setBallSpeed(parseInt(e.target.value) || null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ball Length</Label>
              <Select value={ballLength || ""} onValueChange={setBallLength}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yorker">Yorker</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="good">Good Length</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="bouncer">Bouncer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Ball Line</Label>
              <Select value={ballLine || ""} onValueChange={setBallLine}>
                <SelectTrigger>
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off Side</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="leg">Leg Side</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBallAttributesOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleBallAttributesSubmit({
                  speed: ballSpeed,
                  length: ballLength,
                  line: ballLine
                });
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}