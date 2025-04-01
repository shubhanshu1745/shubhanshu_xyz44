import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { PlayerStats, PlayerMatch, PlayerMatchPerformance, User, CreatePlayerMatchFormData, CreatePlayerMatchPerformanceFormData } from "@shared/schema";
import { format } from "date-fns";
import { Award, Flag, Clock, MapPin, Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PerformanceChart } from "@/components/PerformanceChart"; // Ensure this path is correct
import { AddMatchDialog } from "@/components/AddMatchDialog"; // Ensure this path is correct


// Define schemas for match and performance forms - Keeping these for clarity and potential isolated usage, but using shared schemas now
const matchFormSchema = z.object({
  opponent: z.string().min(1, "Opponent name is required"),
  venue: z.string().min(1, "Venue is required"),
  matchDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  matchType: z.enum(["T20", "ODI", "Test", "Other", "Practice"]),
  result: z.enum(["Win", "Loss", "Draw", "In Progress"]),
  teamScore: z.string().min(1, "Team score is required"),
  opponentScore: z.string().min(1, "Opponent score is required"),
  matchDescription: z.string().optional(),
  tossResult: z.string().optional(),
  firstInnings: z.boolean().optional(),
  matchName: z.string().optional(),
});


const performanceFormSchema = z.object({
  runsScored: z.string().optional().default("0"),
  ballsFaced: z.string().optional().default("0"),
  notOut: z.boolean().default(false),
  fours: z.string().optional().default("0"),
  sixes: z.string().optional().default("0"),
  wicketsTaken: z.string().optional().default("0"),
  oversBowled: z.string().optional().default("0.0"),
  runsConceded: z.string().optional().default("0"),
  maidens: z.string().optional().default("0"),
  catches: z.string().optional().default("0"),
  runOuts: z.string().optional().default("0"),
  stumpings: z.string().optional().default("0"),
  battingPosition: z.string().optional(),
  bowlingPosition: z.string().optional(),
  battingStyle: z.string().optional(),
  bowlingStyle: z.string().optional(),
  economyRate: z.string().optional(),
  strikeRate: z.string().optional(),
  playerOfMatch: z.boolean().optional().default(false),
});


type MatchFormValues = z.infer<typeof matchFormSchema>;
type PerformanceFormValues = z.infer<typeof performanceFormSchema>;


type MatchWithPerformanceMaybe = PlayerMatch & {
  performance?: PlayerMatchPerformance;
};


export default function StatsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"match" | "performance">("match");
  const [newMatchId, setNewMatchId] = useState<number | null>(null);


  const matchForm = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      opponent: "",
      venue: "",
      matchDate: format(new Date(), "yyyy-MM-dd"),
      matchType: "T20",
      result: "Win",
      teamScore: "",
      opponentScore: "",
      matchDescription: "",
      tossResult: "",
      firstInnings: false,
      matchName: "",
    },
  });


  const performanceForm = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceFormSchema),
    defaultValues: {
      runsScored: "0",
      ballsFaced: "0",
      notOut: false,
      fours: "0",
      sixes: "0",
      wicketsTaken: "0",
      oversBowled: "0.0",
      runsConceded: "0",
      maidens: "0",
      catches: "0",
      runOuts: "0",
      stumpings: "0",
      battingPosition: "",
      bowlingPosition: "",
      battingStyle: "",
      bowlingStyle: "",
      economyRate: "",
      strikeRate: "",
      playerOfMatch: false,
    },
  });

  const userQueryKeyBase = ['/api/users', user?.username];


  const { data: dbPlayerStats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery<PlayerStats>({
    queryKey: [...userQueryKeyBase, 'player-stats'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.username,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1
  });


  const { data: dbMatches, isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery<MatchWithPerformanceMaybe[]>({
    queryKey: [...userQueryKeyBase, 'matches'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.username,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1
  });


  const playerStats = dbPlayerStats;
  const matches = dbMatches || [];

  // --- Mutations ---


  const addMatchMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchFormData) => {
      if (!user?.username) {
        throw new Error("User not logged in");
      }
      return await apiRequest<PlayerMatch>("POST", `/api/users/${user.username}/matches`, data);
    },
    onSuccess: (response) => {
      if (typeof response?.id !== 'number') {
        console.error("Match created response missing or invalid ID:", response);
        throw new Error("No valid match ID returned from server");
      }
      setNewMatchId(response.id);
      setCurrentStep("performance");
      toast({
        title: "Match Added",
        description: "Now add your performance details."
      });
    },
    onError: (error: any) => {
      console.error("Match creation error:", error);
      toast({
        title: "Error Adding Match",
        description: error?.message || "Failed to add the match. Please try again.",
        variant: "destructive"
      });
    }
  });


  const addPerformanceMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchPerformanceFormData) => {
      if (!user?.username) throw new Error("User not logged in");
      if (newMatchId === null) throw new Error("Match ID is missing");
      return await apiRequest<PlayerMatchPerformance>("POST", `/api/users/${user.username}/matches/${newMatchId}/performance`, data);
    },
    onSuccess: () => {
      toast({
        title: "Performance Added",
        description: "Your match and performance stats have been saved."
      });

      matchForm.reset();
      performanceForm.reset();


      setCurrentStep("match");
      setNewMatchId(null);
      setIsAddMatchDialogOpen(false);


      queryClient.invalidateQueries({ queryKey: [...userQueryKeyBase, 'player-stats'] });
      queryClient.invalidateQueries({ queryKey: [...userQueryKeyBase, 'matches'] });
    },
    onError: (error: any) => {
      console.error("Error adding performance:", error);
      toast({
        title: "Error Adding Performance",
        description: error?.message || "Failed to add performance details. Please try again.",
        variant: "destructive"
      });
    }
  });

  // --- Form Handlers ---


  async function onMatchSubmit(values: MatchFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    const matchData: CreatePlayerMatchFormData = {
      userId: user.id,
      opponent: values.opponent,
      venue: values.venue,
      matchDate: new Date(values.matchDate),
      matchType: values.matchType,
      result: values.result,
      matchName: values.matchName || `${user.username || 'My Team'} vs ${values.opponent}`,
      teamScore: values.teamScore,
      opponentScore: values.opponentScore,
      matchDescription: values.matchDescription || "",
      tossResult: values.tossResult || "",
      firstInnings: values.firstInnings || false,
    };

    try {
      console.log('Submitting match data:', matchData);
      await addMatchMutation.mutateAsync(matchData);
      if (addMatchMutation.isSuccess) {
        setCurrentStep("performance");
      }
    } catch (error) {
      console.error('Error submitting match:', error);
      toast({
        title: "Error",
        description: "Failed to add match. Please try again.",
        variant: "destructive"
      });
    }
  }


  function onPerformanceSubmit(values: PerformanceFormValues) {
    if (!user || newMatchId === null) {
        toast({ title: "Error", description: "User or Match ID missing.", variant: "destructive" });
        return;
    }


    const safeParseInt = (value: string | undefined | null): number => {
        const parsed = parseInt(value || "0", 10);
        return isNaN(parsed) ? 0 : parsed;
    };
    const safeParseFloat = (value: string | undefined | null): number => {
        const parsed = parseFloat(value || "0");
        return isNaN(parsed) ? 0 : parsed;
    };
    const parseOptionalInt = (value: string | undefined | null): number | undefined => {
        if (!value) return undefined;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    };
    const parseOptionalFloat = (value: string | undefined | null): number | undefined => {
      if (!value) return undefined;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
  };


    const performanceData: CreatePlayerMatchPerformanceFormData = {
      userId: user.id,
      matchId: newMatchId,
      runsScored: safeParseInt(values.runsScored),
      ballsFaced: safeParseInt(values.ballsFaced),
      battingStatus: values.notOut ? "Not Out" : "Out",
      fours: safeParseInt(values.fours),
      sixes: safeParseInt(values.sixes),
      wicketsTaken: safeParseInt(values.wicketsTaken),
      oversBowled: values.oversBowled || "0.0",
      runsConceded: safeParseInt(values.runsConceded),
      maidens: safeParseInt(values.maidens),
      catches: safeParseInt(values.catches),
      runOuts: safeParseInt(values.runOuts),
      stumpings: safeParseInt(values.stumpings),
      battingPosition: parseOptionalInt(values.battingPosition),
      bowlingPosition: parseOptionalInt(values.bowlingPosition),
      battingStyle: values.battingStyle || undefined,
      bowlingStyle: values.bowlingStyle || undefined,
      economyRate: parseOptionalFloat(values.economyRate),
      strikeRate: parseOptionalFloat(values.strikeRate),
      playerOfMatch: values.playerOfMatch || false,
    };

    console.log('Submitting performance data:', performanceData);
    addPerformanceMutation.mutate(performanceData);
  }

  // --- Render Logic ---

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p>Please login to view stats</p>
      </div>
    );
  }


  const isLoading = isStatsLoading || isMatchesLoading;


  const stats: PlayerStats = playerStats || {
    id: 0,
    userId: user.id,
    position: '',
    battingStyle: '',
    bowlingStyle: '',
    totalMatches: 0,
    totalRuns: 0,
    totalWickets: 0,
    totalCatches: 0,
    totalRunOuts: 0,
    totalSixes: 0,
    totalFours: 0,
    highestScore: 0,
    bestBowling: "0/0",
    battingAverage: 0,
    bowlingAverage: 0,
    innings: 0,
    notOuts: 0,
    ballsFaced: 0,
    oversBowled: "0.0",
    runsConceded: 0,
    maidens: 0,
    fifties: 0,
    hundreds: 0,
    playerOfMatchAwards: 0,
    highestScoreNotOut: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    strikeRate: 0,
    economyRate: 0,
    stumpings: 0,

  };


  const calculateAverage = (runs: number, outs: number): string => {
    if (outs <= 0) return "0.00";
    return (runs / outs).toFixed(2);
  };

  const calculateStrikeRate = (runs: number, balls: number): string => {
    if (balls <= 0) return "0.00";
    return ((runs / balls) * 100).toFixed(2);
  };

  const calculateEconomy = (runsConceded: number, oversBowledStr: string): string => {
    const oversParts = oversBowledStr?.split('.') || ['0'];
    const fullOvers = parseInt(oversParts[0] || '0', 10);
    const partialOverBalls = parseInt(oversParts[1] || '0', 10);
    if (isNaN(fullOvers) || isNaN(partialOverBalls) || (fullOvers === 0 && partialOverBalls === 0)) return "0.00";
    const totalBalls = fullOvers * 6 + partialOverBalls;
    if (totalBalls <= 0) return "0.00";
    return ((runsConceded * 6) / totalBalls).toFixed(2);
  };

  const calculateBowlingAverage = (runsConceded: number, wickets: number): string => {
    if (wickets <= 0) return "0.00";
    return (runsConceded / wickets).toFixed(2);
  };

  const battingAvg = calculateAverage(stats.totalRuns || 0, (stats.innings || 0) - (stats.notOuts || 0));
  const battingSR = calculateStrikeRate(stats.totalRuns || 0, stats.ballsFaced || 0);
  const bowlingEcon = calculateEconomy(stats.runsConceded || 0, stats.oversBowled || "0.0");
  const bowlingAvg = calculateBowlingAverage(stats.runsConceded || 0, stats.totalWickets || 0);

  // Prepare chart data
  const chartData = matches.map(match => ({
    date: format(new Date(match.matchDate!), 'MMM dd'), // Format date for chart
    runs: match.performance?.runsScored || 0,
    wicketsTaken: match.performance?.wicketsTaken || 0,
    ballsFaced: match.performance?.ballsFaced || 0,
    oversBowled: match.performance?.oversBowled || '0',
    runsConceded: match.performance?.runsConceded || 0,
    fours: match.performance?.fours || 0,
    sixes: match.performance?.sixes || 0,
    maidens: match.performance?.maidens || 0,
  })).reverse(); // Reverse to show latest matches last in chart


  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 relative">
      {/* Cricket field background */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-20 dark:opacity-10 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30"></div>
        <div className="absolute w-[95%] h-[95%] border-[12px] border-white/50 dark:border-gray-700/50 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[65%] h-[65%] border-[8px] border-white/40 dark:border-gray-600/40 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[15%] h-[50%] bg-yellow-200/30 dark:bg-yellow-800/30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-[4px] border-white/60 dark:border-gray-500/60"></div>
        <div className="absolute w-[15%] h-[4px] bg-white/80 dark:bg-gray-400/80 top-[38%] left-1/2 transform -translate-x-1/2"></div>
        <div className="absolute w-[15%] h-[4px] bg-white/80 dark:bg-gray-400/80 top-[62%] left-1/2 transform -translate-x-1/2"></div>
        <div className="absolute w-[4px] h-[50%] bg-white/50 dark:bg-gray-500/50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[4%] h-[6px] bg-orange-300 dark:bg-orange-700 top-[38%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[4%] h-[6px] bg-orange-300 dark:bg-orange-700 top-[62%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>


      <div className="relative z-10">

        <div className="flex flex-col md:flex-row items-center mb-8 bg-card p-6 rounded-lg shadow-md border">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary mb-4 md:mb-0 md:mr-6">
            <AvatarImage
              src={user.profileImage || `https://avatar.vercel.sh/${user.username}.png`}
              alt={user.username}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">{user.fullName || user.username}</h1>
            <p className="text-muted-foreground font-medium mb-3">@{user.username}</p>


            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-sm">
              {stats.position && (
                <div className="flex items-center">
                  <Award className="w-4 h-4 text-primary mr-1.5" />
                  <span className="font-medium">{stats.position}</span>
                </div>
              )}
              {stats.battingStyle && (
                <div className="flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 13.18V21a1 1 0 0 1-1.2.97l-4-1A1 1 0 0 1 8.5 20v-6.82a1 1 0 0 1 .12-.48l5-8A1 1 0 0 1 14.5 4.5V8a1 1 0 0 0 1 1h3a1 1 0 0 1 .85 1.53l-4.9 6.5a1 1 0 0 1-1.45.15z"/></svg>
                  <span className="font-medium">{stats.battingStyle}</span>
                </div>
              )}
              {stats.bowlingStyle && stats.bowlingStyle !== "N/A" && (
                 <div className="flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a3.5 3.5 0 0 0-3.5 3.5v1a.5.5 0 0 0 1 0v-1A2.5 2.5 0 0 1 12 3a2.5 2.5 0 0 1 2.5 2.5v1a.5.5 0 0 0 1 0v-1A3.5 3.5 0 0 0 12 2z"/></svg>
                  <span className="font-medium">{stats.bowlingStyle}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-primary mr-1.5" />
                  <span className="font-medium">{user.location}</span>
                </div>
              )}
            </div>
          </div>

          <AddMatchDialog />
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <Card className="bg-card shadow-sm border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">Batting</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => ( <div key={i} className="h-4 bg-muted rounded w-3/4"></div> ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Matches</span> <span className="font-semibold">{stats.totalMatches || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Runs</span> <span className="font-semibold">{stats.totalRuns || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Average</span> <span className="font-semibold">{battingAvg}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Strike Rate</span> <span className="font-semibold">{battingSR}</span> </div>
                </div>
              )}
            </CardContent>
          </Card>


          <Card className="bg-card shadow-sm border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">Bowling</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => ( <div key={i} className="h-4 bg-muted rounded w-3/4"></div> ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Wickets</span> <span className="font-semibold">{stats.totalWickets || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Economy</span> <span className="font-semibold">{bowlingEcon}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Average</span> <span className="font-semibold">{bowlingAvg}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Best Figures</span> <span className="font-semibold">{stats.bestBowling || "0/0"}</span> </div>
                </div>
              )}
            </CardContent>
          </Card>


          <Card className="bg-card shadow-sm border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => ( <div key={i} className="h-4 bg-muted rounded w-3/4"></div> ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">50s</span> <span className="font-semibold">{stats.fifties || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">100s</span> <span className="font-semibold">{stats.hundreds || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">4s</span> <span className="font-semibold">{stats.totalFours || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">6s</span> <span className="font-semibold">{stats.totalSixes || 0}</span> </div>
                </div>
              )}
            </CardContent>
          </Card>


          <Card className="bg-card shadow-sm border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">Fielding & More</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                    {[...Array(4)].map((_, i) => ( <div key={i} className="h-4 bg-muted rounded w-3/4"></div> ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Catches</span> <span className="font-semibold">{stats.totalCatches || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Run Outs</span> <span className="font-semibold">{stats.totalRunOuts || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Player of Match</span> <span className="font-semibold">{stats.playerOfMatchAwards || 0}</span> </div>
                  <div className="flex justify-between text-sm"> <span className="text-muted-foreground">Highest Score</span> <span className="font-semibold">{stats.highestScore || 0}{stats.highestScoreNotOut ? '*' : ''}</span> </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        <Tabs defaultValue="recent-matches" className="bg-card rounded-lg shadow-md border">
          <TabsList className="w-full border-b grid grid-cols-2 h-auto p-0 rounded-t-lg">
            <TabsTrigger
              value="recent-matches"
              className="flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none rounded-tl-lg"
            >
              Recent Matches
            </TabsTrigger>
            <TabsTrigger
              value="performance-trends"
              className="flex-1 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none rounded-tr-lg"
            >
              Performance Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent-matches" className="p-4 md:p-6">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-muted p-4 rounded-md">
                    <div className="h-5 bg-muted-foreground/20 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {matches && matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <Card key={match.id} className="overflow-hidden border shadow-sm">

                         <div className="flex flex-wrap bg-muted/50 dark:bg-muted/30 p-2 px-4 items-center text-xs text-muted-foreground gap-x-3 gap-y-1">
                           <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            <span>{match.matchDate ? format(new Date(match.matchDate), 'PPP') : 'Date N/A'}</span>
                           </div>
                           <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1.5" />
                            <span>{match.venue || 'Venue N/A'}</span>
                           </div>
                           <div className="flex items-center">
                              <Flag className="h-3.5 w-3.5 mr-1.5" />
                              <span>{match.matchType || 'Type N/A'}</span>
                           </div>
                        </div>


                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-base font-semibold text-foreground mr-2">{match.matchName || `Match vs ${match.opponent}`}</h3>
                             <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              match.result === 'Win' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                              match.result === 'Loss' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                            }`}>
                              {match.result}
                            </span>
                          </div>


                           <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wider">Your Team</p>
                                <p className="font-medium text-foreground">{match.teamScore || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs uppercase tracking-wider">Opponent</p>
                                <p className="font-medium text-foreground">{match.opponentScore || 'N/A'}</p>
                            </div>
                          </div>


                          {match.performance && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="text-sm font-semibold mb-2 text-primary">Your Performance</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">

                                {(match.performance.runsScored !== undefined && match.performance.runsScored !== null) && (
                                    <div><span className="text-muted-foreground">Runs:</span> <span className="font-medium">{match.performance.runsScored}{match.performance.battingStatus === "Not Out" ? '*' : ''}</span></div>
                                )}
                                {(match.performance.ballsFaced !== undefined && match.performance.ballsFaced !== null) && (
                                    <div><span className="text-muted-foreground">Balls:</span> <span className="font-medium">{match.performance.ballsFaced}</span></div>
                                )}

                                {(match.performance.wicketsTaken !== undefined && match.performance.wicketsTaken !== null) && (
                                    <div><span className="text-muted-foreground">Wickets:</span> <span className="font-medium">{match.performance.wicketsTaken}</span></div>
                                )}
                                {(match.performance.oversBowled !== undefined && match.performance.oversBowled !== null && match.performance.oversBowled !== '0.0') && (
                                    <div><span className="text-muted-foreground">Overs:</span> <span className="font-medium">{match.performance.oversBowled}</span></div>
                                )}
                                {(match.performance.runsConceded !== undefined && match.performance.runsConceded !== null) && (
                                    <div><span className="text-muted-foreground">Runs Conceded:</span> <span className="font-medium">{match.performance.runsConceded}</span></div>
                                )}

                                {(match.performance.catches !== undefined && match.performance.catches !== null && match.performance.catches > 0) && (
                                    <div><span className="text-muted-foreground">Catches:</span> <span className="font-medium">{match.performance.catches}</span></div>
                                )}
                                 {(match.performance.runOuts !== undefined && match.performance.runOuts !== null && match.performance.runOuts > 0) && (
                                    <div><span className="text-muted-foreground">Run Outs:</span> <span className="font-medium">{match.performance.runOuts}</span></div>
                                )}
                                 {(match.performance.stumpings !== undefined && match.performance.stumpings !== null && match.performance.stumpings > 0) && (
                                    <div><span className="text-muted-foreground">Stumpings:</span> <span className="font-medium">{match.performance.stumpings}</span></div>
                                )}
                              </div>
                               {match.performance.playerOfMatch && (
                                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold mt-2 flex items-center"><Award className="w-3.5 h-3.5 mr-1"/>Player of the Match</p>
                                )}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
                    <p className="text-muted-foreground mb-4">Add your first match to start tracking your stats.</p>
                    <AddMatchDialog />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="performance-trends" className="p-4 md:p-6">
             {chartData.length > 0 ? (
                <PerformanceChart data={chartData} />
              ) : (
                 <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Performance Trends</h3>
                    <p className="text-muted-foreground mb-4">Once you add a few matches, charts visualizing your batting and bowling trends over time will appear here.</p>
                 </div>
              )}
          </TabsContent>
        </Tabs>
      </div>


    </div>
  );
}