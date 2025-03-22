import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { PlayerStats, PlayerMatch, PlayerMatchPerformance, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Spinner } from "@/components/ui/spinner";
import { Bot, Calendar, Calendar as CalendarIcon, Clock, Flag, MapPin, Award, Send, Gauge, Trophy, BarChart2, TrendingUp, Zap } from "lucide-react";

// Custom Cricket and Bat icons as React components
const Cricket = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3v18" />
    <path d="M5 8h14" />
    <path d="M8 12a4 4 0 0 0 8 0" />
  </svg>
);

const Bat = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4.5 14.5L3 16c-.667.667-.667 2 0 4 2 .667 3.333.667 4 0l1.5-1.5" />
    <path d="M8 16l3.5 3.5c.667.667 2 .667 4 0 .667-2 .667-3.333 0-4" />
    <path d="M18 3l3 3" />
    <path d="M14 7l-1 1" />
    <path d="M16 5l-3.5 3.5C11.833 9.167 10 9.167 7 7" />
  </svg>
);

// Define a schema for the match form
const matchFormSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  venue: z.string().min(1, "Venue is required"),
  matchDate: z.string().min(1, "Match date is required"),
  matchType: z.string().min(1, "Match type is required"),
  result: z.string().optional(),
});

// Define a schema for the performance form
const performanceFormSchema = z.object({
  runs: z.string().transform((val) => parseInt(val) || 0),
  balls: z.string().transform((val) => parseInt(val) || 0),
  fours: z.string().transform((val) => parseInt(val) || 0),
  sixes: z.string().transform((val) => parseInt(val) || 0),
  wickets: z.string().transform((val) => parseInt(val) || 0),
  oversBowled: z.string().transform((val) => parseFloat(val) || 0),
  runsConceded: z.string().transform((val) => parseInt(val) || 0),
  catches: z.string().transform((val) => parseInt(val) || 0),
  runOuts: z.string().transform((val) => parseInt(val) || 0),
});

type MatchFormValues = z.infer<typeof matchFormSchema>;
type PerformanceFormValues = z.infer<typeof performanceFormSchema>;

type PlayerWithStats = {
  user: User;
  stats: PlayerStats;
};

type MatchWithPerformances = PlayerMatch & {
  performance?: PlayerMatchPerformance;
};

export default function StatsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<number | null>(null);
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false);

  // Get player stats
  const { data: playerData, isLoading: isPlayerLoading, error: playerError } = useQuery<PlayerWithStats>({
    queryKey: [`/api/users/${user?.username}/player-stats`],
    enabled: !!user?.username,
  });

  // Get player matches
  const { data: matches, isLoading: isMatchesLoading, error: matchesError, refetch: refetchMatches } = useQuery<MatchWithPerformances[]>({
    queryKey: [`/api/users/${user?.username}/matches`],
    enabled: !!user?.username,
  });

  // Form for adding a new match
  const matchForm = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      opponent: "",
      venue: "",
      matchDate: format(new Date(), "yyyy-MM-dd"),
      matchType: "T20",
      result: "",
    },
  });

  // Form for adding match performance
  const performanceForm = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceFormSchema),
    defaultValues: {
      runs: "0",
      balls: "0",
      fours: "0",
      sixes: "0",
      wickets: "0",
      oversBowled: "0",
      runsConceded: "0",
      catches: "0",
      runOuts: "0",
    },
  });

  // Mutation for creating a new match
  const createMatchMutation = useMutation({
    mutationFn: async (data: MatchFormValues) => {
      const response = await apiRequest("POST", `/api/users/${user?.username}/matches`, {
        opponent: data.opponent,
        venue: data.venue,
        matchDate: data.matchDate,
        matchType: data.matchType,
        result: data.result || "In Progress",
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "New match added successfully",
      });
      setCreatedMatchId(data.id);
      refetchMatches();
      setIsMatchDialogOpen(false);
      setIsPerformanceDialogOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add match",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding match performance
  const addPerformanceMutation = useMutation({
    mutationFn: async (data: PerformanceFormValues) => {
      if (!createdMatchId) throw new Error("No match selected");
      
      return await apiRequest("POST", `/api/users/${user?.username}/matches/${createdMatchId}/performance`, {
        runs: data.runs,
        balls: data.balls,
        fours: data.fours,
        sixes: data.sixes,
        wickets: data.wickets,
        oversBowled: data.oversBowled,
        runsConceded: data.runsConceded,
        catches: data.catches,
        runOuts: data.runOuts,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Performance added successfully",
      });
      refetchMatches();
      setIsPerformanceDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add performance",
        variant: "destructive",
      });
    },
  });

  // Handle submitting the match form
  function onMatchSubmit(values: MatchFormValues) {
    createMatchMutation.mutate(values);
  }

  // Handle submitting the performance form
  function onPerformanceSubmit(values: PerformanceFormValues) {
    addPerformanceMutation.mutate(values);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p>Please login to view stats</p>
      </div>
    );
  }

  if (isPlayerLoading || isMatchesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner size="lg" variant="green" />
      </div>
    );
  }

  if (playerError || matchesError) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Failed to load player stats. You may need to create your player profile first.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="default"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 relative">
      {/* Cricket field background - purely decorative */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-b from-[#2E8B57]/5 to-[#2E8B57]/20 opacity-50 rounded-lg"></div>
        <div className="absolute w-[80%] h-[80%] border-[10px] border-[#2E8B57]/20 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[60%] h-[10px] bg-[#2E8B57]/20 top-1/2 left-1/2 transform -translate-x-1/2"></div>
        <div className="absolute w-[10px] h-[60%] bg-[#2E8B57]/20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Player Header */}
        <div className="flex flex-col md:flex-row items-center mb-8 bg-white p-6 rounded-lg shadow-md">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-[#2E8B57] mb-4 md:mb-0 md:mr-6">
            <AvatarImage 
              src={user.profileImage || "https://github.com/shadcn.png"} 
              alt={user.username} 
            />
            <AvatarFallback className="bg-[#2E8B57] text-white text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold cricket-primary mb-1">{user.fullName || user.username}</h1>
            <p className="text-[#2E8B57] font-medium mb-3">@{user.username}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center">
                <Bat className="w-5 h-5 text-[#2E8B57] mr-2" />
                <span className="text-sm font-medium">Batsman</span>
              </div>
              <div className="flex items-center">
                <Cricket className="w-5 h-5 text-[#2E8B57] mr-2" />
                <span className="text-sm font-medium">All-rounder</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-[#2E8B57] mr-2" />
                <span className="text-sm font-medium">{user.location || "Location not specified"}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="default"
            className="mt-4 md:mt-0 bg-[#2E8B57] hover:bg-[#1F3B4D]"
            onClick={() => setIsMatchDialogOpen(true)}
          >
            Add Match
          </Button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Batting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Matches</span>
                  <span className="font-semibold">{playerData?.stats?.matchesPlayed || matches?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Runs</span>
                  <span className="font-semibold">{playerData?.stats?.totalRuns || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average</span>
                  <span className="font-semibold">{playerData?.stats?.battingAverage?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Strike Rate</span>
                  <span className="font-semibold">{playerData?.stats?.strikeRate?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Bowling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wickets</span>
                  <span className="font-semibold">{playerData?.stats?.totalWickets || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Economy</span>
                  <span className="font-semibold">{playerData?.stats?.economy?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average</span>
                  <span className="font-semibold">{playerData?.stats?.bowlingAverage?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Best Figures</span>
                  <span className="font-semibold">{playerData?.stats?.bestBowlingFigures || "0/0"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Batting Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">50s</span>
                  <span className="font-semibold">{playerData?.stats?.fifties || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">100s</span>
                  <span className="font-semibold">{playerData?.stats?.hundreds || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">4s</span>
                  <span className="font-semibold">{playerData?.stats?.fours || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">6s</span>
                  <span className="font-semibold">{playerData?.stats?.sixes || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Fielding & More</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Catches</span>
                  <span className="font-semibold">{playerData?.stats?.catches || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Run Outs</span>
                  <span className="font-semibold">{playerData?.stats?.runOuts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Player of Match</span>
                  <span className="font-semibold">{playerData?.stats?.playerOfMatchAwards || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Highest Score</span>
                  <span className="font-semibold">{playerData?.stats?.highestScore || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Match Form Dialog */}
        <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Match</DialogTitle>
              <DialogDescription>
                Enter the details of your cricket match
              </DialogDescription>
            </DialogHeader>
            
            <Form {...matchForm}>
              <form onSubmit={matchForm.handleSubmit(onMatchSubmit)} className="space-y-4">
                <FormField
                  control={matchForm.control}
                  name="opponent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opponent Team</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Super Kings" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={matchForm.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Local Cricket Ground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={matchForm.control}
                  name="matchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={matchForm.control}
                  name="matchType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Type</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        >
                          <option value="T20">T20</option>
                          <option value="ODI">ODI</option>
                          <option value="Test">Test</option>
                          <option value="Friendly">Friendly</option>
                          <option value="Club">Club</option>
                          <option value="Other">Other</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={matchForm.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Won by 5 wickets" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank if match is upcoming or in progress
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsMatchDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#2E8B57] hover:bg-[#1F3B4D] text-white"
                    disabled={createMatchMutation.isPending}
                  >
                    {createMatchMutation.isPending && (
                      <Spinner className="mr-2 h-4 w-4" />
                    )}
                    Add Match
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Performance Form Dialog */}
        <Dialog open={isPerformanceDialogOpen} onOpenChange={setIsPerformanceDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Match Performance</DialogTitle>
              <DialogDescription>
                Enter your performance details for this match
              </DialogDescription>
            </DialogHeader>
            
            <Form {...performanceForm}>
              <form onSubmit={performanceForm.handleSubmit(onPerformanceSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={performanceForm.control}
                    name="runs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Runs Scored</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="balls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balls Faced</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="fours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>4s</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="sixes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6s</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="wickets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wickets Taken</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="oversBowled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overs Bowled</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="runsConceded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Runs Conceded</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="catches"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catches</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="runOuts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Run Outs</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPerformanceDialogOpen(false)}
                  >
                    Skip
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#2E8B57] hover:bg-[#1F3B4D] text-white"
                    disabled={addPerformanceMutation.isPending}
                  >
                    {addPerformanceMutation.isPending && (
                      <Spinner className="mr-2 h-4 w-4" />
                    )}
                    Save Performance
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Tabs for Recent Matches and Stats */}
        <Tabs defaultValue="recent-matches" className="bg-white rounded-lg shadow-md">
          <TabsList className="w-full border-b p-0 h-auto">
            <TabsTrigger 
              value="recent-matches" 
              className="flex-1 py-3 rounded-none rounded-tl-lg data-[state=active]:border-b-2 data-[state=active]:border-[#2E8B57]"
            >
              Recent Matches
            </TabsTrigger>
            <TabsTrigger 
              value="performance-trends" 
              className="flex-1 py-3 rounded-none rounded-tr-lg data-[state=active]:border-b-2 data-[state=active]:border-[#2E8B57]"
            >
              Performance Trends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent-matches" className="p-4">
            {matches && matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.id} className="overflow-hidden border-[#2E8B57]/20">
                    <div className="bg-[#2E8B57]/10 px-4 py-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <Flag className="w-4 h-4 text-[#2E8B57] mr-2" />
                        <span className="font-medium cricket-primary">{match.matchType}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-[#2E8B57] mr-2" />
                        <span className="text-sm">{format(new Date(match.matchDate), "dd MMM yyyy")}</span>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg cricket-primary mb-1">
                            {user.username} vs {match.opponent}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            {match.venue}
                          </div>
                        </div>
                        
                        <div className="mt-2 md:mt-0">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            match.result === "Won" 
                              ? "bg-green-100 text-green-800" 
                              : match.result === "Lost"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {match.result}
                          </span>
                        </div>
                      </div>
                      
                      {match.performance ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="space-y-2 border-r border-gray-200 pr-4">
                            <h4 className="font-medium text-[#2E8B57]">Batting</h4>
                            <div className="flex justify-between">
                              <span className="text-sm">Runs</span>
                              <span className="font-medium">{match.performance.runs}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Balls</span>
                              <span className="font-medium">{match.performance.balls}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">4s / 6s</span>
                              <span className="font-medium">{match.performance.fours} / {match.performance.sixes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Strike Rate</span>
                              <span className="font-medium">
                                {match.performance.balls > 0 
                                  ? ((match.performance.runs / match.performance.balls) * 100).toFixed(2) 
                                  : "0.00"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 border-r border-gray-200 pr-4">
                            <h4 className="font-medium text-[#2E8B57]">Bowling</h4>
                            <div className="flex justify-between">
                              <span className="text-sm">Wickets</span>
                              <span className="font-medium">{match.performance.wickets}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Overs</span>
                              <span className="font-medium">{match.performance.oversBowled}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Runs Conceded</span>
                              <span className="font-medium">{match.performance.runsConceded}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Economy</span>
                              <span className="font-medium">
                                {match.performance.oversBowled > 0 
                                  ? (match.performance.runsConceded / match.performance.oversBowled).toFixed(2) 
                                  : "0.00"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium text-[#2E8B57]">Fielding</h4>
                            <div className="flex justify-between">
                              <span className="text-sm">Catches</span>
                              <span className="font-medium">{match.performance.catches}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Run Outs</span>
                              <span className="font-medium">{match.performance.runOuts}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 text-center py-4 bg-gray-50 rounded-md">
                          <p className="text-sm text-muted-foreground">No performance data available for this match</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium mb-2">No match data available</h3>
                <p className="text-muted-foreground mb-4">Add your match details to start tracking your cricket performance</p>
                <Button 
                  variant="default"
                  className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
                  onClick={() => setIsMatchDialogOpen(true)}
                >
                  Add Your First Match
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance-trends" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 border-[#2E8B57]/20">
                <CardTitle className="text-lg cricket-primary mb-4">Batting Performance</CardTitle>
                <CardDescription className="mb-4">
                  Your batting performance has been tracked across all your matches
                </CardDescription>
                
                <div className="h-64 flex items-center justify-center bg-[#2E8B57]/5 rounded-md">
                  <p className="text-center text-muted-foreground">
                    Batting performance chart will appear here as you add more matches
                  </p>
                </div>
              </Card>
              
              <Card className="p-4 border-[#2E8B57]/20">
                <CardTitle className="text-lg cricket-primary mb-4">Bowling Analysis</CardTitle>
                <CardDescription className="mb-4">
                  Your bowling statistics and economy rate across matches
                </CardDescription>
                
                <div className="h-64 flex items-center justify-center bg-[#2E8B57]/5 rounded-md">
                  <p className="text-center text-muted-foreground">
                    Bowling analysis chart will appear here as you add more matches
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Match Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Match</DialogTitle>
            <DialogDescription>
              Enter the details about your cricket match.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...matchForm}>
            <form onSubmit={matchForm.handleSubmit(onMatchSubmit)} className="space-y-4">
              <FormField
                control={matchForm.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter opponent name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={matchForm.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="Match location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={matchForm.control}
                  name="matchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={matchForm.control}
                  name="matchType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Type</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="T20">T20</option>
                          <option value="ODI">ODI</option>
                          <option value="Test">Test</option>
                          <option value="Club">Club</option>
                          <option value="Friendly">Friendly</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={matchForm.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                        <option value="Draw">Draw</option>
                        <option value="Abandoned">Abandoned</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createMatchMutation.isPending}
                  className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
                >
                  {createMatchMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : 
                    "Save Match"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Performance Dialog */}
      <Dialog open={isPerformanceDialogOpen} onOpenChange={setIsPerformanceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Your Performance</DialogTitle>
            <DialogDescription>
              Enter your performance details for this match.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...performanceForm}>
            <form onSubmit={performanceForm.handleSubmit(onPerformanceSubmit)} className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium text-[#2E8B57]">Batting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={performanceForm.control}
                    name="runs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Runs</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="balls"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balls</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={performanceForm.control}
                    name="fours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>4s</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="sixes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6s</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                <h3 className="font-medium text-[#2E8B57]">Bowling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={performanceForm.control}
                    name="wickets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wickets</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="oversBowled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overs</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={performanceForm.control}
                  name="runsConceded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Runs Conceded</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4 pt-2">
                <h3 className="font-medium text-[#2E8B57]">Fielding</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={performanceForm.control}
                    name="catches"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catches</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={performanceForm.control}
                    name="runOuts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Run Outs</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPerformanceDialogOpen(false)}
                  className="mr-2"
                >
                  Skip
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPerformanceMutation.isPending}
                  className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
                >
                  {addPerformanceMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : 
                    "Save Performance"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}