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
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, Minus, RotateCcw, CheckSquare, X, User, UserPlus, Award, 
  Target, Zap, RefreshCcw, Check, AlignJustify, CircleDot,
  Coins, Users, Gavel, CloudSun, Thermometer
} from "lucide-react";
import CreateMatchDialog from "@/components/scoring/create-match-dialog";
import WagonWheel from "@/components/scoring/wagon-wheel";
import MatchStats from "@/components/scoring/match-stats";
import ShotSelector from "@/components/scoring/shot-selector";
import BallByBall from "@/components/scoring/ball-by-ball";
import TossDialog from "@/components/scoring/toss-dialog";
import TeamOfficialsDialog from "@/components/scoring/team-officials-dialog";
import MatchOfficialsDialog, { MatchOfficials } from "@/components/scoring/match-officials-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Types for scoring
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

interface Player {
  id: number;
  name: string;
  role: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isWicketkeeper?: boolean;
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

interface Match {
  id: number;
  name: string;
  venue: string;
  date: string;
  overs: number;
  team1: {
    id: number;
    name: string;
    players: Player[];
    score: number;
    wickets: number;
    overs: string;
  };
  team2: {
    id: number;
    name: string;
    players: Player[];
    score: number;
    wickets: number;
    overs: string;
  };
  status: "upcoming" | "toss" | "live" | "completed";
  currentInnings: 1 | 2;
  currentBatsmen: [number | null, number | null];
  currentBowler: number | null;
  tossWinner?: number;
  tossDecision?: "bat" | "bowl";
  tossTime?: Date;
  matchStartTime?: Date;
  matchEndTime?: Date;
  balls: BallEvent[];
  officials?: MatchOfficials;
  weatherConditions?: string;
  pitchConditions?: string;
}

// Mock data to start with
const initialMatch: Match = {
  id: 1,
  name: "Friendly Match",
  venue: "Local Ground",
  date: new Date().toISOString().split('T')[0],
  overs: 20,
  team1: {
    id: 1,
    name: "Team A",
    players: [
      { id: 1, name: "Player 1", role: "Batsman" },
      { id: 2, name: "Player 2", role: "All-rounder" },
      { id: 3, name: "Player 3", role: "Bowler" },
      { id: 4, name: "Player 4", role: "Wicket-keeper" },
      { id: 5, name: "Player 5", role: "Batsman" },
      { id: 6, name: "Player 6", role: "All-rounder" },
      { id: 7, name: "Player 7", role: "Bowler" },
      { id: 8, name: "Player 8", role: "Batsman" },
      { id: 9, name: "Player 9", role: "All-rounder" },
      { id: 10, name: "Player 10", role: "Bowler" },
      { id: 11, name: "Player 11", role: "Batsman" },
    ],
    score: 0,
    wickets: 0,
    overs: "0.0"
  },
  team2: {
    id: 2,
    name: "Team B",
    players: [
      { id: 12, name: "Player 12", role: "Batsman" },
      { id: 13, name: "Player 13", role: "All-rounder" },
      { id: 14, name: "Player 14", role: "Bowler" },
      { id: 15, name: "Player 15", role: "Wicket-keeper" },
      { id: 16, name: "Player 16", role: "Batsman" },
      { id: 17, name: "Player 17", role: "All-rounder" },
      { id: 18, name: "Player 18", role: "Bowler" },
      { id: 19, name: "Player 19", role: "Batsman" },
      { id: 20, name: "Player 20", role: "All-rounder" },
      { id: 21, name: "Player 21", role: "Bowler" },
      { id: 22, name: "Player 22", role: "Batsman" },
    ],
    score: 0,
    wickets: 0,
    overs: "0.0"
  },
  status: "upcoming",
  currentInnings: 1,
  currentBatsmen: [null, null],
  currentBowler: null,
  balls: []
};

export default function LiveScoringAdvanced() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const matchId = params.matchId ? parseInt(params.matchId) : null;

  const [match, setMatch] = useState<Match | null>(null);
  const [showSelectPlayers, setShowSelectPlayers] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [isWicketDialogOpen, setIsWicketDialogOpen] = useState(false);
  const [isTossDialogOpen, setIsTossDialogOpen] = useState(false);
  const [isTeamOfficialsDialogOpen, setIsTeamOfficialsDialogOpen] = useState(false);
  const [isMatchOfficialsDialogOpen, setIsMatchOfficialsDialogOpen] = useState(false);
  const [wicketDetails, setWicketDetails] = useState({
    dismissalType: "Bowled",
    fielder: ""
  });
  const [currentRuns, setCurrentRuns] = useState(0);
  const [isExtraRun, setIsExtraRun] = useState(false);
  const [extraType, setExtraType] = useState<"wide" | "noBall" | "legBye" | "bye" | null>(null);

  // Cricket calculation helpers
  const calculateOver = (balls: number): string => {
    const overs = Math.floor(balls / 6);
    const ballsRemaining = balls % 6;
    return `${overs}.${ballsRemaining}`;
  };

  const calculateBattingStats = (player: Player, balls: BallEvent[]): Player => {
    const battingBalls = balls.filter(ball => ball.batsman === player.name);
    const runs = battingBalls.reduce((sum, ball) => sum + ball.runs, 0);
    const ballsFaced = battingBalls.length;
    const fours = battingBalls.filter(ball => ball.isFour).length;
    const sixes = battingBalls.filter(ball => ball.isSix).length;
    const strikeRate = ballsFaced > 0 ? (runs / ballsFaced) * 100 : 0;

    return {
      ...player,
      battingStats: {
        runs,
        balls: ballsFaced,
        fours,
        sixes,
        strikeRate: parseFloat(strikeRate.toFixed(2))
      }
    };
  };

  const calculateBowlingStats = (player: Player, balls: BallEvent[]): Player => {
    const bowlingBalls = balls.filter(ball => ball.bowler === player.name);
    const totalBalls = bowlingBalls.length;
    const overs = calculateOver(totalBalls);
    const runs = bowlingBalls.reduce((sum, ball) => sum + ball.runs, 0);
    const wickets = bowlingBalls.filter(ball => ball.isWicket).length;
    const maidens = 0; // To be calculated with proper over tracking
    const economy = totalBalls > 0 ? (runs / (totalBalls / 6)) : 0;

    return {
      ...player,
      bowlingStats: {
        overs,
        maidens,
        runs,
        wickets,
        economy: parseFloat(economy.toFixed(2))
      }
    };
  };

  const generateCommentary = (
    runs: number, 
    extraType: string | null, 
    batsman: string, 
    bowler: string
  ): string => {
    if (extraType === "wide") return `Wide ball from ${bowler}`;
    if (extraType === "noBall") return `No ball from ${bowler}`;
    if (extraType === "legBye") return `Leg bye, ${runs} runs taken`;
    if (extraType === "bye") return `Bye, ${runs} runs taken`;
    
    if (runs === 0) return `Dot ball from ${bowler} to ${batsman}`;
    if (runs === 4) return `FOUR! ${batsman} hits ${bowler} for a boundary`;
    if (runs === 6) return `SIX! ${batsman} smashes ${bowler} out of the park`;
    
    return `${batsman} takes ${runs} run${runs !== 1 ? 's' : ''} off ${bowler}`;
  };

  const generateWicketCommentary = (
    dismissalType: string,
    batsman: string,
    bowler: string,
    fielder?: string
  ): string => {
    switch(dismissalType) {
      case "Bowled":
        return `OUT! ${batsman} is bowled by ${bowler}`;
      case "Caught":
        return `OUT! ${batsman} is caught by ${fielder || 'the fielder'} off ${bowler}`;
      case "LBW":
        return `OUT! ${batsman} is LBW to ${bowler}`;
      case "Run Out":
        return `OUT! ${batsman} is run out by ${fielder || 'the fielder'}`;
      case "Stumped":
        return `OUT! ${batsman} is stumped by ${fielder || 'the wicket-keeper'} off ${bowler}`;
      default:
        return `OUT! ${batsman} is dismissed`;
    }
  };

  useEffect(() => {
    // Load match data from backend or use sample data
    if (matchId) {
      // Fetch match data from API
      // For now, use the initial match data
      setMatch(initialMatch);
    }
  }, [matchId]);

  // Function to handle the toss
  const handleTossComplete = (winner: number, decision: "bat" | "bowl") => {
    if (!match) return;
    
    const newMatch = { 
      ...match, 
      status: "toss",
      tossWinner: winner,
      tossDecision: decision,
      tossTime: new Date()
    };
    
    setMatch(newMatch);
    
    // Show toast notification with the toss result
    const winningTeam = winner === match.team1.id ? match.team1.name : match.team2.name;
    toast({
      title: "Toss Complete",
      description: `${winningTeam} won the toss and elected to ${decision} first`
    });
    
    // Open team officials dialog after toss
    setIsTeamOfficialsDialogOpen(true);
  };

  // Function to handle team officials selection
  const handleTeamOfficialsComplete = (
    team1Captain: number,
    team1ViceCaptain: number,
    team1Wicketkeeper: number,
    team2Captain: number,
    team2ViceCaptain: number,
    team2Wicketkeeper: number
  ) => {
    if (!match) return;
    
    // Update the players with their roles
    const updatedTeam1Players = match.team1.players.map(player => ({
      ...player,
      isCaptain: player.id === team1Captain,
      isViceCaptain: player.id === team1ViceCaptain,
      isWicketkeeper: player.id === team1Wicketkeeper
    }));
    
    const updatedTeam2Players = match.team2.players.map(player => ({
      ...player,
      isCaptain: player.id === team2Captain,
      isViceCaptain: player.id === team2ViceCaptain,
      isWicketkeeper: player.id === team2Wicketkeeper
    }));
    
    setMatch({
      ...match,
      team1: {
        ...match.team1,
        players: updatedTeam1Players
      },
      team2: {
        ...match.team2,
        players: updatedTeam2Players
      }
    });
    
    // Open match officials dialog after team officials
    setIsMatchOfficialsDialogOpen(true);
  };

  // Function to handle match officials selection
  const handleMatchOfficialsComplete = (officials: MatchOfficials) => {
    if (!match) return;
    
    setMatch({
      ...match,
      officials,
      weatherConditions: officials.weatherConditions,
      pitchConditions: officials.pitchConditions,
      venue: officials.venue || match.venue
    });
    
    // Ask to select players if not already selected
    if (match.currentBatsmen[0] === null || match.currentBatsmen[1] === null || match.currentBowler === null) {
      setShowSelectPlayers(true);
    }
  };

  const startMatch = () => {
    if (!match) return;
    
    if (match.currentBatsmen[0] === null || match.currentBatsmen[1] === null || match.currentBowler === null) {
      toast({
        title: "Cannot start match",
        description: "Please select both batsmen and a bowler to start the match",
        variant: "destructive"
      });
      return;
    }

    setMatch({ 
      ...match, 
      status: "live",
      matchStartTime: new Date()
    });

    toast({
      title: "Match Started",
      description: `${match.team1.name} vs ${match.team2.name} is now live!`
    });
  };

  const selectBatsman = (playerId: number, position: 0 | 1) => {
    if (!match) return;
    
    const newBatsmen = [...match.currentBatsmen] as [number | null, number | null];
    newBatsmen[position] = playerId;
    
    setMatch({
      ...match,
      currentBatsmen: newBatsmen
    });
  };

  const selectBowler = (playerId: number) => {
    if (!match) return;
    
    setMatch({
      ...match,
      currentBowler: playerId
    });
  };

  const recordBall = () => {
    if (!match || match.status !== "live") return;
    if (match.currentBatsmen[0] === null || match.currentBatsmen[1] === null || match.currentBowler === null) {
      toast({
        title: "Cannot record ball",
        description: "Please select both batsmen and a bowler",
        variant: "destructive"
      });
      return;
    }

    // Calculate current over and ball
    const totalBalls = match.balls.filter(b => 
      !b.isWide && !b.isNoBall && 
      (match.currentInnings === 1 ? true : b.over > match.team1.overs.split('.')[0])
    ).length;
    
    const currentOver = Math.floor(totalBalls / 6);
    const currentBall = totalBalls % 6 + 1;
    
    const batting = match.currentInnings === 1 ? match.team1 : match.team2;
    const bowling = match.currentInnings === 1 ? match.team2 : match.team1;
    
    // Find current batsman and bowler
    const batsman = batting.players.find(p => p.id === match.currentBatsmen[0])?.name || "Unknown";
    const bowler = bowling.players.find(p => p.id === match.currentBowler)?.name || "Unknown";
    
    // Create the ball event
    const ballEvent: BallEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      over: currentOver,
      ball: currentBall,
      runs: currentRuns,
      isFour: currentRuns === 4 && !isExtraRun,
      isSix: currentRuns === 6 && !isExtraRun,
      isWicket: false,
      isWide: extraType === "wide",
      isNoBall: extraType === "noBall",
      isLegBye: extraType === "legBye",
      isBye: extraType === "bye",
      batsman,
      bowler,
      timestamp: new Date(),
      commentary: generateCommentary(currentRuns, extraType, batsman, bowler)
    };
    
    // Update the match state
    const newBalls = [...match.balls, ballEvent];
    
    // Calculate new score and overs
    const newScore = batting.score + currentRuns;
    const newOvers = calculateOver(totalBalls + (isLegalDelivery() ? 1 : 0));
    
    const updatedBatting = {
      ...batting,
      score: newScore,
      overs: newOvers
    };
    
    let newMatch = { ...match, balls: newBalls };
    
    if (match.currentInnings === 1) {
      newMatch.team1 = updatedBatting;
    } else {
      newMatch.team2 = updatedBatting;
    }
    
    // Check if over is complete to switch bowlers and batsmen positions
    if (currentBall === 6 && isLegalDelivery()) {
      // Switch strike
      newMatch.currentBatsmen = [match.currentBatsmen[1], match.currentBatsmen[0]];
      
      toast({
        title: "Over Complete",
        description: `End of over ${currentOver + 1}. Please select a new bowler.`
      });
    } else if ((currentRuns % 2 === 1) && isLegalDelivery()) {
      // Switch strike for odd runs
      newMatch.currentBatsmen = [match.currentBatsmen[1], match.currentBatsmen[0]];
    }
    
    // Check if match is complete (reached target or all overs bowled)
    if (match.currentInnings === 2) {
      if (newMatch.team2.score > newMatch.team1.score) {
        newMatch.status = "completed";
        newMatch.matchEndTime = new Date();
        toast({
          title: "Match Complete",
          description: `${newMatch.team2.name} wins by ${10 - newMatch.team2.wickets} wickets!`
        });
      } else if (totalBalls >= match.overs * 6) {
        newMatch.status = "completed";
        newMatch.matchEndTime = new Date();
        const diff = newMatch.team1.score - newMatch.team2.score;
        if (diff > 0) {
          toast({
            title: "Match Complete",
            description: `${newMatch.team1.name} wins by ${diff} runs!`
          });
        } else if (diff < 0) {
          toast({
            title: "Match Complete",
            description: `${newMatch.team2.name} wins by ${Math.abs(diff)} runs!`
          });
        } else {
          toast({
            title: "Match Complete",
            description: "Match tied!"
          });
        }
      }
    } else if (totalBalls >= match.overs * 6 || newMatch.team1.wickets >= 10) {
      // First innings complete
      newMatch.currentInnings = 2;
      newMatch.currentBatsmen = [null, null];
      newMatch.currentBowler = null;
      
      toast({
        title: "Innings Complete",
        description: `${newMatch.team1.name} scored ${newMatch.team1.score}/${newMatch.team1.wickets}. Please select new batsmen and bowler for the second innings.`
      });
    }
    
    setMatch(newMatch);
    
    // Reset the current runs and extra state
    setCurrentRuns(0);
    setIsExtraRun(false);
    setExtraType(null);
  };

  const isLegalDelivery = (): boolean => {
    return !isExtraRun || (extraType !== "wide" && extraType !== "noBall");
  };

  const recordWicket = (dismissalType: string, fielderId?: number) => {
    if (!match || match.status !== "live") return;
    if (match.currentBatsmen[0] === null || match.currentBowler === null) {
      toast({
        title: "Cannot record wicket",
        description: "Please select both batsmen and a bowler",
        variant: "destructive"
      });
      return;
    }

    // Calculate current over and ball
    const totalBalls = match.balls.filter(b => 
      !b.isWide && !b.isNoBall && 
      (match.currentInnings === 1 ? true : b.over > match.team1.overs.split('.')[0])
    ).length;
    
    const currentOver = Math.floor(totalBalls / 6);
    const currentBall = totalBalls % 6 + 1;
    
    const batting = match.currentInnings === 1 ? match.team1 : match.team2;
    const bowling = match.currentInnings === 1 ? match.team2 : match.team1;
    
    // Find current batsman and bowler
    const batsman = batting.players.find(p => p.id === match.currentBatsmen[0])?.name || "Unknown";
    const bowler = bowling.players.find(p => p.id === match.currentBowler)?.name || "Unknown";
    const fielder = fielderId ? bowling.players.find(p => p.id === fielderId)?.name : undefined;
    
    // Create the ball event
    const ballEvent: BallEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      over: currentOver,
      ball: currentBall,
      runs: currentRuns,
      isFour: false,
      isSix: false,
      isWicket: true,
      isWide: extraType === "wide",
      isNoBall: extraType === "noBall",
      isLegBye: extraType === "legBye",
      isBye: extraType === "bye",
      batsman,
      bowler,
      dismissalType,
      playerOut: batsman,
      fielder,
      timestamp: new Date(),
      commentary: generateWicketCommentary(dismissalType, batsman, bowler, fielder)
    };
    
    // Update the match state
    const newBalls = [...match.balls, ballEvent];
    
    // Calculate new wickets and overs
    const newWickets = batting.wickets + 1;
    const newOvers = calculateOver(totalBalls + (isLegalDelivery() ? 1 : 0));
    
    const updatedBatting = {
      ...batting,
      wickets: newWickets,
      overs: newOvers
    };
    
    let newMatch = { ...match, balls: newBalls };
    
    if (match.currentInnings === 1) {
      newMatch.team1 = updatedBatting;
    } else {
      newMatch.team2 = updatedBatting;
    }
    
    // Reset current batsman
    newMatch.currentBatsmen[0] = null;
    
    // Check if innings is complete
    if (newWickets >= 10) {
      if (match.currentInnings === 1) {
        newMatch.currentInnings = 2;
        newMatch.currentBatsmen = [null, null];
        newMatch.currentBowler = null;
        
        toast({
          title: "Innings Complete",
          description: `${newMatch.team1.name} all out for ${newMatch.team1.score}. Please select new batsmen and bowler for the second innings.`
        });
      } else {
        newMatch.status = "completed";
        newMatch.matchEndTime = new Date();
        const diff = newMatch.team1.score - newMatch.team2.score;
        if (diff > 0) {
          toast({
            title: "Match Complete",
            description: `${newMatch.team1.name} wins by ${diff} runs!`
          });
        } else if (diff === 0) {
          toast({
            title: "Match Complete",
            description: "Match tied!"
          });
        } else {
          toast({
            title: "Match Complete",
            description: `${newMatch.team2.name} wins by ${Math.abs(diff)} runs!`
          });
        }
      }
    }
    
    setMatch(newMatch);
    
    // Reset the current runs and extra state
    setCurrentRuns(0);
    setIsExtraRun(false);
    setExtraType(null);
    
    // Close the wicket dialog
    setIsWicketDialogOpen(false);
  };

  const onSaveMatch = (newMatch: Match) => {
    setMatch(newMatch);
    setShowCreateMatch(false);
    toast({
      title: "Match Created",
      description: "New match has been created successfully"
    });
  };

  return (
    <div className="container py-10">
      {!match ? (
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Live Cricket Scoring</h1>
          <Button onClick={() => setShowCreateMatch(true)}>Create Match</Button>
          <CreateMatchDialog 
            open={showCreateMatch} 
            onOpenChange={setShowCreateMatch}
            onSave={onSaveMatch}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{match.name}</CardTitle>
                  <CardDescription className="text-foreground/70">
                    {match.venue} | {match.date} | {match.overs} Overs
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {match.status === "upcoming" && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setIsTossDialogOpen(true)}
                      >
                        <Coins className="h-4 w-4" />
                        Toss
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setIsTeamOfficialsDialogOpen(true)}
                      >
                        <Users className="h-4 w-4" />
                        Team Officials
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setIsMatchOfficialsDialogOpen(true)}
                      >
                        <Gavel className="h-4 w-4" />
                        Match Officials
                      </Button>
                    </>
                  )}
                  
                  {match.status === "toss" && (
                    <Button 
                      onClick={startMatch}
                      disabled={match.currentBatsmen[0] === null || match.currentBatsmen[1] === null || match.currentBowler === null}
                      className="gap-1"
                    >
                      <Zap className="h-4 w-4" />
                      Start Match
                    </Button>
                  )}
                </div>
              </div>
              
              {match.tossWinner && match.tossDecision && (
                <div className="flex items-center gap-2 mt-2 text-sm text-foreground/80">
                  <Coins className="h-4 w-4" />
                  <span>
                    {match.tossWinner === match.team1.id ? match.team1.name : match.team2.name} won the toss and elected to {match.tossDecision} first
                  </span>
                </div>
              )}
              
              {match.weatherConditions && (
                <div className="flex items-center gap-2 mt-1 text-sm text-foreground/80">
                  <CloudSun className="h-4 w-4" />
                  <span>Weather: {match.weatherConditions}</span>
                  <Thermometer className="h-4 w-4 ml-2" />
                  <span>Pitch: {match.pitchConditions}</span>
                </div>
              )}
            </CardHeader>
            
            <CardContent className="pb-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{match.team1.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold">{match.team1.name}</h3>
                    <div className="text-xl font-bold">
                      {match.team1.score}-{match.team1.wickets} 
                      <span className="text-sm font-normal ml-1">({match.team1.overs} ov)</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Badge variant={
                    match.status === "upcoming" ? "outline" : 
                    match.status === "toss" ? "secondary" : 
                    match.status === "live" ? "default" : 
                    "destructive"
                  }>
                    {match.status.toUpperCase()}
                  </Badge>
                  {match.status === "toss" || match.status === "live" ? (
                    <div className="text-sm mt-1">Innings {match.currentInnings}</div>
                  ) : null}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <h3 className="font-bold">{match.team2.name}</h3>
                    <div className="text-xl font-bold">
                      {match.team2.score}-{match.team2.wickets}
                      <span className="text-sm font-normal ml-1">({match.team2.overs} ov)</span>
                    </div>
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{match.team2.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              {/* Match information and scoring controls */}
              <Tabs defaultValue="score" className="w-full">
                <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full">
                  <TabsTrigger value="score">Scoring</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="ball-by-ball">Ball by Ball</TabsTrigger>
                  <TabsTrigger value="players">Players</TabsTrigger>
                  <TabsTrigger value="wagonwheel">Wagon Wheel</TabsTrigger>
                </TabsList>
                
                <TabsContent value="score" className="space-y-4">
                  {match.status === "toss" || match.status === "live" ? (
                    <div className="grid gap-4">
                      <div className="bg-muted rounded-md p-4">
                        <h3 className="font-medium mb-2">Current Batsmen</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">On Strike</p>
                            {match.currentBatsmen[0] ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {match.currentInnings === 1 
                                      ? match.team1.players.find(p => p.id === match.currentBatsmen[0])?.name.substring(0, 2) 
                                      : match.team2.players.find(p => p.id === match.currentBatsmen[0])?.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {match.currentInnings === 1 
                                      ? match.team1.players.find(p => p.id === match.currentBatsmen[0])?.name 
                                      : match.team2.players.find(p => p.id === match.currentBatsmen[0])?.name}
                                  </p>
                                  {match.balls.filter(b => b.batsman === (match.currentInnings === 1 
                                    ? match.team1.players.find(p => p.id === match.currentBatsmen[0])?.name 
                                    : match.team2.players.find(p => p.id === match.currentBatsmen[0])?.name)).length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                      {match.balls.filter(b => b.batsman === (match.currentInnings === 1 
                                        ? match.team1.players.find(p => p.id === match.currentBatsmen[0])?.name 
                                        : match.team2.players.find(p => p.id === match.currentBatsmen[0])?.name))
                                        .reduce((sum, ball) => sum + ball.runs, 0)} 
                                      ({match.balls.filter(b => b.batsman === (match.currentInnings === 1 
                                        ? match.team1.players.find(p => p.id === match.currentBatsmen[0])?.name 
                                        : match.team2.players.find(p => p.id === match.currentBatsmen[0])?.name)).length})
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Select onValueChange={(value) => selectBatsman(parseInt(value), 0)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select batsman" />
                                </SelectTrigger>
                                <SelectContent>
                                  <ScrollArea className="h-72">
                                    {(match.currentInnings === 1 ? match.team1.players : match.team2.players)
                                      .filter(p => !match.currentBatsmen.includes(p.id))
                                      .map(player => (
                                        <SelectItem key={player.id} value={player.id.toString()}>
                                          {player.name} {player.isCaptain ? "(C)" : ""} {player.isViceCaptain ? "(VC)" : ""} {player.isWicketkeeper ? "(WK)" : ""}
                                        </SelectItem>
                                      ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Non-striker</p>
                            {match.currentBatsmen[1] ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {match.currentInnings === 1 
                                      ? match.team1.players.find(p => p.id === match.currentBatsmen[1])?.name.substring(0, 2) 
                                      : match.team2.players.find(p => p.id === match.currentBatsmen[1])?.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {match.currentInnings === 1 
                                      ? match.team1.players.find(p => p.id === match.currentBatsmen[1])?.name 
                                      : match.team2.players.find(p => p.id === match.currentBatsmen[1])?.name}
                                  </p>
                                  {match.balls.filter(b => b.batsman === (match.currentInnings === 1 
                                    ? match.team1.players.find(p => p.id === match.currentBatsmen[1])?.name 
                                    : match.team2.players.find(p => p.id === match.currentBatsmen[1])?.name)).length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                      {match.balls.filter(b => b.batsman === (match.currentInnings === 1 
                                        ? match.team1.players.find(p => p.id === match.currentBatsmen[1])?.name 
                                        : match.team2.players.find(p => p.id === match.currentBatsmen[1])?.name))
                                        .reduce((sum, ball) => sum + ball.runs, 0)} 
                                      ({match.balls.filter(b => b.batsman === (match.currentInnings === 1 
                                        ? match.team1.players.find(p => p.id === match.currentBatsmen[1])?.name 
                                        : match.team2.players.find(p => p.id === match.currentBatsmen[1])?.name)).length})
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Select onValueChange={(value) => selectBatsman(parseInt(value), 1)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select batsman" />
                                </SelectTrigger>
                                <SelectContent>
                                  <ScrollArea className="h-72">
                                    {(match.currentInnings === 1 ? match.team1.players : match.team2.players)
                                      .filter(p => !match.currentBatsmen.includes(p.id))
                                      .map(player => (
                                        <SelectItem key={player.id} value={player.id.toString()}>
                                          {player.name} {player.isCaptain ? "(C)" : ""} {player.isViceCaptain ? "(VC)" : ""} {player.isWicketkeeper ? "(WK)" : ""}
                                        </SelectItem>
                                      ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="font-medium mt-4 mb-2">Current Bowler</h3>
                        {match.currentBowler ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {match.currentInnings === 1 
                                  ? match.team2.players.find(p => p.id === match.currentBowler)?.name.substring(0, 2) 
                                  : match.team1.players.find(p => p.id === match.currentBowler)?.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {match.currentInnings === 1 
                                  ? match.team2.players.find(p => p.id === match.currentBowler)?.name 
                                  : match.team1.players.find(p => p.id === match.currentBowler)?.name}
                              </p>
                              {match.balls.filter(b => b.bowler === (match.currentInnings === 1 
                                ? match.team2.players.find(p => p.id === match.currentBowler)?.name 
                                : match.team1.players.find(p => p.id === match.currentBowler)?.name)).length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  {match.balls.filter(b => b.bowler === (match.currentInnings === 1 
                                    ? match.team2.players.find(p => p.id === match.currentBowler)?.name 
                                    : match.team1.players.find(p => p.id === match.currentBowler)?.name))
                                    .filter(b => b.isWicket).length}-
                                  {match.balls.filter(b => b.bowler === (match.currentInnings === 1 
                                    ? match.team2.players.find(p => p.id === match.currentBowler)?.name 
                                    : match.team1.players.find(p => p.id === match.currentBowler)?.name))
                                    .reduce((sum, ball) => sum + ball.runs, 0)} 
                                  ({calculateOver(match.balls.filter(b => b.bowler === (match.currentInnings === 1 
                                    ? match.team2.players.find(p => p.id === match.currentBowler)?.name 
                                    : match.team1.players.find(p => p.id === match.currentBowler)?.name)).length)})
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Select onValueChange={(value) => selectBowler(parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bowler" />
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-72">
                                {(match.currentInnings === 1 ? match.team2.players : match.team1.players).map(player => (
                                  <SelectItem key={player.id} value={player.id.toString()}>
                                    {player.name} {player.isCaptain ? "(C)" : ""} {player.isViceCaptain ? "(VC)" : ""} {player.isWicketkeeper ? "(WK)" : ""}
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {match.status === "live" && match.currentBatsmen[0] !== null && match.currentBatsmen[1] !== null && match.currentBowler !== null && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button 
                              variant={currentRuns === 0 ? "default" : "outline"} 
                              onClick={() => setCurrentRuns(0)}
                              className="h-12 w-12 rounded-full"
                            >
                              0
                            </Button>
                            <Button 
                              variant={currentRuns === 1 ? "default" : "outline"} 
                              onClick={() => setCurrentRuns(1)}
                              className="h-12 w-12 rounded-full"
                            >
                              1
                            </Button>
                            <Button 
                              variant={currentRuns === 2 ? "default" : "outline"} 
                              onClick={() => setCurrentRuns(2)}
                              className="h-12 w-12 rounded-full"
                            >
                              2
                            </Button>
                            <Button 
                              variant={currentRuns === 3 ? "default" : "outline"} 
                              onClick={() => setCurrentRuns(3)}
                              className="h-12 w-12 rounded-full"
                            >
                              3
                            </Button>
                            <Button 
                              variant={currentRuns === 4 ? "default" : "outline"} 
                              onClick={() => setCurrentRuns(4)}
                              className="h-12 w-12 rounded-full"
                            >
                              4
                            </Button>
                            <Button 
                              variant={currentRuns === 6 ? "default" : "outline"} 
                              onClick={() => setCurrentRuns(6)}
                              className="h-12 w-12 rounded-full"
                            >
                              6
                            </Button>
                            <Button 
                              variant={isExtraRun && extraType === "wide" ? "destructive" : "outline"} 
                              onClick={() => {
                                setIsExtraRun(true);
                                setExtraType("wide");
                              }}
                              className="h-12 px-4 rounded-full"
                            >
                              Wide
                            </Button>
                            <Button 
                              variant={isExtraRun && extraType === "noBall" ? "destructive" : "outline"} 
                              onClick={() => {
                                setIsExtraRun(true);
                                setExtraType("noBall");
                              }}
                              className="h-12 px-4 rounded-full"
                            >
                              No Ball
                            </Button>
                            <Button 
                              variant={isExtraRun && extraType === "legBye" ? "destructive" : "outline"} 
                              onClick={() => {
                                setIsExtraRun(true);
                                setExtraType("legBye");
                              }}
                              className="h-12 px-4 rounded-full"
                            >
                              Leg Bye
                            </Button>
                            <Button 
                              variant={isExtraRun && extraType === "bye" ? "destructive" : "outline"} 
                              onClick={() => {
                                setIsExtraRun(true);
                                setExtraType("bye");
                              }}
                              className="h-12 px-4 rounded-full"
                            >
                              Bye
                            </Button>
                          </div>
                          
                          <div className="flex justify-center gap-2">
                            <Button 
                              variant="outline" 
                              className="gap-1"
                              onClick={() => {
                                setIsExtraRun(false);
                                setExtraType(null);
                                setCurrentRuns(0);
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reset
                            </Button>
                            <Button 
                              variant="destructive" 
                              className="gap-1"
                              onClick={() => setIsWicketDialogOpen(true)}
                            >
                              <X className="h-4 w-4" />
                              Wicket
                            </Button>
                            <Button 
                              className="gap-1"
                              onClick={recordBall}
                            >
                              <Check className="h-4 w-4" />
                              Record Ball
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                      {match.status === "upcoming" ? (
                        <Alert>
                          <AlertTitle>Match not started</AlertTitle>
                          <AlertDescription>
                            Complete the toss and select team officials before starting the match.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert>
                          <AlertTitle>Match completed</AlertTitle>
                          <AlertDescription>
                            This match has been completed. You can view the statistics and summary.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="stats">
                  <MatchStats match={match} calculateBattingStats={calculateBattingStats} calculateBowlingStats={calculateBowlingStats} />
                </TabsContent>
                
                <TabsContent value="ball-by-ball">
                  <BallByBall balls={match.balls} />
                </TabsContent>
                
                <TabsContent value="players">
                  <Tabs defaultValue="team1" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="team1">{match.team1.name}</TabsTrigger>
                      <TabsTrigger value="team2">{match.team2.name}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="team1">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2 p-2">
                          {match.team1.players.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-sm text-muted-foreground">{player.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {player.isCaptain && (
                                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">C</Badge>
                                )}
                                {player.isViceCaptain && (
                                  <Badge variant="outline" className="text-slate-400 border-slate-400">VC</Badge>
                                )}
                                {player.isWicketkeeper && (
                                  <Badge variant="outline" className="text-blue-500 border-blue-500">WK</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="team2">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2 p-2">
                          {match.team2.players.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-sm text-muted-foreground">{player.role}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {player.isCaptain && (
                                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">C</Badge>
                                )}
                                {player.isViceCaptain && (
                                  <Badge variant="outline" className="text-slate-400 border-slate-400">VC</Badge>
                                )}
                                {player.isWicketkeeper && (
                                  <Badge variant="outline" className="text-blue-500 border-blue-500">WK</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
                
                <TabsContent value="wagonwheel">
                  <WagonWheel balls={match.balls} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Wicket Dialog */}
      <Dialog open={isWicketDialogOpen} onOpenChange={setIsWicketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Wicket</DialogTitle>
            <DialogDescription>
              Select the type of dismissal and other details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="dismissalType">Dismissal Type</Label>
              <Select 
                value={wicketDetails.dismissalType} 
                onValueChange={(value) => setWicketDetails({ ...wicketDetails, dismissalType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bowled">Bowled</SelectItem>
                  <SelectItem value="Caught">Caught</SelectItem>
                  <SelectItem value="LBW">LBW</SelectItem>
                  <SelectItem value="Run Out">Run Out</SelectItem>
                  <SelectItem value="Stumped">Stumped</SelectItem>
                  <SelectItem value="Hit Wicket">Hit Wicket</SelectItem>
                  <SelectItem value="Retired Hurt">Retired Hurt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(wicketDetails.dismissalType === "Caught" || wicketDetails.dismissalType === "Run Out" || wicketDetails.dismissalType === "Stumped") && (
              <div>
                <Label htmlFor="fielder">Fielder</Label>
                <Select 
                  onValueChange={(value) => setWicketDetails({ ...wicketDetails, fielder: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fielder" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-72">
                      {(match?.currentInnings === 1 ? match?.team2.players : match?.team1.players)?.map(player => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name} {player.isWicketkeeper ? "(WK)" : ""}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWicketDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => recordWicket(
              wicketDetails.dismissalType,
              wicketDetails.fielder ? parseInt(wicketDetails.fielder) : undefined
            )}>
              Record Wicket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Toss Dialog */}
      <TossDialog 
        open={isTossDialogOpen}
        onOpenChange={setIsTossDialogOpen}
        match={match}
        team1={match?.team1 || null}
        team2={match?.team2 || null}
        onTossComplete={handleTossComplete}
      />
      
      {/* Team Officials Dialog */}
      <TeamOfficialsDialog
        open={isTeamOfficialsDialogOpen}
        onOpenChange={setIsTeamOfficialsDialogOpen}
        team1={match?.team1 || null}
        team2={match?.team2 || null}
        team1Players={match?.team1.players || []}
        team2Players={match?.team2.players || []}
        onSave={handleTeamOfficialsComplete}
      />
      
      {/* Match Officials Dialog */}
      <MatchOfficialsDialog
        open={isMatchOfficialsDialogOpen}
        onOpenChange={setIsMatchOfficialsDialogOpen}
        onSave={handleMatchOfficialsComplete}
      />
    </div>
  );
}