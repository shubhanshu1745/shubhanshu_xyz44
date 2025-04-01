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
  Plus, Minus, RotateCcw, CheckSquare, X, User, UserPlus, Award, 
  Target, Zap, RefreshCcw, Check, AlignJustify, CircleDot
} from "lucide-react";
import CreateMatchDialog from "@/components/scoring/create-match-dialog";
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
    name: string;
    players: Player[];
    score: number;
    wickets: number;
    overs: string;
  };
  team2: {
    name: string;
    players: Player[];
    score: number;
    wickets: number;
    overs: string;
  };
  status: "upcoming" | "live" | "completed";
  currentInnings: 1 | 2;
  currentBatsmen: [number | null, number | null];
  currentBowler: number | null;
  balls: BallEvent[];
}

// Mock data to start with
const initialMatch: Match = {
  id: 1,
  name: "Friendly Match",
  venue: "Local Ground",
  date: new Date().toISOString().split('T')[0],
  overs: 20,
  team1: {
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

export default function LiveScoring() {
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

  useEffect(() => {
    // Load match data from backend or use sample data
    if (matchId) {
      // Fetch match data from API
      // For now, use the initial match data
      setMatch(initialMatch);
    }
  }, [matchId]);

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
      status: "live"
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
        toast({
          title: "Match Complete",
          description: `${newMatch.team2.name} wins by ${10 - newMatch.team2.wickets} wickets!`
        });
      } else if (totalBalls >= match.overs * 6) {
        newMatch.status = "completed";
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
    } else {
      toast({
        title: "Wicket!",
        description: `${batsman} is out! Please select a new batsman.`
      });
    }
    
    setMatch(newMatch);
    
    // Reset the current runs and extra state
    setCurrentRuns(0);
    setIsExtraRun(false);
    setExtraType(null);
  };

  const generateCommentary = (runs: number, extraType: string | null, batsman: string, bowler: string): string => {
    if (extraType === "wide") {
      return `Wide ball by ${bowler}. ${runs + 1} run(s) added.`;
    } else if (extraType === "noBall") {
      return `No ball by ${bowler}. ${runs + 1} run(s) added.`;
    } else if (extraType === "legBye") {
      return `Leg bye. ${runs} run(s) taken.`;
    } else if (extraType === "bye") {
      return `Bye. ${runs} run(s) taken.`;
    } else if (runs === 4) {
      return `FOUR! ${batsman} hits a beautiful boundary off ${bowler}.`;
    } else if (runs === 6) {
      return `SIX! ${batsman} hits a huge six off ${bowler}.`;
    } else {
      return `${batsman} takes ${runs} run(s) off ${bowler}.`;
    }
  };

  const generateWicketCommentary = (dismissalType: string, batsman: string, bowler: string, fielder?: string): string => {
    switch (dismissalType) {
      case "Bowled":
        return `WICKET! ${batsman} is bowled by ${bowler}!`;
      case "Caught":
        return `WICKET! ${batsman} is caught by ${fielder} off the bowling of ${bowler}.`;
      case "LBW":
        return `WICKET! ${batsman} is LBW to ${bowler}.`;
      case "Run Out":
        return `WICKET! ${batsman} is run out by ${fielder}!`;
      case "Stumped":
        return `WICKET! ${batsman} is stumped by ${fielder} off the bowling of ${bowler}.`;
      default:
        return `WICKET! ${batsman} is out!`;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTitle>You must be logged in</AlertTitle>
          <AlertDescription>
            Please log in to view and score matches.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showCreateMatch) {
    return (
      <div className="container mx-auto p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create New Match</CardTitle>
            <CardDescription>Set up a new cricket match for scoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matchName">Match Name</Label>
                  <Input id="matchName" placeholder="e.g. Friendly Match" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" placeholder="e.g. Local Ground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matchDate">Match Date</Label>
                  <Input id="matchDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overs">Overs</Label>
                  <Select defaultValue="20">
                    <SelectTrigger id="overs">
                      <SelectValue placeholder="Select overs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Overs</SelectItem>
                      <SelectItem value="10">10 Overs</SelectItem>
                      <SelectItem value="20">20 Overs (T20)</SelectItem>
                      <SelectItem value="50">50 Overs (ODI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team1Name">Team 1 Name</Label>
                  <Input id="team1Name" placeholder="e.g. Tigers" />
                </div>
                
                <div className="space-y-2">
                  <Label>Team 1 Players</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={`team1-player-${i}`} className="flex items-center gap-2">
                        <span className="font-medium w-8">{i + 1}.</span>
                        <Input placeholder={`Player ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team2Name">Team 2 Name</Label>
                  <Input id="team2Name" placeholder="e.g. Lions" />
                </div>
                
                <div className="space-y-2">
                  <Label>Team 2 Players</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={`team2-player-${i}`} className="flex items-center gap-2">
                        <span className="font-medium w-8">{i + 1}.</span>
                        <Input placeholder={`Player ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowCreateMatch(false)}>Cancel</Button>
            <Button className="bg-[#2E8B57] hover:bg-[#1F3B4D]" onClick={() => {
              toast({
                title: "Match Created",
                description: "Your new match has been created successfully!"
              });
              setShowCreateMatch(false);
              setMatch(initialMatch);
            }}>Create Match</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <h1 className="text-2xl font-bold">Cricket Scoring</h1>
          <p className="text-muted-foreground text-center">
            Create a new match or join an existing one to start scoring.
          </p>
          <div className="flex gap-4">
            <Button 
              className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
              onClick={() => setShowCreateMatch(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Match
            </Button>
            <Button variant="outline">
              Join Existing Match
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isFirstInnings = match.currentInnings === 1;
  const battingTeam = isFirstInnings ? match.team1 : match.team2;
  const bowlingTeam = isFirstInnings ? match.team2 : match.team1;
  
  const currentStriker = match.currentBatsmen[0] !== null 
    ? battingTeam.players.find(p => p.id === match.currentBatsmen[0]) 
    : null;
    
  const currentNonStriker = match.currentBatsmen[1] !== null 
    ? battingTeam.players.find(p => p.id === match.currentBatsmen[1]) 
    : null;
    
  const currentBowlerPlayer = match.currentBowler !== null 
    ? bowlingTeam.players.find(p => p.id === match.currentBowler) 
    : null;

  // Calculate total runs for each team
  const team1Runs = match.team1.score;
  const team2Runs = match.team2.score;
  
  // Calculate required runs and balls for second innings
  const requiredRuns = isFirstInnings ? 0 : team1Runs - team2Runs + 1;
  const ballsBowled = match.balls.filter(b => 
    !b.isWide && !b.isNoBall && 
    (isFirstInnings ? true : b.over >= (match.overs * (match.currentInnings - 1)))
  ).length;
  const ballsRemaining = (match.overs * 6) - ballsBowled;
  const requiredRunRate = ballsRemaining > 0 ? (requiredRuns / (ballsRemaining / 6)).toFixed(2) : "0.00";

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>{match.name}</CardTitle>
            <Badge variant={match.status === "live" ? "default" : match.status === "completed" ? "secondary" : "outline"}>
              {match.status.toUpperCase()}
            </Badge>
          </div>
          <CardDescription>{match.venue} • {match.date}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg flex flex-col items-center justify-center">
              <h3 className="font-semibold text-lg">{match.team1.name}</h3>
              <div className="text-3xl font-bold my-2">
                {match.team1.score}/{match.team1.wickets}
              </div>
              <div className="text-sm text-muted-foreground">
                {match.team1.overs} overs
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-4xl font-bold">VS</div>
              {match.status === "completed" ? (
                <div className="mt-2 font-semibold">
                  {team1Runs > team2Runs ? (
                    <span>{match.team1.name} won by {team1Runs - team2Runs} runs</span>
                  ) : team2Runs > team1Runs ? (
                    <span>{match.team2.name} won by {10 - match.team2.wickets} wickets</span>
                  ) : (
                    <span>Match tied!</span>
                  )}
                </div>
              ) : match.currentInnings === 2 ? (
                <div className="mt-2 space-y-1">
                  <div className="text-sm font-medium">
                    Need {requiredRuns} runs from {ballsRemaining} balls
                  </div>
                  <div className="text-xs text-muted-foreground">
                    RRR: {requiredRunRate}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">
                  {match.status === "upcoming" ? "Match not started" : "1st innings in progress"}
                </div>
              )}
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg flex flex-col items-center justify-center">
              <h3 className="font-semibold text-lg">{match.team2.name}</h3>
              <div className="text-3xl font-bold my-2">
                {match.team2.score}/{match.team2.wickets}
              </div>
              <div className="text-sm text-muted-foreground">
                {match.team2.overs} overs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {match.status === "upcoming" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Start Match</CardTitle>
            <CardDescription>
              Select opening batsmen and bowler to start the match
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Striker</h3>
                <Select value={match.currentBatsmen[0]?.toString() || ""} onValueChange={(value) => selectBatsman(parseInt(value), 0)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select striker" />
                  </SelectTrigger>
                  <SelectContent>
                    {battingTeam.players.map(player => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Non-Striker</h3>
                <Select value={match.currentBatsmen[1]?.toString() || ""} onValueChange={(value) => selectBatsman(parseInt(value), 1)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select non-striker" />
                  </SelectTrigger>
                  <SelectContent>
                    {battingTeam.players.map(player => (
                      <SelectItem 
                        key={player.id} 
                        value={player.id.toString()}
                        disabled={player.id === match.currentBatsmen[0]}
                      >
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Bowler</h3>
                <Select value={match.currentBowler?.toString() || ""} onValueChange={(value) => selectBowler(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bowler" />
                  </SelectTrigger>
                  <SelectContent>
                    {bowlingTeam.players.map(player => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-[#2E8B57] hover:bg-[#1F3B4D]"
              onClick={startMatch}
              disabled={match.currentBatsmen[0] === null || match.currentBatsmen[1] === null || match.currentBowler === null}
            >
              Start Match
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {match.status === "live" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Batsmen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Target className="h-3 w-3 mr-1" />
                        Striker
                      </Badge>
                      <span className="font-medium">{currentStriker?.name || "Select batsman"}</span>
                    </div>
                    
                    {currentStriker && (
                      <div className="text-right">
                        <span className="font-bold">
                          {match.balls.filter(b => b.batsman === currentStriker.name).reduce((sum, b) => sum + b.runs, 0)}
                        </span>
                        <span className="text-muted-foreground text-sm ml-1">
                          ({match.balls.filter(b => b.batsman === currentStriker.name).length})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Non-striker</Badge>
                      <span className="font-medium">{currentNonStriker?.name || "Select batsman"}</span>
                    </div>
                    
                    {currentNonStriker && (
                      <div className="text-right">
                        <span className="font-bold">
                          {match.balls.filter(b => b.batsman === currentNonStriker.name).reduce((sum, b) => sum + b.runs, 0)}
                        </span>
                        <span className="text-muted-foreground text-sm ml-1">
                          ({match.balls.filter(b => b.batsman === currentNonStriker.name).length})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {(!currentStriker || !currentNonStriker) && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => setShowSelectPlayers(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Select Batsmen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Bowler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <CircleDot className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                      <span className="font-medium">{currentBowlerPlayer?.name || "Select bowler"}</span>
                    </div>
                    
                    {currentBowlerPlayer && (
                      <div className="text-right">
                        <span className="font-bold">
                          {match.balls.filter(b => b.bowler === currentBowlerPlayer.name).filter(b => b.isWicket).length}-
                          {match.balls.filter(b => b.bowler === currentBowlerPlayer.name).reduce((sum, b) => sum + b.runs, 0)}
                        </span>
                        <span className="text-muted-foreground text-sm ml-1">
                          ({calculateOver(match.balls.filter(b => b.bowler === currentBowlerPlayer.name).length)})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {!currentBowlerPlayer && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => {
                        // Show dialog to select bowler
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Select Bowler
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Scoring</CardTitle>
              <CardDescription>
                {isFirstInnings ? "1st innings" : "2nd innings"} • 
                {battingTeam.name}: {battingTeam.score}/{battingTeam.wickets} ({battingTeam.overs})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={isExtraRun ? "secondary" : "outline"} 
                    onClick={() => setIsExtraRun(!isExtraRun)}
                  >
                    Extra
                  </Button>
                  
                  {isExtraRun && (
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant={extraType === "wide" ? "secondary" : "outline"} 
                        onClick={() => setExtraType(extraType === "wide" ? null : "wide")}
                        size="sm"
                      >
                        Wide
                      </Button>
                      <Button 
                        variant={extraType === "noBall" ? "secondary" : "outline"} 
                        onClick={() => setExtraType(extraType === "noBall" ? null : "noBall")}
                        size="sm"
                      >
                        No Ball
                      </Button>
                      <Button 
                        variant={extraType === "legBye" ? "secondary" : "outline"} 
                        onClick={() => setExtraType(extraType === "legBye" ? null : "legBye")}
                        size="sm"
                      >
                        Leg Bye
                      </Button>
                      <Button 
                        variant={extraType === "bye" ? "secondary" : "outline"} 
                        onClick={() => setExtraType(extraType === "bye" ? null : "bye")}
                        size="sm"
                      >
                        Bye
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 6].map(runs => (
                    <Button 
                      key={`runs-${runs}`}
                      variant={currentRuns === runs ? "default" : "outline"}
                      className={currentRuns === runs ? "bg-[#2E8B57] hover:bg-[#1F3B4D]" : ""}
                      onClick={() => setCurrentRuns(runs)}
                    >
                      {runs}
                    </Button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsWicketDialogOpen(true)}
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-100 hover:text-red-700"
                  >
                    Wicket
                  </Button>
                  
                  <Button 
                    className="flex-1 bg-[#2E8B57] hover:bg-[#1F3B4D]"
                    onClick={recordBall}
                    disabled={!currentStriker || !currentBowlerPlayer}
                  >
                    Record Ball
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="commentary" className="mb-6">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="commentary">Commentary</TabsTrigger>
              <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="commentary" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px] py-4">
                    <div className="px-4 space-y-4">
                      {match.balls.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No balls bowled yet. Commentary will appear here.
                        </div>
                      ) : (
                        [...match.balls].reverse().map(ball => (
                          <div key={ball.id} className="border-b pb-3">
                            <div className="flex justify-between items-start">
                              <div className="font-medium">
                                Over {ball.over}.{ball.ball}
                              </div>
                              <Badge 
                                variant={
                                  ball.isWicket ? "destructive" : 
                                  ball.isFour ? "secondary" : 
                                  ball.isSix ? "default" : 
                                  "outline"
                                }
                              >
                                {ball.isWicket ? "W" : 
                                 ball.isFour ? "4" : 
                                 ball.isSix ? "6" : 
                                 ball.isWide ? "Wd" : 
                                 ball.isNoBall ? "Nb" : 
                                 ball.runs.toString()}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">{ball.commentary}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="scorecard">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>{battingTeam.name} Batting</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2">Batter</th>
                          <th className="pb-2 text-right">R</th>
                          <th className="pb-2 text-right">B</th>
                          <th className="pb-2 text-right">4s</th>
                          <th className="pb-2 text-right">6s</th>
                          <th className="pb-2 text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {battingTeam.players.map(player => {
                          const playerBalls = match.balls.filter(b => b.batsman === player.name);
                          const outBall = match.balls.find(b => b.isWicket && b.playerOut === player.name);
                          const runs = playerBalls.reduce((sum, b) => sum + b.runs, 0);
                          const balls = playerBalls.length;
                          const fours = playerBalls.filter(b => b.isFour).length;
                          const sixes = playerBalls.filter(b => b.isSix).length;
                          const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "-";
                          
                          if (balls === 0 && !match.currentBatsmen.includes(player.id)) return null;
                          
                          return (
                            <tr key={player.id} className="border-b">
                              <td className="py-2">
                                <div className="flex flex-col">
                                  <span className="font-medium">{player.name}</span>
                                  {outBall ? (
                                    <span className="text-xs text-muted-foreground">
                                      {outBall.dismissalType} 
                                      {outBall.dismissalType === "Caught" || outBall.dismissalType === "Run Out" || outBall.dismissalType === "Stumped" 
                                        ? ` by ${outBall.fielder}` 
                                        : ""}
                                      {(outBall.dismissalType === "Caught" || outBall.dismissalType === "Bowled" || outBall.dismissalType === "LBW" || outBall.dismissalType === "Stumped") 
                                        ? ` (${outBall.bowler})` 
                                        : ""}
                                    </span>
                                  ) : (
                                    match.currentBatsmen[0] === player.id ? (
                                      <span className="text-xs text-muted-foreground">batting *</span>
                                    ) : match.currentBatsmen[1] === player.id ? (
                                      <span className="text-xs text-muted-foreground">batting</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">not out</span>
                                    )
                                  )}
                                </div>
                              </td>
                              <td className="py-2 text-right">{runs}</td>
                              <td className="py-2 text-right">{balls}</td>
                              <td className="py-2 text-right">{fours}</td>
                              <td className="py-2 text-right">{sixes}</td>
                              <td className="py-2 text-right">{strikeRate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle>{bowlingTeam.name} Bowling</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2">Bowler</th>
                          <th className="pb-2 text-right">O</th>
                          <th className="pb-2 text-right">M</th>
                          <th className="pb-2 text-right">R</th>
                          <th className="pb-2 text-right">W</th>
                          <th className="pb-2 text-right">Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bowlingTeam.players.map(player => {
                          const playerBalls = match.balls.filter(b => b.bowler === player.name);
                          
                          if (playerBalls.length === 0) return null;
                          
                          const overs = calculateOver(playerBalls.length);
                          const maidens = 0; // To be calculated with proper over tracking
                          const runs = playerBalls.reduce((sum, b) => sum + b.runs, 0);
                          const wickets = playerBalls.filter(b => b.isWicket).length;
                          const economy = playerBalls.length > 0 
                            ? ((runs / (playerBalls.length / 6))).toFixed(1) 
                            : "-";
                          
                          return (
                            <tr key={player.id} className="border-b">
                              <td className="py-2 font-medium">{player.name}</td>
                              <td className="py-2 text-right">{overs}</td>
                              <td className="py-2 text-right">{maidens}</td>
                              <td className="py-2 text-right">{runs}</td>
                              <td className="py-2 text-right">{wickets}</td>
                              <td className="py-2 text-right">{economy}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
      
      {match.status === "completed" && (
        <Card>
          <CardHeader>
            <CardTitle>Match Summary</CardTitle>
            <CardDescription>Final result and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-muted">
                <Award className="h-4 w-4" />
                <AlertTitle>Match Result</AlertTitle>
                <AlertDescription>
                  {team1Runs > team2Runs ? (
                    <span>{match.team1.name} won by {team1Runs - team2Runs} runs</span>
                  ) : team2Runs > team1Runs ? (
                    <span>{match.team2.name} won by {10 - match.team2.wickets} wickets</span>
                  ) : (
                    <span>Match tied!</span>
                  )}
                </AlertDescription>
              </Alert>
              
              <Tabs defaultValue="team1">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="team1">{match.team1.name}</TabsTrigger>
                  <TabsTrigger value="team2">{match.team2.name}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="team1" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Top Scorer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const topScorer = match.team1.players.reduce((best, player) => {
                            const runs = match.balls
                              .filter(b => b.batsman === player.name)
                              .reduce((sum, b) => sum + b.runs, 0);
                            return runs > best.runs ? { player, runs } : best;
                          }, { player: null, runs: -1 });
                          
                          return topScorer.player ? (
                            <div className="flex items-center">
                              <Avatar className="h-9 w-9 mr-2">
                                <AvatarFallback>{topScorer.player.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{topScorer.player.name}</div>
                                <div className="text-sm text-muted-foreground">{topScorer.runs} runs</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No data available</div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Best Bowler</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const bestBowler = match.team2.players.reduce((best, player) => {
                            const wickets = match.balls
                              .filter(b => b.bowler === player.name && b.isWicket)
                              .length;
                            return wickets > best.wickets ? { player, wickets } : best;
                          }, { player: null, wickets: -1 });
                          
                          return bestBowler.player ? (
                            <div className="flex items-center">
                              <Avatar className="h-9 w-9 mr-2">
                                <AvatarFallback>{bestBowler.player.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{bestBowler.player.name}</div>
                                <div className="text-sm text-muted-foreground">{bestBowler.wickets} wickets</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No data available</div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="team2" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Top Scorer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const topScorer = match.team2.players.reduce((best, player) => {
                            const runs = match.balls
                              .filter(b => b.batsman === player.name)
                              .reduce((sum, b) => sum + b.runs, 0);
                            return runs > best.runs ? { player, runs } : best;
                          }, { player: null, runs: -1 });
                          
                          return topScorer.player ? (
                            <div className="flex items-center">
                              <Avatar className="h-9 w-9 mr-2">
                                <AvatarFallback>{topScorer.player.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{topScorer.player.name}</div>
                                <div className="text-sm text-muted-foreground">{topScorer.runs} runs</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No data available</div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Best Bowler</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const bestBowler = match.team1.players.reduce((best, player) => {
                            const wickets = match.balls
                              .filter(b => b.bowler === player.name && b.isWicket)
                              .length;
                            return wickets > best.wickets ? { player, wickets } : best;
                          }, { player: null, wickets: -1 });
                          
                          return bestBowler.player ? (
                            <div className="flex items-center">
                              <Avatar className="h-9 w-9 mr-2">
                                <AvatarFallback>{bestBowler.player.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{bestBowler.player.name}</div>
                                <div className="text-sm text-muted-foreground">{bestBowler.wickets} wickets</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No data available</div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-[#2E8B57] hover:bg-[#1F3B4D]"
              onClick={() => {
                // Export match or share
              }}
            >
              Export Match Report
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Dialogs and Popovers */}
      <Dialog open={isWicketDialogOpen} onOpenChange={setIsWicketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wicket Details</DialogTitle>
            <DialogDescription>How was the batsman dismissed?</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dismissalType">Dismissal Type</Label>
              <Select 
                value={wicketDetails.dismissalType} 
                onValueChange={(value) => setWicketDetails({...wicketDetails, dismissalType: value})}
              >
                <SelectTrigger id="dismissalType">
                  <SelectValue placeholder="Select dismissal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bowled">Bowled</SelectItem>
                  <SelectItem value="Caught">Caught</SelectItem>
                  <SelectItem value="LBW">LBW</SelectItem>
                  <SelectItem value="Run Out">Run Out</SelectItem>
                  <SelectItem value="Stumped">Stumped</SelectItem>
                  <SelectItem value="Hit Wicket">Hit Wicket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(wicketDetails.dismissalType === "Caught" || 
              wicketDetails.dismissalType === "Run Out" || 
              wicketDetails.dismissalType === "Stumped") && (
              <div className="space-y-2">
                <Label htmlFor="fielder">Fielder</Label>
                <Select onValueChange={(value) => setWicketDetails({...wicketDetails, fielder: value})}>
                  <SelectTrigger id="fielder">
                    <SelectValue placeholder="Select fielder" />
                  </SelectTrigger>
                  <SelectContent>
                    {bowlingTeam.players.map(player => (
                      <SelectItem key={player.id} value={player.name}>
                        {player.name}
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
                recordWicket(wicketDetails.dismissalType, 
                  bowlingTeam.players.find(p => p.name === wicketDetails.fielder)?.id);
                setIsWicketDialogOpen(false);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Confirm Wicket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}