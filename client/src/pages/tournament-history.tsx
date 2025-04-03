import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import {
  Trophy,
  Calendar,
  ChevronRight,
  Award,
  Medal,
  Users,
  Map,
  BarChart3,
  TrendingUp,
  Flame,
  CircleDashed
} from "lucide-react";

// Interface for tournament data
interface Tournament {
  id: number;
  name: string;
  shortName: string;
  description?: string;
  startDate: string;
  endDate: string;
  tournamentType: "league" | "knockout" | "group_stage_knockout";
  format: "T20" | "ODI" | "Test" | "other";
  status: "upcoming" | "ongoing" | "completed";
  logoUrl?: string;
  winner?: {
    teamId: number;
    teamName: string;
    teamLogo?: string;
  };
  runnerUp?: {
    teamId: number;
    teamName: string;
    teamLogo?: string;
  };
}

// Interface for tournament statistics
interface TournamentStats {
  totalMatches: number;
  completedMatches: number;
  totalRuns: number;
  totalWickets: number;
  highestTeamScore: {
    score: number;
    team: {
      id: number;
      name: string;
      shortName: string;
    };
  };
  mostValuablePlayer?: {
    id: number;
    name: string;
    teamId: number;
    teamName: string;
    runs: number;
    wickets: number;
  };
}

// Interface for team standings
interface TeamStanding {
  teamId: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    logo?: string;
  };
  position: number;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
}

// Interface for player stats
interface PlayerStats {
  userId: number;
  userName: string;
  teamId: number;
  teamName: string;
  teamLogo?: string;
  matches: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
  economy?: number;
  fifties?: number;
  hundreds?: number;
  bestBowling?: string;
}

export default function TournamentHistory() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Query to get all tournaments
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/tournaments/history'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/tournaments/history');
      } catch (error) {
        console.error('Error fetching tournament history:', error);
        return [];
      }
    }
  });

  // Query to get selected tournament details
  const { data: tournamentDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/tournaments', selectedTournament?.id, 'details'],
    queryFn: async () => {
      if (!selectedTournament) return null;
      try {
        return await apiRequest('GET', `/api/tournaments/${selectedTournament.id}/details`);
      } catch (error) {
        console.error('Error fetching tournament details:', error);
        return null;
      }
    },
    enabled: !!selectedTournament
  });

  // Query to get selected tournament stats
  const { data: tournamentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/tournaments', selectedTournament?.id, 'stats'],
    queryFn: async () => {
      if (!selectedTournament) return null;
      try {
        return await apiRequest('GET', `/api/tournaments/${selectedTournament.id}/stats`);
      } catch (error) {
        console.error('Error fetching tournament stats:', error);
        return null;
      }
    },
    enabled: !!selectedTournament
  });

  // Query to get selected tournament standings
  const { data: tournamentStandings, isLoading: standingsLoading } = useQuery({
    queryKey: ['/api/tournaments', selectedTournament?.id, 'standings'],
    queryFn: async () => {
      if (!selectedTournament) return null;
      try {
        return await apiRequest('GET', `/api/tournaments/${selectedTournament.id}/standings`);
      } catch (error) {
        console.error('Error fetching tournament standings:', error);
        return null;
      }
    },
    enabled: !!selectedTournament
  });

  // Query to get selected tournament top performers
  const { data: topPerformers, isLoading: performersLoading } = useQuery({
    queryKey: ['/api/tournaments', selectedTournament?.id, 'top-performers'],
    queryFn: async () => {
      if (!selectedTournament) return null;
      try {
        return await apiRequest('GET', `/api/tournaments/${selectedTournament.id}/top-performers`);
      } catch (error) {
        console.error('Error fetching top performers:', error);
        return null;
      }
    },
    enabled: !!selectedTournament
  });

  // Filtered tournaments based on selected year and format
  const filteredTournaments = tournaments ? tournaments.filter((tournament: Tournament) => {
    // Filter by year
    const yearMatch = selectedYear === "all" || 
      (tournament.startDate && new Date(tournament.startDate).getFullYear().toString() === selectedYear);
    
    // Filter by format
    const formatMatch = selectedFormat === "all" || tournament.format === selectedFormat;
    
    return yearMatch && formatMatch;
  }) : [];

  // Get unique years from tournaments
  const years = tournaments ? Array.from(new Set(
    tournaments.map((t: Tournament) => 
      t.startDate ? new Date(t.startDate).getFullYear().toString() : "")
  )).filter(year => year !== "") : [];
  
  // Sort years in descending order
  years.sort((a, b) => parseInt(b) - parseInt(a));

  // Handle tournament selection
  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setActiveTab("overview");
  };

  // Handle back button click
  const handleBackToList = () => {
    setSelectedTournament(null);
  };

  // Render tournament card
  const renderTournamentCard = (tournament: Tournament) => (
    <Card key={tournament.id} className="mb-4 hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => handleSelectTournament(tournament)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {tournament.logoUrl ? (
              <div className="w-12 h-12 mr-3">
                <img src={tournament.logoUrl} alt={tournament.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <Trophy className="w-10 h-10 mr-3 text-primary" />
            )}
            <div>
              <CardTitle className="text-xl">{tournament.name}</CardTitle>
              <CardDescription>
                {tournament.startDate && tournament.endDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </div>
                )}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center">
            {renderStatusBadge(tournament.status)}
            <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          <div>
            <span className="text-xs text-muted-foreground">Format</span>
            <p className="font-medium">{formatTournamentFormat(tournament.format)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Type</span>
            <p className="font-medium">{formatTournamentType(tournament.tournamentType)}</p>
          </div>
          {tournament.status === "completed" && tournament.winner && (
            <div className="col-span-2">
              <span className="text-xs text-muted-foreground">Winner</span>
              <p className="font-medium flex items-center">
                <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                {tournament.winner.teamName}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render tournament details view
  const renderTournamentDetails = () => {
    if (!selectedTournament) return null;

    return (
      <div>
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToList} className="mb-4">
            &larr; Back to tournaments
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {selectedTournament.logoUrl ? (
                <div className="w-16 h-16 mr-4">
                  <img src={selectedTournament.logoUrl} alt={selectedTournament.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <Trophy className="w-12 h-12 mr-4 text-primary" />
              )}
              <div>
                <h1 className="text-2xl font-bold">{selectedTournament.name}</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(selectedTournament.startDate).toLocaleDateString()} - {new Date(selectedTournament.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div>
              {renderStatusBadge(selectedTournament.status)}
            </div>
          </div>
          
          {selectedTournament.description && (
            <p className="mt-4 text-muted-foreground">{selectedTournament.description}</p>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {renderOverviewTab()}
          </TabsContent>
          
          <TabsContent value="standings">
            {renderStandingsTab()}
          </TabsContent>
          
          <TabsContent value="stats">
            {renderStatsTab()}
          </TabsContent>
          
          <TabsContent value="matches">
            {renderMatchesTab()}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Render overview tab
  const renderOverviewTab = () => {
    if (detailsLoading || !tournamentDetails) {
      return (
        <div className="text-center py-12">
          <CircleDashed className="animate-spin h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading tournament details...</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selectedTournament.status === "completed" && selectedTournament.winner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Champion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {selectedTournament.winner.teamLogo ? (
                  <div className="w-20 h-20 mr-4">
                    <img src={selectedTournament.winner.teamLogo} alt={selectedTournament.winner.teamName} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 mr-4 bg-primary/10 flex items-center justify-center rounded-full">
                    <Trophy className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedTournament.winner.teamName}</h3>
                  <p className="text-muted-foreground">Champion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {selectedTournament.status === "completed" && selectedTournament.runnerUp && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Medal className="h-5 w-5 mr-2 text-gray-400" />
                Runner Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {selectedTournament.runnerUp.teamLogo ? (
                  <div className="w-20 h-20 mr-4">
                    <img src={selectedTournament.runnerUp.teamLogo} alt={selectedTournament.runnerUp.teamName} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-20 mr-4 bg-primary/10 flex items-center justify-center rounded-full">
                    <Medal className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedTournament.runnerUp.teamName}</h3>
                  <p className="text-muted-foreground">Runner Up</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Tournament Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournamentStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Matches</p>
                  <p className="text-2xl font-bold">{tournamentStats.totalMatches}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-2xl font-bold">{tournamentStats.totalRuns.toLocaleString()}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Wickets</p>
                  <p className="text-2xl font-bold">{tournamentStats.totalWickets}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Highest Team Score</p>
                  <p className="text-2xl font-bold">{tournamentStats.highestTeamScore.score}</p>
                  <p className="text-xs text-muted-foreground">{tournamentStats.highestTeamScore.team.name}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Statistics not available</p>
            )}
          </CardContent>
        </Card>
        
        {tournamentStats?.mostValuablePlayer && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-amber-500" />
                Most Valuable Player
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="w-16 h-16 mr-4 bg-primary/10 flex items-center justify-center rounded-full">
                  <Award className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{tournamentStats.mostValuablePlayer.name}</h3>
                  <p className="text-muted-foreground">{tournamentStats.mostValuablePlayer.teamName}</p>
                  <div className="flex mt-2">
                    <div className="mr-4">
                      <span className="text-sm text-muted-foreground">Runs</span>
                      <p className="font-medium">{tournamentStats.mostValuablePlayer.runs}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Wickets</span>
                      <p className="font-medium">{tournamentStats.mostValuablePlayer.wickets}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render standings tab
  const renderStandingsTab = () => {
    if (standingsLoading || !tournamentStandings) {
      return (
        <div className="text-center py-12">
          <CircleDashed className="animate-spin h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading standings...</p>
        </div>
      );
    }

    if (!tournamentStandings.length) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No standings available for this tournament</p>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Tournament Standings</CardTitle>
          <CardDescription>Final standings for the tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Pos</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">T</TableHead>
                  <TableHead className="text-center">NR</TableHead>
                  <TableHead className="text-center">Pts</TableHead>
                  <TableHead className="text-center">NRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournamentStandings.map((standing: TeamStanding) => (
                  <TableRow key={standing.teamId} className={standing.position <= 4 ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">{standing.position}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {standing.team.logo ? (
                          <div className="w-6 h-6 mr-2">
                            <img src={standing.team.logo} alt={standing.team.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <Users className="w-5 h-5 mr-2 text-muted-foreground" />
                        )}
                        {standing.team.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{standing.played}</TableCell>
                    <TableCell className="text-center">{standing.won}</TableCell>
                    <TableCell className="text-center">{standing.lost}</TableCell>
                    <TableCell className="text-center">{standing.tied}</TableCell>
                    <TableCell className="text-center">{standing.noResult}</TableCell>
                    <TableCell className="text-center font-bold">{standing.points}</TableCell>
                    <TableCell className="text-center">{standing.nrr.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  // Render stats tab
  const renderStatsTab = () => {
    if (performersLoading || !topPerformers) {
      return (
        <div className="text-center py-12">
          <CircleDashed className="animate-spin h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading statistics...</p>
        </div>
      );
    }

    if (!topPerformers.topRunScorers || !topPerformers.topWicketTakers) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No statistics available for this tournament</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Top Run Scorers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">Runs</TableHead>
                    <TableHead className="text-center">Avg</TableHead>
                    <TableHead className="text-center">SR</TableHead>
                    <TableHead className="text-center">50s/100s</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.topRunScorers.map((player: PlayerStats, index: number) => (
                    <TableRow key={player.userId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{player.userName}</div>
                          <div className="text-xs text-muted-foreground">{player.teamName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">{player.runs}</TableCell>
                      <TableCell className="text-center">{player.average?.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{player.strikeRate?.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{player.fifties}/{player.hundreds}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flame className="h-5 w-5 mr-2 text-red-500" />
              Top Wicket Takers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">Wickets</TableHead>
                    <TableHead className="text-center">Econ</TableHead>
                    <TableHead className="text-center">Avg</TableHead>
                    <TableHead className="text-center">Best</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.topWicketTakers.map((player: PlayerStats, index: number) => (
                    <TableRow key={player.userId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{player.userName}</div>
                          <div className="text-xs text-muted-foreground">{player.teamName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">{player.wickets}</TableCell>
                      <TableCell className="text-center">{player.economy?.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{player.average?.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{player.bestBowling}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render matches tab
  const renderMatchesTab = () => {
    if (!tournamentDetails || !tournamentDetails.matches) {
      return (
        <div className="text-center py-12">
          <CircleDashed className="animate-spin h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading matches...</p>
        </div>
      );
    }

    if (!tournamentDetails.matches.length) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No matches available for this tournament</p>
        </div>
      );
    }

    // Group matches by stage
    const matchesByStage: Record<string, any[]> = {};

    tournamentDetails.matches.forEach((match: any) => {
      const stage = match.stage || "league";
      if (!matchesByStage[stage]) {
        matchesByStage[stage] = [];
      }
      matchesByStage[stage].push(match);
    });

    return (
      <div className="space-y-6">
        {Object.entries(matchesByStage).map(([stage, matches]) => (
          <Card key={stage}>
            <CardHeader>
              <CardTitle>{formatStage(stage)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="space-y-4">
                  {matches.map((match: any) => (
                    <Card key={match.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(match.date).toLocaleDateString()} • {match.time}
                          </div>
                          <div>
                            {renderMatchStatusBadge(match.result?.status || 'scheduled')}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center flex-1">
                            {match.team1?.logo ? (
                              <div className="w-8 h-8 mr-2">
                                <img src={match.team1.logo} alt={match.team1.name} className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 mr-2 bg-primary/10 flex items-center justify-center rounded-full">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{match.team1?.name || "TBD"}</p>
                              {match.result?.team1Score && (
                                <p className={`text-sm ${match.result.winnerId === match.team1Id ? "font-bold" : ""}`}>
                                  {match.result.team1Score}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mx-2 text-center">
                            <span className="text-lg font-bold">vs</span>
                          </div>
                          
                          <div className="flex items-center flex-1 justify-end text-right">
                            <div>
                              <p className="font-medium">{match.team2?.name || "TBD"}</p>
                              {match.result?.team2Score && (
                                <p className={`text-sm ${match.result.winnerId === match.team2Id ? "font-bold" : ""}`}>
                                  {match.result.team2Score}
                                </p>
                              )}
                            </div>
                            {match.team2?.logo ? (
                              <div className="w-8 h-8 ml-2">
                                <img src={match.team2.logo} alt={match.team2.name} className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 ml-2 bg-primary/10 flex items-center justify-center rounded-full">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {match.result?.description && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {match.result.description}
                          </div>
                        )}
                        
                        <div className="mt-2 text-xs text-muted-foreground flex items-center">
                          <Map className="h-3 w-3 mr-1" />
                          {match.venue?.name || "Venue TBD"}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render tournament list view
  const renderTournamentList = () => {
    if (tournamentsLoading) {
      return (
        <div className="text-center py-12">
          <CircleDashed className="animate-spin h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading tournaments...</p>
        </div>
      );
    }

    if (!tournaments || tournaments.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No Tournaments</h3>
          <p className="mt-2 text-muted-foreground">There are no tournaments in the history.</p>
          <Button className="mt-4" asChild>
            <Link href="/tournament-manager">Create Tournament</Link>
          </Button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tournament History</h2>
          <div className="flex space-x-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="T20">T20</SelectItem>
                <SelectItem value="ODI">ODI</SelectItem>
                <SelectItem value="Test">Test</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tournaments match your filters.</p>
            <Button variant="outline" onClick={() => { setSelectedYear("all"); setSelectedFormat("all"); }} className="mt-4">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div>
            {filteredTournaments.map(renderTournamentCard)}
          </div>
        )}
      </div>
    );
  };

  // Helper functions
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Upcoming</Badge>;
      case "ongoing":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Ongoing</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderMatchStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Scheduled</Badge>;
      case "live":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Live</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Completed</Badge>;
      case "abandoned":
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Abandoned</Badge>;
      case "no_result":
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">No Result</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTournamentFormat = (format: string) => {
    switch (format) {
      case "T20": return "T20";
      case "ODI": return "One Day";
      case "Test": return "Test";
      case "other": return "Other";
      default: return format;
    }
  };

  const formatTournamentType = (type: string) => {
    switch (type) {
      case "league": return "League";
      case "knockout": return "Knockout";
      case "group_stage_knockout": return "Group + Knockout";
      default: return type;
    }
  };

  const formatStage = (stage: string) => {
    switch (stage) {
      case "league": return "League Stage";
      case "group": return "Group Stage";
      case "playoff": return "Playoffs";
      case "semi-final": return "Semi Finals";
      case "final": return "Final";
      case "qualifier": return "Qualifier";
      case "eliminator": return "Eliminator";
      default: return stage.charAt(0).toUpperCase() + stage.slice(1).replace(/-/g, ' ');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {selectedTournament ? renderTournamentDetails() : renderTournamentList()}
    </div>
  );
}