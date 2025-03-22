import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { PlayerStats as DbPlayerStats, PlayerMatch, PlayerMatchPerformance, User } from "@shared/schema";

// Extended interface for PlayerStats to match our UI needs
interface PlayerStats extends DbPlayerStats {
  matches?: number;
  innings?: number;
  notOuts?: number;
  wickets?: number;
  ballsFaced?: number;
  oversBowled?: number;
  runsConceded?: number;
  bestBowlingFigures?: string;
  fifties?: number;
  hundreds?: number;
  fours?: number;
  sixes?: number;
  catches?: number;
  runOuts?: number;
  playerOfMatchAwards?: number;
  highestScoreNotOut?: boolean;
}
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Award, Calendar, Clock, Flag, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const matchFormSchema = z.object({
  opponent: z.string().min(1, "Opponent is required"),
  venue: z.string().min(1, "Venue is required"),
  matchDate: z.string().min(1, "Match date is required"),
  matchType: z.string().min(1, "Match type is required"),
  teamScore: z.string().min(1, "Your team's score is required"),
  opponentScore: z.string().min(1, "Opponent's score is required"),
  result: z.string().min(1, "Result is required"),
});

type PlayerWithStats = {
  user: User;
  stats: PlayerStats;
};

type MatchFormValues = z.infer<typeof matchFormSchema>;

type MatchWithPerformances = PlayerMatch & {
  performance?: PlayerMatchPerformance & {
    runs?: number;
    notOut?: boolean;
    wickets?: number;
  };
  date?: string;
  matchTitle?: string;
  overs?: string;
  format?: string;
};

export default function StatsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  
  // Form for adding a new match
  const matchForm = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      opponent: "",
      venue: "",
      matchDate: format(new Date(), "yyyy-MM-dd"),
      matchType: "T20",
      teamScore: "",
      opponentScore: "",
      result: "Win",
    },
  });
  
  // Handle match form submission
  function onMatchSubmit(values: MatchFormValues) {
    if (!user) return;
    
    // Send the matchDate directly as a string in ISO format, which the server can parse
    const matchData = {
      userId: user.id,
      opponent: values.opponent,
      venue: values.venue,
      matchDate: values.matchDate, // Send as string for the API to handle
      matchType: values.matchType,
      result: values.result,
      matchName: `${user.username} vs ${values.opponent}`,
      teamScore: values.teamScore,
      opponentScore: values.opponentScore,
    };
    
    console.log('Submitting match data:', matchData);
    addMatchMutation.mutate(matchData);
  }

  // Fetch player stats
  const { data: dbPlayerStats, isLoading: isStatsLoading } = useQuery<DbPlayerStats>({
    queryKey: ['/api/users', user?.username, 'player-stats'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });
  
  // Create an enhanced player stats object with our needed UI fields
  const playerStats: PlayerStats | undefined = dbPlayerStats ? {
    ...dbPlayerStats,
    matches: dbPlayerStats.totalMatches || 0,
    innings: 0, // We'll need to add this to the database later
    notOuts: 0, // We'll need to add this to the database later
    wickets: dbPlayerStats.totalWickets || 0,
    ballsFaced: 0, // We'll need to add this to the database later
    oversBowled: 0, // We'll need to add this to the database later
    runsConceded: 0, // We'll need to add this to the database later
    bestBowlingFigures: dbPlayerStats.bestBowling || "0/0",
    fifties: 0, // We'll need to add this to the database later
    hundreds: 0, // We'll need to add this to the database later
    fours: dbPlayerStats.totalFours || 0,
    sixes: dbPlayerStats.totalSixes || 0,
    catches: dbPlayerStats.totalCatches || 0,
    runOuts: 0, // We'll need to add this to the database later
    playerOfMatchAwards: 0, // We'll need to add this to the database later
    highestScoreNotOut: false // We'll need to add this to the database later
  } : undefined;
  
  // Fetch recent matches
  const { data: dbMatches, isLoading: isMatchesLoading } = useQuery<PlayerMatch[]>({
    queryKey: ['/api/users', user?.username, 'matches'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });
  
  // Create enhanced matches with the fields we need for UI
  const matches: MatchWithPerformances[] = dbMatches ? dbMatches.map(match => ({
    ...match,
    date: match.matchDate ? match.matchDate.toString() : "",
    matchTitle: match.matchName,
    overs: match.matchType?.includes('T20') ? '20' : match.matchType?.includes('ODI') ? '50' : 'Full',
    format: match.matchType || 'T20',
    performance: {
      id: 0, // Placeholder
      userId: user.id,
      matchId: match.id,
      runsScored: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      battingStatus: '',
      oversBowled: '0',
      runsConceded: 0,
      wicketsTaken: 0,
      maidens: 0,
      catches: 0,
      runOuts: 0,
      stumpings: 0,
      createdAt: null,
      // UI-specific fields
      runs: 0,
      notOut: false,
      wickets: 0
    }
  })) : [];

  // Add a new match performance
  const addMatchMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/player-matches", data);
    },
    onSuccess: () => {
      toast({
        title: "Match added",
        description: "Your match has been added successfully"
      });
      
      // Reset form
      matchForm.reset({
        opponent: "",
        venue: "",
        matchDate: format(new Date(), "yyyy-MM-dd"),
        matchType: "T20",
        teamScore: "",
        opponentScore: "",
        result: "Win",
      });
      
      // Close dialog
      setIsAddMatchDialogOpen(false);
      
      // Invalidate queries to reload data
      queryClient.invalidateQueries({
        queryKey: ['/api/users', user?.username, 'matches']
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/users', user?.username, 'player-stats']
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add match",
        variant: "destructive"
      });
    }
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p>Please login to view stats</p>
      </div>
    );
  }
  
  const isLoading = isStatsLoading || isMatchesLoading;

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 relative">
      {/* Cricket field background - enhanced with realistic cricket field elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Main field gradient */}
        <div className="w-full h-full bg-gradient-to-b from-[#2E8B57]/5 to-[#2E8B57]/20 opacity-70 rounded-lg"></div>
        
        {/* Outer boundary */}
        <div className="absolute w-[90%] h-[90%] border-[12px] border-[#2E8B57]/30 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* 30-yard circle */}
        <div className="absolute w-[70%] h-[70%] border-[8px] border-[#2E8B57]/20 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Pitch */}
        <div className="absolute w-[20%] h-[60%] bg-[#C19A6B]/20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-[4px] border-[#2E8B57]/30"></div>
        
        {/* Pitch creases */}
        <div className="absolute w-[20%] h-[4px] bg-white/50 top-[35%] left-1/2 transform -translate-x-1/2"></div>
        <div className="absolute w-[20%] h-[4px] bg-white/50 top-[65%] left-1/2 transform -translate-x-1/2"></div>
        
        {/* Middle stump line */}
        <div className="absolute w-[4px] h-[60%] bg-white/30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Wickets */}
        <div className="absolute w-[6%] h-[6px] bg-[#D2B48C] top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[6%] h-[6px] bg-[#D2B48C] top-[65%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Shadow effect for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-[#1F3B4D]/10 opacity-40"></div>
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
                <Award className="w-5 h-5 text-[#2E8B57] mr-2" />
                <span className="text-sm font-medium">Batsman</span>
              </div>
              <div className="flex items-center">
                <Award className="w-5 h-5 text-[#2E8B57] mr-2" />
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
            onClick={() => setIsAddMatchDialogOpen(true)}
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
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Matches</span>
                    <span className="font-semibold">{playerStats?.matches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Runs</span>
                    <span className="font-semibold">{playerStats?.totalRuns || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average</span>
                    <span className="font-semibold">
                      {playerStats && playerStats.matches > 0
                        ? (playerStats.totalRuns / (playerStats.innings - playerStats.notOuts || 1)).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Strike Rate</span>
                    <span className="font-semibold">
                      {playerStats && playerStats.ballsFaced > 0
                        ? ((playerStats.totalRuns / playerStats.ballsFaced) * 100).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Bowling</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Wickets</span>
                    <span className="font-semibold">{playerStats?.wickets || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Economy</span>
                    <span className="font-semibold">
                      {playerStats && playerStats.oversBowled > 0
                        ? (playerStats.runsConceded / playerStats.oversBowled).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average</span>
                    <span className="font-semibold">
                      {playerStats && playerStats.wickets > 0
                        ? (playerStats.runsConceded / playerStats.wickets).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Best Figures</span>
                    <span className="font-semibold">
                      {playerStats?.bestBowlingFigures || "0/0"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Batting Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">50s</span>
                    <span className="font-semibold">{playerStats?.fifties || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">100s</span>
                    <span className="font-semibold">{playerStats?.hundreds || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">4s</span>
                    <span className="font-semibold">{playerStats?.fours || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">6s</span>
                    <span className="font-semibold">{playerStats?.sixes || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Fielding & More</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Catches</span>
                    <span className="font-semibold">{playerStats?.catches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Run Outs</span>
                    <span className="font-semibold">{playerStats?.runOuts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Player of Match</span>
                    <span className="font-semibold">{playerStats?.playerOfMatchAwards || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Highest Score</span>
                    <span className="font-semibold">{playerStats?.highestScore || 0}{playerStats?.highestScoreNotOut ? '*' : ''}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
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
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-100 p-4 rounded-md">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {matches && matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <Card key={match.id} className="overflow-hidden border-[#2E8B57]/20">
                        <div className="flex bg-[#2E8B57]/10 p-2 items-center">
                          <Calendar className="h-4 w-4 text-[#2E8B57] mr-2" />
                          <span className="text-sm font-medium">
                            {match.date ? format(new Date(match.date), 'PPP') : 'Date not available'}
                          </span>
                          <div className="mx-2 text-gray-400">•</div>
                          <MapPin className="h-4 w-4 text-[#2E8B57] mr-2" />
                          <span className="text-sm">{match.venue || 'Venue not specified'}</span>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-lg font-semibold mb-2">{match.matchTitle || 'Cricket Match'}</h3>
                          <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>{match.overs || '20'} overs</span>
                            </div>
                            <div className="flex items-center">
                              <Flag className="h-4 w-4 mr-2" />
                              <span>{match.format || 'T20'}</span>
                            </div>
                          </div>
                          
                          {match.performance && (
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                              <div>
                                <h4 className="font-medium mb-1 text-[#2E8B57]">Batting</h4>
                                <p className="grid grid-cols-2 gap-1">
                                  <span className="text-muted-foreground">Runs:</span>
                                  <span className="font-medium">{match.performance.runs || 0} 
                                    {match.performance.notOut ? '*' : ''}
                                  </span>
                                </p>
                                <p className="grid grid-cols-2 gap-1">
                                  <span className="text-muted-foreground">Balls:</span>
                                  <span className="font-medium">{match.performance.ballsFaced || 0}</span>
                                </p>
                                <p className="grid grid-cols-2 gap-1">
                                  <span className="text-muted-foreground">4s / 6s:</span>
                                  <span className="font-medium">{match.performance.fours || 0} / {match.performance.sixes || 0}</span>
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-1 text-[#2E8B57]">Bowling</h4>
                                <p className="grid grid-cols-2 gap-1">
                                  <span className="text-muted-foreground">Wickets:</span>
                                  <span className="font-medium">{match.performance.wickets || 0}</span>
                                </p>
                                <p className="grid grid-cols-2 gap-1">
                                  <span className="text-muted-foreground">Overs:</span>
                                  <span className="font-medium">{match.performance.oversBowled || 0}</span>
                                </p>
                                <p className="grid grid-cols-2 gap-1">
                                  <span className="text-muted-foreground">Runs:</span>
                                  <span className="font-medium">{match.performance.runsConceded || 0}</span>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {match.result && (
                          <div className="border-t p-3 bg-[#2E8B57]/5">
                            <p className="text-sm">
                              <span className="font-medium text-[#2E8B57]">Result:</span> {match.result}
                            </p>
                          </div>
                        )}
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
                      onClick={() => setIsAddMatchDialogOpen(true)}
                    >
                      Add Your First Match
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="performance-trends" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 border-[#2E8B57]/20">
                <CardTitle className="text-lg cricket-primary mb-4">Batting Performance</CardTitle>
                <CardDescription className="mb-4">
                  Your batting performance will be tracked across all your matches
                </CardDescription>
                
                <div className="h-64 flex items-center justify-center bg-[#2E8B57]/5 rounded-md">
                  <p className="text-center text-muted-foreground">
                    Batting performance chart will appear here as you add matches
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
                    Bowling analysis chart will appear here as you add matches
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Match Dialog */}
      <Dialog open={isAddMatchDialogOpen} onOpenChange={setIsAddMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Match</DialogTitle>
            <DialogDescription>
              Add details about your cricket match to track your performance stats.
            </DialogDescription>
          </DialogHeader>
          
          {/* Match Form */}
          <Form {...matchForm}>
            <form onSubmit={matchForm.handleSubmit(onMatchSubmit)} className="space-y-4">
              <FormField
                control={matchForm.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent Team</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter opponent team name" {...field} />
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
                      <Input placeholder="Enter match venue" {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select match type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="T20">T20</SelectItem>
                        <SelectItem value="ODI">ODI</SelectItem>
                        <SelectItem value="Test">Test</SelectItem>
                        <SelectItem value="One Day">One Day</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={matchForm.control}
                name="teamScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Team Score</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., '150/6'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={matchForm.control}
                name="opponentScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent Score</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., '142/8'" {...field} />
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
                    <FormLabel>Result</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select match result" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Win">Win</SelectItem>
                        <SelectItem value="Loss">Loss</SelectItem>
                        <SelectItem value="Draw">Draw</SelectItem>
                        <SelectItem value="Tie">Tie</SelectItem>
                        <SelectItem value="No Result">No Result</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddMatchDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
                  disabled={addMatchMutation.isPending}
                >
                  {addMatchMutation.isPending ? "Adding..." : "Add Match"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}