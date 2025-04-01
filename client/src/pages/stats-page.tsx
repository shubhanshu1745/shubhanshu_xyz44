import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
import { getQueryFn, apiRequest } from "@/lib/queryClient"; // Assuming queryClient is exported from here too
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

// Define schemas for match and performance forms
const matchFormSchema = z.object({
  opponent: z.string().min(1, "Opponent name is required"),
  venue: z.string().min(1, "Venue is required"),
  matchDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }), // Ensure it's a parseable date string
  matchType: z.enum(["T20", "ODI", "Test", "Other", "Practice"]),
  result: z.enum(["Win", "Loss", "Draw", "In Progress"]),
  teamScore: z.string().min(1, "Team score is required"),
  opponentScore: z.string().min(1, "Opponent score is required"),
  matchDescription: z.string().optional(),
  tossResult: z.string().optional(),
  firstInnings: z.boolean().optional(),
  matchName: z.string().optional(),
  // userId: z.number().optional() // userId should not be part of the form, it comes from auth state
});

// Using string for number inputs as form values are often strings, parse on submit
const performanceFormSchema = z.object({
  runsScored: z.string().optional().default("0"),
  ballsFaced: z.string().optional().default("0"),
  notOut: z.boolean().default(false),
  fours: z.string().optional().default("0"),
  sixes: z.string().optional().default("0"),
  wicketsTaken: z.string().optional().default("0"),
  oversBowled: z.string().optional().default("0.0"), // Allow decimals
  runsConceded: z.string().optional().default("0"),
  maidens: z.string().optional().default("0"),
  catches: z.string().optional().default("0"),
  runOuts: z.string().optional().default("0"),
  stumpings: z.string().optional().default("0"),
  battingPosition: z.string().optional(), // Keep as string, parse later if needed, allows empty
  bowlingPosition: z.string().optional(), // Keep as string, parse later if needed, allows empty
  battingStyle: z.string().optional(),
  bowlingStyle: z.string().optional(),
  economyRate: z.string().optional(), // Keep as string, calculate/validate later if needed
  strikeRate: z.string().optional(), // Keep as string, calculate/validate later if needed
  playerOfMatch: z.boolean().optional().default(false),
});

// Removed PlayerWithStats as it wasn't used
// type PlayerWithStats = {
//   user: User;
//   stats: PlayerStats;
// };

type MatchFormValues = z.infer<typeof matchFormSchema>;
type PerformanceFormValues = z.infer<typeof performanceFormSchema>;

// Ensure this type includes fields actually returned by the API or transformed
// Added optional performance
type MatchWithPerformanceMaybe = PlayerMatch & {
  performance?: PlayerMatchPerformance; // Performance might not always exist for a match
  // UI specific fields (if needed, otherwise derive from PlayerMatch)
  // Example: date (already exists as matchDate), matchTitle (matchName?), overs, format
};


export default function StatsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Get queryClient instance
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"match" | "performance">("match");
  const [newMatchId, setNewMatchId] = useState<number | null>(null);

  // Form for adding a new match
  const matchForm = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      opponent: "",
      venue: "",
      matchDate: format(new Date(), "yyyy-MM-dd"), // Ensure correct format for date input
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

  // Form for adding player performance
  const performanceForm = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceFormSchema),
    // Use defaults from schema or explicit ones matching schema type (string/boolean)
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
      battingPosition: "", // Use empty string for optional string inputs
      bowlingPosition: "",
      battingStyle: "",
      bowlingStyle: "",
      economyRate: "",
      strikeRate: "",
      playerOfMatch: false,
    },
  });

  const userQueryKeyBase = ['/api/users', user?.username]; // Base query key

  // Fetch player stats
  const { data: dbPlayerStats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery<PlayerStats>({
    queryKey: [...userQueryKeyBase, 'player-stats'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.username, // Enable only if user and username exist
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Less aggressive refetching
    retry: 1
  });

  // Fetch recent matches
  // Assume the API returns PlayerMatch[] including performance data if available
  const { data: dbMatches, isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery<MatchWithPerformanceMaybe[]>({
    queryKey: [...userQueryKeyBase, 'matches'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.username,
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Less aggressive refetching
    retry: 1
  });

  // Use fetched data directly or provide defaults; avoid complex intermediate objects unless necessary
  const playerStats = dbPlayerStats; // Use dbPlayerStats directly if its shape matches PlayerStats
  const matches = dbMatches || []; // Use dbMatches directly, default to empty array

  // --- Mutations ---

  // Add a new match
  const addMatchMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchFormData) => {
      if (!user?.username) {
        throw new Error("User not logged in");
      }
      // Use backticks for template literal URL
      return await apiRequest<PlayerMatch>("POST", `/api/users/${user.username}/matches`, data);
    },
    onSuccess: (response) => {
      // Ensure response has an ID and it's a number
      if (typeof response?.id !== 'number') {
        console.error("Match created response missing or invalid ID:", response);
        throw new Error("No valid match ID returned from server");
      }
      setNewMatchId(response.id);
      setCurrentStep("performance"); // Move to next step
      toast({
        title: "Match Added",
        description: "Now add your performance details."
      });
      // Optionally pre-fill performance form if needed
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

  // Add match performance
  const addPerformanceMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchPerformanceFormData) => {
      if (!user?.username) throw new Error("User not logged in");
      if (newMatchId === null) throw new Error("Match ID is missing");
      // Use backticks for template literal URL
      return await apiRequest<PlayerMatchPerformance>("POST", `/api/users/${user.username}/matches/${newMatchId}/performance`, data);
    },
    onSuccess: () => {
      toast({
        title: "Performance Added",
        description: "Your match and performance stats have been saved."
      });

      // Reset forms to default values
      matchForm.reset();
      performanceForm.reset();

      // Reset state and close dialog
      setCurrentStep("match");
      setNewMatchId(null);
      setIsAddMatchDialogOpen(false);

      // Invalidate queries to trigger refetch
      // Invalidate both stats and matches as adding performance updates both
      queryClient.invalidateQueries({ queryKey: [...userQueryKeyBase, 'player-stats'] });
      queryClient.invalidateQueries({ queryKey: [...userQueryKeyBase, 'matches'] });

      // Explicit refetch might be redundant if invalidateQueries works as expected,
      // but can ensure immediate update if needed. Test without first.
      // refetchStats();
      // refetchMatches();
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

  // Handle match form submission
  function onMatchSubmit(values: MatchFormValues) {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    const matchData: CreatePlayerMatchFormData = {
      userId: user.id,
      opponent: values.opponent,
      venue: values.venue,
      matchDate: new Date(values.matchDate), // Convert string date to Date object
      matchType: values.matchType,
      result: values.result,
      matchName: values.matchName || `${user.username || 'My Team'} vs ${values.opponent}`, // Default match name
      teamScore: values.teamScore,
      opponentScore: values.opponentScore,
      matchDescription: values.matchDescription || "", // Ensure empty string if undefined
      tossResult: values.tossResult || "",
      firstInnings: values.firstInnings || false, // Ensure boolean
    };

    console.log('Submitting match data:', matchData);
    addMatchMutation.mutate(matchData);
  }

  // Handle performance form submission
  function onPerformanceSubmit(values: PerformanceFormValues) {
    if (!user || newMatchId === null) {
        toast({ title: "Error", description: "User or Match ID missing.", variant: "destructive" });
        return;
    }

    // Safely parse string inputs to numbers, defaulting to 0 if parsing fails (e.g., empty string or invalid chars)
    const safeParseInt = (value: string | undefined | null): number => {
        const parsed = parseInt(value || "0", 10);
        return isNaN(parsed) ? 0 : parsed;
    };
    const safeParseFloat = (value: string | undefined | null): number => {
        const parsed = parseFloat(value || "0");
        return isNaN(parsed) ? 0 : parsed;
    };
    const parseOptionalInt = (value: string | undefined | null): number | undefined => {
        if (!value) return undefined; // Return undefined if input is empty/null/undefined
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed; // Return undefined if parsing fails
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
      oversBowled: values.oversBowled || "0.0", // API likely expects string format like "10.2" or number
      runsConceded: safeParseInt(values.runsConceded),
      maidens: safeParseInt(values.maidens),
      catches: safeParseInt(values.catches),
      runOuts: safeParseInt(values.runOuts),
      stumpings: safeParseInt(values.stumpings),
      // Handle optional numeric fields - parse or pass undefined
      battingPosition: parseOptionalInt(values.battingPosition),
      bowlingPosition: parseOptionalInt(values.bowlingPosition),
      // Pass optional strings directly, ensuring they are strings or undefined
      battingStyle: values.battingStyle || undefined,
      bowlingStyle: values.bowlingStyle || undefined,
      economyRate: parseOptionalFloat(values.economyRate), // Assuming API expects number or null/undefined
      strikeRate: parseOptionalFloat(values.strikeRate), // Assuming API expects number or null/undefined
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

  // Combined loading state
  const isLoading = isStatsLoading || isMatchesLoading;

  // Provide default stats structure if data is loading or unavailable
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
    battingAverage: 0, // Changed to number for consistency if backend provides number
    bowlingAverage: 0, // Changed to number
    innings: 0,
    notOuts: 0,
    ballsFaced: 0,
    oversBowled: "0.0", // Assuming string format like "10.2"
    runsConceded: 0,
    maidens: 0,
    fifties: 0,
    hundreds: 0,
    playerOfMatchAwards: 0,
    highestScoreNotOut: false,
    createdAt: new Date(), // Placeholder
    updatedAt: new Date(), // Placeholder
    // Ensure all fields from PlayerStats are here if needed
    strikeRate: 0, // Example added field if present in schema
    economyRate: 0, // Example added field if present in schema
    stumpings: 0, // Example added field
  };

  // Calculate derived stats safely
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


  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 relative">
      {/* Cricket field background - enhanced with realistic cricket field elements */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-20 dark:opacity-10 pointer-events-none">
        {/* Main field gradient */}
        <div className="w-full h-full bg-gradient-to-b from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30"></div>
        {/* Outer boundary */}
        <div className="absolute w-[95%] h-[95%] border-[12px] border-white/50 dark:border-gray-700/50 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        {/* 30-yard circle */}
        <div className="absolute w-[65%] h-[65%] border-[8px] border-white/40 dark:border-gray-600/40 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        {/* Pitch */}
        <div className="absolute w-[15%] h-[50%] bg-yellow-200/30 dark:bg-yellow-800/30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-[4px] border-white/60 dark:border-gray-500/60"></div>
        {/* Pitch creases */}
        <div className="absolute w-[15%] h-[4px] bg-white/80 dark:bg-gray-400/80 top-[38%] left-1/2 transform -translate-x-1/2"></div>
        <div className="absolute w-[15%] h-[4px] bg-white/80 dark:bg-gray-400/80 top-[62%] left-1/2 transform -translate-x-1/2"></div>
        {/* Middle stump line */}
        <div className="absolute w-[4px] h-[50%] bg-white/50 dark:bg-gray-500/50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        {/* Wickets (simplified) */}
        <div className="absolute w-[4%] h-[6px] bg-orange-300 dark:bg-orange-700 top-[38%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[4%] h-[6px] bg-orange-300 dark:bg-orange-700 top-[62%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>


      {/* Content */}
      <div className="relative z-10">
        {/* Player Header */}
        <div className="flex flex-col md:flex-row items-center mb-8 bg-card p-6 rounded-lg shadow-md border">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary mb-4 md:mb-0 md:mr-6">
            <AvatarImage
              src={user.profileImage || `https://avatar.vercel.sh/${user.username}.png`} // Fallback avatar generator
              alt={user.username}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1">{user.fullName || user.username}</h1>
            <p className="text-muted-foreground font-medium mb-3">@{user.username}</p>

            {/* Displaying actual stats from playerStats if available */}
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
              {stats.bowlingStyle && stats.bowlingStyle !== "N/A" && ( // Only show if relevant bowling style
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

          <Button
            variant="default"
            className="mt-4 md:mt-0" // Use theme default button style
            onClick={() => setIsAddMatchDialogOpen(true)}
            aria-label="Add New Match"
          >
            Add Match
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Batting Card */}
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

          {/* Bowling Card */}
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

          {/* Batting Milestones Card */}
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

          {/* Fielding & More Card */}
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

        {/* Tabs for Recent Matches and Stats */}
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
                        {/* Match Header */}
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

                        {/* Match Body */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-base font-semibold text-foreground mr-2">{match.matchName || `Match vs ${match.opponent}`}</h3>
                             <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              match.result === 'Win' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                              match.result === 'Loss' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' // Draw or In Progress
                            }`}>
                              {match.result}
                            </span>
                          </div>

                          {/* Scores */}
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

                          {/* Performance Section - Only render if performance data exists */}
                          {match.performance && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="text-sm font-semibold mb-2 text-primary">Your Performance</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                                {/* Batting Performance */}
                                {(match.performance.runsScored !== undefined && match.performance.runsScored !== null) && (
                                    <div><span className="text-muted-foreground">Runs:</span> <span className="font-medium">{match.performance.runsScored}{match.performance.battingStatus === "Not Out" ? '*' : ''}</span></div>
                                )}
                                {(match.performance.ballsFaced !== undefined && match.performance.ballsFaced !== null) && (
                                    <div><span className="text-muted-foreground">Balls:</span> <span className="font-medium">{match.performance.ballsFaced}</span></div>
                                )}
                                {/* Bowling Performance */}
                                {(match.performance.wicketsTaken !== undefined && match.performance.wicketsTaken !== null) && (
                                    <div><span className="text-muted-foreground">Wickets:</span> <span className="font-medium">{match.performance.wicketsTaken}</span></div>
                                )}
                                {(match.performance.oversBowled !== undefined && match.performance.oversBowled !== null && match.performance.oversBowled !== '0.0') && (
                                    <div><span className="text-muted-foreground">Overs:</span> <span className="font-medium">{match.performance.oversBowled}</span></div>
                                )}
                                {(match.performance.runsConceded !== undefined && match.performance.runsConceded !== null) && (
                                    <div><span className="text-muted-foreground">Runs Conceded:</span> <span className="font-medium">{match.performance.runsConceded}</span></div>
                                )}
                                {/* Fielding Performance */}
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
                    <Button
                      variant="default"
                      onClick={() => setIsAddMatchDialogOpen(true)}
                    >
                      <Award className="mr-2 h-4 w-4" /> Add First Match
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="performance-trends" className="p-4 md:p-6">
             <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Performance Trends Coming Soon</h3>
                <p className="text-muted-foreground mb-4">Charts visualizing your batting and bowling trends over time will appear here as you add more matches.</p>
                 {/* Placeholder for future charts */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Card className="p-4 border shadow-sm">
                        <CardTitle className="text-base text-primary mb-2">Batting Runs Over Time</CardTitle>
                        <div className="h-48 flex items-center justify-center bg-muted rounded-md">
                        <p className="text-center text-sm text-muted-foreground">(Chart Placeholder)</p>
                        </div>
                    </Card>
                    <Card className="p-4 border shadow-sm">
                        <CardTitle className="text-base text-primary mb-2">Wickets per Match</CardTitle>
                        <div className="h-48 flex items-center justify-center bg-muted rounded-md">
                        <p className="text-center text-sm text-muted-foreground">(Chart Placeholder)</p>
                        </div>
                    </Card>
                 </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- Add Match & Performance Dialog --- */}
      <Dialog open={isAddMatchDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // Reset everything when dialog closes IF it wasn't submitted successfully
          // Successful submission already resets state
          if (currentStep === "match" || !addPerformanceMutation.isSuccess) {
              matchForm.reset();
              performanceForm.reset();
              setCurrentStep("match");
              setNewMatchId(null);
          }
        }
        setIsAddMatchDialogOpen(open);
      }}>
        <DialogContent className="max-w-3xl sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentStep === "match" ? "Add New Match" : `Performance for Match #${newMatchId}`}</DialogTitle>
            <DialogDescription>
              {currentStep === "match"
                ? "Enter the details of the cricket match."
                : "Enter your personal performance statistics for this match."}
            </DialogDescription>
          </DialogHeader>

          {/* Match Form - Step 1 */}
          {currentStep === "match" && (
            <Form {...matchForm}>
              {/* Use novalidate because react-hook-form handles validation */}
              <form onSubmit={matchForm.handleSubmit(onMatchSubmit)} noValidate className="space-y-4 mt-4">
                {/* Grid layout for better spacing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={matchForm.control} name="opponent" render={({ field }) => ( <FormItem> <FormLabel>Opponent Team*</FormLabel> <FormControl> <Input placeholder="e.g., Lions XI" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                  <FormField control={matchForm.control} name="venue" render={({ field }) => ( <FormItem> <FormLabel>Venue*</FormLabel> <FormControl> <Input placeholder="e.g., Central Park Ground" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={matchForm.control} name="matchDate" render={({ field }) => ( <FormItem> <FormLabel>Match Date*</FormLabel> <FormControl> <Input type="date" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                  <FormField control={matchForm.control} name="matchType" render={({ field }) => ( <FormItem> <FormLabel>Match Type*</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select match type" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="T20">T20</SelectItem> <SelectItem value="ODI">ODI</SelectItem> <SelectItem value="Test">Test</SelectItem> <SelectItem value="Practice">Practice</SelectItem> <SelectItem value="Other">Other</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={matchForm.control} name="teamScore" render={({ field }) => ( <FormItem> <FormLabel>Your Team Score*</FormLabel> <FormControl> <Input placeholder="e.g., 150/6 (20)" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                  <FormField control={matchForm.control} name="opponentScore" render={({ field }) => ( <FormItem> <FormLabel>Opponent Score*</FormLabel> <FormControl> <Input placeholder="e.g., 142/8 (20)" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={matchForm.control} name="result" render={({ field }) => ( <FormItem> <FormLabel>Result*</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select match result" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="Win">Win</SelectItem> <SelectItem value="Loss">Loss</SelectItem> <SelectItem value="Draw">Draw</SelectItem> <SelectItem value="In Progress">In Progress</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                    <FormField control={matchForm.control} name="matchName" render={({ field }) => ( <FormItem> <FormLabel>Match Name (Optional)</FormLabel> <FormControl> <Input placeholder={`e.g., Friendly vs ${matchForm.getValues("opponent") || 'Opponent'}`} {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                 </div>
                 <FormField control={matchForm.control} name="matchDescription" render={({ field }) => ( <FormItem> <FormLabel>Match Description (Optional)</FormLabel> <FormControl> <Input placeholder="e.g., Thrilling last over finish!" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={matchForm.control} name="tossResult" render={({ field }) => ( <FormItem> <FormLabel>Toss Result (Optional)</FormLabel> <FormControl> <Input placeholder="e.g., We won the toss and elected to bat" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={matchForm.control} name="firstInnings" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 h-full justify-start mt-auto mb-1"> <FormControl> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="firstInningsCheck" /> </FormControl> <FormLabel htmlFor="firstInningsCheck" className="font-normal cursor-pointer">Did your team bat first?</FormLabel> <FormMessage /> </FormItem> )} />
                 </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddMatchDialogOpen(false)} disabled={addMatchMutation.isPending}> Cancel </Button>
                  <Button type="submit" disabled={addMatchMutation.isPending}> {addMatchMutation.isPending ? "Adding..." : "Next: Add Performance"} <ChevronRight className="ml-2 h-4 w-4" /> </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {/* Performance Form - Step 2 */}
          {currentStep === "performance" && (
            <Form {...performanceForm}>
              {/* Use novalidate because react-hook-form handles validation */}
              <form onSubmit={performanceForm.handleSubmit(onPerformanceSubmit)} noValidate className="space-y-6 mt-4">
                {/* Batting Section */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-primary border-b pb-1">Batting</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={performanceForm.control} name="runsScored" render={({ field }) => ( <FormItem> <FormLabel>Runs Scored</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="ballsFaced" render={({ field }) => ( <FormItem> <FormLabel>Balls Faced</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="notOut" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 h-full justify-start mt-auto mb-1"> <FormControl> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="notOutCheck"/> </FormControl> <FormLabel htmlFor="notOutCheck" className="font-normal cursor-pointer">Not Out?</FormLabel> <FormMessage /> </FormItem> )} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <FormField control={performanceForm.control} name="fours" render={({ field }) => ( <FormItem> <FormLabel>Fours (4s)</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="sixes" render={({ field }) => ( <FormItem> <FormLabel>Sixes (6s)</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="battingPosition" render={({ field }) => ( <FormItem> <FormLabel>Batting Pos.</FormLabel> <FormControl> <Input type="number" min="1" max="11" placeholder="e.g., 3" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <FormField control={performanceForm.control} name="battingStyle" render={({ field }) => ( <FormItem> <FormLabel>Batting Style (Optional)</FormLabel> <FormControl> <Input placeholder="e.g., Right-hand bat" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                     <FormField control={performanceForm.control} name="strikeRate" render={({ field }) => ( <FormItem> <FormLabel>Strike Rate (Optional)</FormLabel> <FormControl> <Input type="number" step="0.01" placeholder="e.g., 125.50" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                </div>

                {/* Bowling Section */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-primary border-b pb-1">Bowling</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={performanceForm.control} name="wicketsTaken" render={({ field }) => ( <FormItem> <FormLabel>Wickets Taken</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="oversBowled" render={({ field }) => ( <FormItem> <FormLabel>Overs Bowled</FormLabel> <FormControl> <Input placeholder="e.g., 4.0 or 3.2" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="runsConceded" render={({ field }) => ( <FormItem> <FormLabel>Runs Conceded</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <FormField control={performanceForm.control} name="maidens" render={({ field }) => ( <FormItem> <FormLabel>Maiden Overs</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="bowlingPosition" render={({ field }) => ( <FormItem> <FormLabel>Bowling Pos.</FormLabel> <FormControl> <Input type="number" min="1" max="11" placeholder="e.g., 10" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                     <FormField control={performanceForm.control} name="economyRate" render={({ field }) => ( <FormItem> <FormLabel>Economy (Optional)</FormLabel> <FormControl> <Input type="number" step="0.01" placeholder="e.g., 6.75" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                   <div className="grid grid-cols-1 mt-4">
                    <FormField control={performanceForm.control} name="bowlingStyle" render={({ field }) => ( <FormItem> <FormLabel>Bowling Style (Optional)</FormLabel> <FormControl> <Input placeholder="e.g., Right-arm fast-medium" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                </div>

                {/* Fielding Section */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-primary border-b pb-1">Fielding</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={performanceForm.control} name="catches" render={({ field }) => ( <FormItem> <FormLabel>Catches</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="runOuts" render={({ field }) => ( <FormItem> <FormLabel>Run Outs</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={performanceForm.control} name="stumpings" render={({ field }) => ( <FormItem> <FormLabel>Stumpings</FormLabel> <FormControl> <Input type="number" min="0" placeholder="0" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                  </div>
                </div>

                 {/* Other Section */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-primary border-b pb-1">Other</h3>
                    <FormField control={performanceForm.control} name="playerOfMatch" render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 justify-start"> <FormControl> <Checkbox checked={field.value} onCheckedChange={field.onChange} id="pomCheck"/> </FormControl> <FormLabel htmlFor="pomCheck" className="font-normal cursor-pointer">Player of the Match?</FormLabel> <FormMessage /> </FormItem> )} />
                 </div>


                <DialogFooter className="mt-8">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep("match")} disabled={addPerformanceMutation.isPending}> <ChevronLeft className="mr-2 h-4 w-4" /> Back to Match Details </Button>
                  <Button type="submit" disabled={addPerformanceMutation.isPending}> {addPerformanceMutation.isPending ? "Saving..." : "Save Performance"} </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}