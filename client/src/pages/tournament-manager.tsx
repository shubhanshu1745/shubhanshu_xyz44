import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Tournament, TournamentMatch as DbTournamentMatch, ExtendedTournamentTeam } from "@/types/schema";
import {
  CalendarDays,
  Trophy,
  Users,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight,
  Clock,
  Calendar,
  MapPin,
  UserPlus,
  ChevronsUpDown,
  Check,
  Play,
  PauseCircle,
  Settings,
  FileSpreadsheet,
  Award,
  BarChart2,
  Download,
  Share2,
  ListFilter,
  CircleDot,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

// Interface definitions
interface Team {
  id: number;
  name: string;
  shortName: string;
  logo?: string;
}

interface Player {
  id: number;
  name: string;
  role: string;
  teamId?: number;
}

interface Venue {
  id: number;
  name: string;
  city: string;
  country: string;
}

interface Match {
  id: number;
  matchId: number; // Add this field to match the server schema
  tournamentId: number;
  stage: "group" | "knockout" | "final";
  round?: string;
  matchNumber: number;
  team1Id: number;
  team2Id: number;
  venueId: number;
  date: string;
  time: string;
  result?: {
    winnerId?: number;
    team1Score?: string;
    team2Score?: string;
    status: "scheduled" | "live" | "completed" | "abandoned" | "no_result";
    description?: string;
  };
}

// Define our client-specific tournament match interface
interface ClientTournamentMatch {
  id: number;
  matchId: number; // Add this field to match the server schema
  tournamentId: number;
  team1Id: number;
  team2Id: number;
  venueId: number;
  stage: string | null;
  group: string | null;
  date: string; 
  time: string;
  matchNumber: number;
  result: {
    status: string;
    team1Score?: string;
    team2Score?: string;
    winnerId?: number;
    description?: string;
  };
}

interface TournamentGroup {
  id: number;
  name: string;
  teams: number[];
}

// Define our own TournamentTeam interface that includes the required fields
interface TournamentTeam {
  id: number;
  tournamentId: number;
  teamId: number;
  registrationDate?: Date | null;
  registrationStatus?: string | null;
  paymentStatus?: string | null;
  paidAmount?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Using the ExtendedTournamentTeam interface from schema.ts

interface TournamentFormData {
  name: string;
  shortName: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  tournamentType: "league" | "knockout" | "group_stage_knockout";
  format: "T20" | "ODI" | "Test" | "other";
  overs?: number;
  venues: number[];
  teams: number[];
  pointsPerWin: number;
  pointsPerTie: number;
  pointsPerNoResult: number;
  qualificationRules?: string;
  logoUrl?: string;
}

export default function TournamentManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tournamentForm, setTournamentForm] = useState<TournamentFormData>({
    name: "",
    shortName: "",
    description: "",
    startDate: null,
    endDate: null,
    tournamentType: "league",
    format: "T20",
    overs: 20,
    venues: [],
    teams: [],
    pointsPerWin: 2,
    pointsPerTie: 1,
    pointsPerNoResult: 1,
    qualificationRules: ""
  });
  
  const [addMatchDialogOpen, setAddMatchDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<[number | null, number | null]>([null, null]);
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [matchDate, setMatchDate] = useState<Date | null>(null);
  const [matchTime, setMatchTime] = useState("");
  const [matchStage, setMatchStage] = useState<"group" | "knockout" | "final">("group");
  const [matchRound, setMatchRound] = useState("");
  
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [generateScheduleDialogOpen, setGenerateScheduleDialogOpen] = useState(false);
  const [scheduleSettings, setScheduleSettings] = useState({
    doubleRoundRobin: false,
    scheduleWeekdayMatches: true,
    maxMatchesPerDay: 2,
    homeAndAway: false,
    startDate: null as Date | null,
    endDate: null as Date | null,
    specificDays: [] as string[]
  });
  
  // Query to get all tournaments
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/tournaments');
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        return [];
      }
    }
  });
  
  // Query to get all teams
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/teams');
      } catch (error) {
        console.error('Error fetching teams:', error);
        return [
          { id: 1, name: "Team A", shortName: "TA" },
          { id: 2, name: "Team B", shortName: "TB" },
          { id: 3, name: "Team C", shortName: "TC" },
          { id: 4, name: "Team D", shortName: "TD" },
          { id: 5, name: "Team E", shortName: "TE" },
          { id: 6, name: "Team F", shortName: "TF" },
          { id: 7, name: "Team G", shortName: "TG" },
          { id: 8, name: "Team H", shortName: "TH" },
        ];
      }
    }
  });
  
  // Query to get all venues
  const { data: venues } = useQuery({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/venues');
      } catch (error) {
        console.error('Error fetching venues:', error);
        return [
          { id: 1, name: "Stadium A", city: "City A", country: "Country A" },
          { id: 2, name: "Stadium B", city: "City B", country: "Country B" },
          { id: 3, name: "Stadium C", city: "City C", country: "Country C" },
          { id: 4, name: "Stadium D", city: "City D", country: "Country D" },
        ];
      }
    }
  });
  
  // Mutation to create a tournament
  const createTournamentMutation = useMutation({
    mutationFn: async (data: TournamentFormData) => {
      try {
        // Correctly call apiRequest with method first, then URL, then data
        return await apiRequest('POST', '/api/tournaments', data);
      } catch (error) {
        console.error('Error creating tournament:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tournament Created",
        description: "The tournament has been created successfully."
      });
      setShowCreateDialog(false);
      resetTournamentForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Tournament",
        description: error.message || "There was an error creating the tournament.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to add a match to a tournament
  const addMatchMutation = useMutation({
    mutationFn: async ({ tournamentId, matchData }: { tournamentId: number, matchData: Partial<Match> }) => {
      try {
        return await apiRequest('POST', `/api/tournaments/${tournamentId}/matches`, matchData);
      } catch (error) {
        console.error('Error adding match:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', variables.tournamentId] });
      toast({
        title: "Match Added",
        description: "The match has been added to the tournament."
      });
      setAddMatchDialogOpen(false);
      resetMatchForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Match",
        description: error.message || "There was an error adding the match.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to generate a tournament schedule
  const generateScheduleMutation = useMutation({
    mutationFn: async ({ tournamentId, settings }: { tournamentId: number, settings: typeof scheduleSettings }) => {
      try {
        return await apiRequest('POST', `/api/tournaments/${tournamentId}/generate-schedule`, settings);
      } catch (error) {
        console.error('Error generating schedule:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', variables.tournamentId] });
      toast({
        title: "Schedule Generated",
        description: "The tournament schedule has been generated successfully."
      });
      setGenerateScheduleDialogOpen(false);
      setScheduleGenerated(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Schedule",
        description: error.message || "There was an error generating the schedule.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to delete a tournament
  const deleteTournamentMutation = useMutation({
    mutationFn: async (tournamentId: number) => {
      try {
        return await apiRequest('DELETE', `/api/tournaments/${tournamentId}`);
      } catch (error) {
        console.error('Error deleting tournament:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tournament Deleted",
        description: "The tournament has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Tournament",
        description: error.message || "There was an error deleting the tournament.",
        variant: "destructive"
      });
    }
  });
  
  const handleCreateTournament = () => {
    if (!tournamentForm.name || !tournamentForm.startDate || !tournamentForm.endDate || !tournamentForm.teams || !Array.isArray(tournamentForm.teams) || tournamentForm.teams.length < 2) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields and select at least two teams.",
        variant: "destructive"
      });
      return;
    }
    
    createTournamentMutation.mutate(tournamentForm);
  };
  
  const handleAddMatch = () => {
    if (!selectedTournament || !selectedTeams[0] || !selectedTeams[1] || !selectedVenue || !matchDate) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const formattedDate = format(matchDate, 'yyyy-MM-dd');
    // Generate a unique match ID - this is required by the server
    const nextMatchNumber = (selectedTournament.matches && Array.isArray(selectedTournament.matches) ? selectedTournament.matches.length : 0) + 1;
    
    const matchData: Partial<Match> = {
      matchId: nextMatchNumber, // Adding the required matchId
      tournamentId: selectedTournament.id,
      team1Id: selectedTeams[0],
      team2Id: selectedTeams[1],
      venueId: selectedVenue,
      date: formattedDate,
      time: matchTime || '14:00',
      stage: matchStage,
      round: matchRound,
      matchNumber: nextMatchNumber,
      result: {
        status: 'scheduled'
      }
    };
    
    addMatchMutation.mutate({ tournamentId: selectedTournament.id, matchData });
  };
  
  const handleGenerateSchedule = () => {
    if (!selectedTournament) {
      toast({
        title: "No Tournament Selected",
        description: "Please select a tournament first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!scheduleSettings.startDate || !scheduleSettings.endDate) {
      toast({
        title: "Incomplete Settings",
        description: "Please select start and end dates for the schedule.",
        variant: "destructive"
      });
      return;
    }
    
    generateScheduleMutation.mutate({ 
      tournamentId: selectedTournament.id, 
      settings: scheduleSettings 
    });
  };
  
  const resetTournamentForm = () => {
    setTournamentForm({
      name: "",
      shortName: "",
      description: "",
      startDate: null,
      endDate: null,
      tournamentType: "league",
      format: "T20",
      overs: 20,
      venues: [],
      teams: [],
      pointsPerWin: 2,
      pointsPerTie: 1,
      pointsPerNoResult: 1,
      qualificationRules: ""
    });
  };
  
  const resetMatchForm = () => {
    setSelectedTeams([null, null]);
    setSelectedVenue(null);
    setMatchDate(null);
    setMatchTime("");
    setMatchStage("group");
    setMatchRound("");
  };
  
  const getTeamName = (teamId: number | null | undefined) => {
    if (!teamId || !teams) return "Unknown Team";
    const team = teams.find((t: Team) => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };
  
  const getVenueName = (venueId: number | null | undefined) => {
    if (!venueId || !venues) return "Unknown Venue";
    const venue = venues.find((v: Venue) => v.id === venueId);
    return venue ? venue.name : "Unknown Venue";
  };
  
  const getStatusBadge = (status: string) => {
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
  
  const getMatchStatusBadge = (status: string) => {
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
  
  const renderTournamentsSection = () => {
    if (tournamentsLoading) {
      return (
        <div className="py-12 text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-muted-foreground">Loading tournaments...</p>
        </div>
      );
    }
    
    if (!tournaments || tournaments.length === 0) {
      return (
        <div className="py-12 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No Tournaments Found</h3>
          <p className="mt-2 text-muted-foreground">Create your first tournament to get started</p>
          <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Your Tournaments</h2>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tournaments as Tournament[]).map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="line-clamp-1">{tournament.name}</CardTitle>
                    <CardDescription>
                      {format(new Date(tournament.startDate), 'PPP')} - {format(new Date(tournament.endDate), 'PPP')}
                    </CardDescription>
                  </div>
                  {getStatusBadge(tournament.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.teams && Array.isArray(tournament.teams) ? tournament.teams.length : 0} Teams</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.format}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.venues && Array.isArray(tournament.venues) ? tournament.venues.length : 0} Venues</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.matches && Array.isArray(tournament.matches) ? tournament.matches.length : 0} Matches</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm font-medium mb-1">Progress</div>
                  <Progress 
                    value={
                      tournament.status === "completed" 
                        ? 100 
                        : tournament.status === "upcoming" 
                          ? 0 
                          : tournament.matches && Array.isArray(tournament.matches) && tournament.matches.length > 0
                            ? Math.round(
                                (tournament.matches.filter(m => 
                                  m.result?.status === "completed" || 
                                  m.result?.status === "abandoned" || 
                                  m.result?.status === "no_result"
                                ).length / 
                                tournament.matches.length) * 100
                              )
                            : 0
                    } 
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 px-6 py-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedTournament(tournament)}
                >
                  Manage
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  const renderTournamentDetails = () => {
    if (!selectedTournament) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <Button 
              variant="ghost" 
              className="mb-2 -ml-4 text-muted-foreground" 
              onClick={() => setSelectedTournament(null)}
            >
              <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
              Back to All Tournaments
            </Button>
            <h2 className="text-3xl font-bold">{selectedTournament.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(selectedTournament.status)}
              <span className="text-muted-foreground">
                {format(new Date(selectedTournament.startDate), 'PPP')} - {format(new Date(selectedTournament.endDate), 'PPP')}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Data
            </Button>
            
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={() => {
                if (confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) {
                  deleteTournamentMutation.mutate(selectedTournament.id);
                  setSelectedTournament(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="matches">
          <TabsList className="mb-6">
            <TabsTrigger value="matches">
              <Calendar className="h-4 w-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="teams">
              <Users className="h-4 w-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="standings">
              <Trophy className="h-4 w-4 mr-2" />
              Standings
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <BarChart2 className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Match Schedule</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setAddMatchDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Match
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setGenerateScheduleDialogOpen(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Generate Schedule
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedTournament.matches && Array.isArray(selectedTournament.matches) && selectedTournament.matches.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTournament.matches && Array.isArray(selectedTournament.matches) ? selectedTournament.matches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell className="font-medium">{match.matchNumber}</TableCell>
                          <TableCell>
                            <div className="font-medium">{getTeamName(match.team1Id)} vs {getTeamName(match.team2Id)}</div>
                            <div className="text-xs text-muted-foreground">
                              {match.stage ? match.stage.charAt(0).toUpperCase() + match.stage.slice(1) : 'Unknown'}
                              {match.round && ` - ${match.round}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{format(new Date(match.date), 'PPP')}</div>
                            <div className="text-xs text-muted-foreground">{match.time}</div>
                          </TableCell>
                          <TableCell>
                            {getVenueName(match.venueId)}
                          </TableCell>
                          <TableCell>
                            {getMatchStatusBadge(match.result?.status || 'scheduled')}
                            {match.result?.status === 'completed' && match.result?.team1Score && match.result?.team2Score && (
                              <div className="text-xs mt-1">
                                {match.result.team1Score} / {match.result.team2Score}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {match.result?.status === 'scheduled' && (
                                <Button variant="ghost" size="icon">
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {match.result?.status === 'live' && (
                                <Button variant="ghost" size="icon">
                                  <PauseCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : null}
                    </TableBody>
                  </Table>
                ) : scheduleGenerated ? (
                  <div className="py-12 text-center">
                    <Check className="h-12 w-12 mx-auto text-green-500" />
                    <h3 className="mt-4 text-xl font-semibold">Schedule Generated!</h3>
                    <p className="mt-2 text-muted-foreground">
                      The schedule has been created but needs to be approved
                    </p>
                    <Button className="mt-4">
                      View and Approve Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Matches Scheduled</h3>
                    <p className="mt-2 text-muted-foreground">
                      Add matches manually or generate a complete schedule
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setAddMatchDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Match
                      </Button>
                      <Button 
                        onClick={() => setGenerateScheduleDialogOpen(true)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Generate Schedule
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Teams</CardTitle>
                  <Button variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Team
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedTournament.teams && Array.isArray(selectedTournament.teams) && selectedTournament.teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTournament.teams.map((teamEntry) => {
                      const team = teams?.find((t: Team) => t.id === teamEntry.teamId);
                      if (!team) return null;
                      
                      return (
                        <Card key={team.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              {team.logo ? (
                                <img 
                                  src={team.logo} 
                                  alt={team.name} 
                                  className="w-10 h-10 rounded-full object-cover" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="font-bold text-primary">{team.shortName}</span>
                                </div>
                              )}
                              <div>
                                <CardTitle className="line-clamp-1">{team.name}</CardTitle>
                                {('qualified' in teamEntry) && teamEntry.qualified !== undefined && (
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      teamEntry.qualified 
                                        ? "bg-green-50 text-green-600 border-green-200" 
                                        : "bg-red-50 text-red-600 border-red-200"
                                    }
                                  >
                                    {teamEntry.qualified ? "Qualified" : "Eliminated"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                              <div>
                                <div className="font-semibold">{('stats' in teamEntry) && teamEntry.stats && 'matches' in teamEntry.stats ? teamEntry.stats.matches : 0}</div>
                                <div className="text-xs text-muted-foreground">Matches</div>
                              </div>
                              <div>
                                <div className="font-semibold">{('stats' in teamEntry) && teamEntry.stats && 'won' in teamEntry.stats ? teamEntry.stats.won : 0}</div>
                                <div className="text-xs text-muted-foreground">Won</div>
                              </div>
                              <div>
                                <div className="font-semibold">{('stats' in teamEntry) && teamEntry.stats && 'lost' in teamEntry.stats ? teamEntry.stats.lost : 0}</div>
                                <div className="text-xs text-muted-foreground">Lost</div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="border-t bg-muted/50 px-6 py-2">
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <span className="font-medium">{('stats' in teamEntry) && teamEntry.stats && 'points' in teamEntry.stats ? teamEntry.stats.points : 0}</span>
                                <span className="text-xs text-muted-foreground ml-1">pts</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground mr-1">NRR:</span>
                                <span className={
                                  ('stats' in teamEntry) && teamEntry.stats && 'nrr' in teamEntry.stats && teamEntry.stats.nrr > 0 
                                    ? "text-green-600" 
                                    : ('stats' in teamEntry) && teamEntry.stats && 'nrr' in teamEntry.stats && teamEntry.stats.nrr < 0 
                                      ? "text-red-600" 
                                      : ""
                                }>{('stats' in teamEntry) && teamEntry.stats && 'nrr' in teamEntry.stats && teamEntry.stats.nrr > 0 ? '+' : ''}{('stats' in teamEntry) && teamEntry.stats && 'nrr' in teamEntry.stats ? teamEntry.stats.nrr.toFixed(3) : '0.000'}</span>
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Teams Added</h3>
                    <p className="mt-2 text-muted-foreground">
                      Add teams to your tournament to get started
                    </p>
                    <Button className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Teams
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tournament Standings</CardTitle>
                  {selectedTournament.tournamentType === "group_stage_knockout" && Array.isArray(selectedTournament.groups) && selectedTournament.groups.length > 0 && (
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {Array.isArray(selectedTournament.groups) ? selectedTournament.groups.map(group => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {Array.isArray(selectedTournament.teams) && selectedTournament.teams.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Pos</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center">T</TableHead>
                        <TableHead className="text-center">NR</TableHead>
                        <TableHead className="text-center">NRR</TableHead>
                        <TableHead className="text-center">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedTournament.teams && Array.isArray(selectedTournament.teams) ? selectedTournament.teams : [])
                        .sort((a, b) => {
                          // Sort by points first, then NRR
                          const aStats = 'stats' in a && a.stats ? a.stats : {};
                          const bStats = 'stats' in b && b.stats ? b.stats : {};
                          
                          // Check if points exists in stats object
                          const aPoints = aStats && typeof aStats === 'object' && 'points' in aStats ? 
                            Number(aStats.points) : 0;
                          const bPoints = bStats && typeof bStats === 'object' && 'points' in bStats ? 
                            Number(bStats.points) : 0;
                          
                          if (aPoints !== bPoints) {
                            return bPoints - aPoints;
                          }
                          
                          // Check if nrr exists in stats object
                          const aNrr = aStats && typeof aStats === 'object' && 'nrr' in aStats ? 
                            Number(aStats.nrr) : 0;
                          const bNrr = bStats && typeof bStats === 'object' && 'nrr' in bStats ? 
                            Number(bStats.nrr) : 0;
                            
                          return bNrr - aNrr;
                        })
                        .map((teamEntry, index) => {
                          const team = teams?.find((t: Team) => t.id === teamEntry.teamId);
                          if (!team) return null;
                          
                          return (
                            <TableRow key={team.id}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {team.logo ? (
                                    <img 
                                      src={team.logo} 
                                      alt={team.name} 
                                      className="w-6 h-6 rounded-full object-cover" 
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-xs font-bold text-primary">{team.shortName}</span>
                                    </div>
                                  )}
                                  <span>{team.name}</span>
                                  {('qualified' in teamEntry) && teamEntry.qualified !== undefined && (
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        teamEntry.qualified 
                                          ? "bg-green-50 text-green-600 border-green-200" 
                                          : "bg-red-50 text-red-600 border-red-200"
                                      }
                                    >
                                      {teamEntry.qualified ? "Q" : "E"}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {('stats' in teamEntry) && teamEntry.stats && 'matches' in teamEntry.stats ? teamEntry.stats.matches : 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {('stats' in teamEntry) && teamEntry.stats && 'won' in teamEntry.stats ? teamEntry.stats.won : 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {('stats' in teamEntry) && teamEntry.stats && 'lost' in teamEntry.stats ? teamEntry.stats.lost : 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {('stats' in teamEntry) && teamEntry.stats && 'tied' in teamEntry.stats ? teamEntry.stats.tied : 0}
                              </TableCell>
                              <TableCell className="text-center">
                                {('stats' in teamEntry) && teamEntry.stats && 'noResult' in teamEntry.stats ? teamEntry.stats.noResult : 0}
                              </TableCell>
                              <TableCell className={`text-center ${
                                ('stats' in teamEntry) && teamEntry.stats && 'nrr' in teamEntry.stats && teamEntry.stats.nrr > 0 
                                  ? "text-green-600" 
                                  : ('stats' in teamEntry) && teamEntry.stats && 'nrr' in teamEntry.stats && teamEntry.stats.nrr < 0 
                                    ? "text-red-600" 
                                    : ""
                              }`}>
                                {('stats' in teamEntry) && teamEntry.stats && 'nrr' in teamEntry.stats && teamEntry.stats.nrr > 0 ? '+' : ''}
                                {('stats' in teamEntry) && teamEntry.stats && 'nrr' in teamEntry.stats
                                  ? Number(teamEntry.stats.nrr).toFixed(3) 
                                  : '0.000'}
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                {('stats' in teamEntry) && teamEntry.stats && 'points' in teamEntry.stats ? teamEntry.stats.points : 0}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Standings Available</h3>
                    <p className="mt-2 text-muted-foreground">
                      Standings will be generated after matches are played
                    </p>
                  </div>
                )}
                
                {selectedTournament.qualificationRules && (
                  <Alert className="mt-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Qualification Rules</AlertTitle>
                    <AlertDescription>
                      {selectedTournament.qualificationRules}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="statistics">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tournament Statistics</CardTitle>
                  <div className="flex gap-2">
                    <Select defaultValue="batting">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batting">Batting Stats</SelectItem>
                        <SelectItem value="bowling">Bowling Stats</SelectItem>
                        <SelectItem value="fielding">Fielding Stats</SelectItem>
                        <SelectItem value="team">Team Stats</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="runs">
                  <TabsList className="mb-4">
                    <TabsTrigger value="runs">Most Runs</TabsTrigger>
                    <TabsTrigger value="sr">Best SR</TabsTrigger>
                    <TabsTrigger value="avg">Best Avg</TabsTrigger>
                    <TabsTrigger value="boundaries">Most Boundaries</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="runs">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead className="text-center">Matches</TableHead>
                          <TableHead className="text-center">Runs</TableHead>
                          <TableHead className="text-center">Avg</TableHead>
                          <TableHead className="text-center">SR</TableHead>
                          <TableHead className="text-center">4s</TableHead>
                          <TableHead className="text-center">6s</TableHead>
                          <TableHead className="text-center">HS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* This would be populated with real data from your API */}
                        <TableRow>
                          <TableCell className="font-medium">1</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">VP</span>
                              </div>
                              <span>V. Player</span>
                            </div>
                          </TableCell>
                          <TableCell>Team A</TableCell>
                          <TableCell className="text-center">8</TableCell>
                          <TableCell className="text-center font-bold">450</TableCell>
                          <TableCell className="text-center">56.25</TableCell>
                          <TableCell className="text-center">148.51</TableCell>
                          <TableCell className="text-center">42</TableCell>
                          <TableCell className="text-center">21</TableCell>
                          <TableCell className="text-center">92</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">2</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">JP</span>
                              </div>
                              <span>J. Player</span>
                            </div>
                          </TableCell>
                          <TableCell>Team B</TableCell>
                          <TableCell className="text-center">8</TableCell>
                          <TableCell className="text-center font-bold">412</TableCell>
                          <TableCell className="text-center">51.50</TableCell>
                          <TableCell className="text-center">142.56</TableCell>
                          <TableCell className="text-center">38</TableCell>
                          <TableCell className="text-center">18</TableCell>
                          <TableCell className="text-center">86</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="sr">
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-xl font-semibold">Statistics Available Soon</h3>
                      <p className="mt-2 text-muted-foreground">
                        This section will be updated as matches are played
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="avg">
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-xl font-semibold">Statistics Available Soon</h3>
                      <p className="mt-2 text-muted-foreground">
                        This section will be updated as matches are played
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="boundaries">
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="mt-4 text-xl font-semibold">Statistics Available Soon</h3>
                      <p className="mt-2 text-muted-foreground">
                        This section will be updated as matches are played
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tournament Manager</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your cricket tournaments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = "/tournaments/history"}>
            <Trophy className="mr-2 h-4 w-4" />
            Tournament History
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Tournament
          </Button>
        </div>
      </header>
      
      {selectedTournament ? renderTournamentDetails() : renderTournamentsSection()}
      
      {/* Create Tournament Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
            <DialogDescription>
              Set up the details for your new cricket tournament
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Cricket Premier League 2025"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm({
                    ...tournamentForm,
                    name: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shortName">Short Name</Label>
                <Input 
                  id="shortName" 
                  placeholder="e.g., CPL 2025"
                  value={tournamentForm.shortName}
                  onChange={(e) => setTournamentForm({
                    ...tournamentForm,
                    shortName: e.target.value
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Brief description of the tournament"
                value={tournamentForm.description}
                onChange={(e) => setTournamentForm({
                  ...tournamentForm,
                  description: e.target.value
                })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  selected={tournamentForm.startDate}
                  onSelect={(date) => setTournamentForm({
                    ...tournamentForm,
                    startDate: date
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  selected={tournamentForm.endDate}
                  onSelect={(date) => setTournamentForm({
                    ...tournamentForm,
                    endDate: date
                  })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tournament Type</Label>
                <Select 
                  value={tournamentForm.tournamentType}
                  onValueChange={(value) => setTournamentForm({
                    ...tournamentForm,
                    tournamentType: value as "league" | "knockout" | "group_stage_knockout"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="league">League (Round Robin)</SelectItem>
                    <SelectItem value="knockout">Knockout</SelectItem>
                    <SelectItem value="group_stage_knockout">Group Stage + Knockout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Format</Label>
                <Select 
                  value={tournamentForm.format}
                  onValueChange={(value) => setTournamentForm({
                    ...tournamentForm,
                    format: value as "T20" | "ODI" | "Test" | "other"
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T20">T20</SelectItem>
                    <SelectItem value="ODI">ODI</SelectItem>
                    <SelectItem value="Test">Test</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {tournamentForm.format !== "Test" && (
              <div className="space-y-2">
                <Label htmlFor="overs">Overs per Innings</Label>
                <Input 
                  id="overs" 
                  type="number"
                  min={1}
                  value={tournamentForm.overs?.toString() || ""}
                  onChange={(e) => setTournamentForm({
                    ...tournamentForm,
                    overs: parseInt(e.target.value)
                  })}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Teams</Label>
              <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                {teams && Array.isArray(teams) ? teams.map(team => (
                  <div key={team.id} className="flex items-center space-x-2 py-2">
                    <Checkbox 
                      id={`team-${team.id}`}
                      checked={tournamentForm.teams && Array.isArray(tournamentForm.teams) ? tournamentForm.teams.includes(team.id) : false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTournamentForm({
                            ...tournamentForm,
                            teams: Array.isArray(tournamentForm.teams) ? [...tournamentForm.teams, team.id] : [team.id]
                          });
                        } else {
                          setTournamentForm({
                            ...tournamentForm,
                            teams: Array.isArray(tournamentForm.teams) 
                              ? tournamentForm.teams.filter(id => id !== team.id) 
                              : []
                          });
                        }
                      }}
                    />
                    <label 
                      htmlFor={`team-${team.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {team.name}
                    </label>
                  </div>
                )) : null}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Venues</Label>
              <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                {venues && Array.isArray(venues) ? venues.map(venue => (
                  <div key={venue.id} className="flex items-center space-x-2 py-2">
                    <Checkbox 
                      id={`venue-${venue.id}`}
                      checked={tournamentForm.venues && Array.isArray(tournamentForm.venues) ? tournamentForm.venues.includes(venue.id) : false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTournamentForm({
                            ...tournamentForm,
                            venues: Array.isArray(tournamentForm.venues) ? [...tournamentForm.venues, venue.id] : [venue.id]
                          });
                        } else {
                          setTournamentForm({
                            ...tournamentForm,
                            venues: Array.isArray(tournamentForm.venues) 
                              ? tournamentForm.venues.filter(id => id !== venue.id) 
                              : []
                          });
                        }
                      }}
                    />
                    <label 
                      htmlFor={`venue-${venue.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {venue.name} ({venue.city}, {venue.country})
                    </label>
                  </div>
                )) : null}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointsPerWin">Points per Win</Label>
                <Input 
                  id="pointsPerWin" 
                  type="number"
                  min={1}
                  value={tournamentForm.pointsPerWin.toString()}
                  onChange={(e) => setTournamentForm({
                    ...tournamentForm,
                    pointsPerWin: parseInt(e.target.value)
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pointsPerTie">Points per Tie</Label>
                <Input 
                  id="pointsPerTie" 
                  type="number"
                  min={0}
                  value={tournamentForm.pointsPerTie.toString()}
                  onChange={(e) => setTournamentForm({
                    ...tournamentForm,
                    pointsPerTie: parseInt(e.target.value)
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pointsPerNoResult">Points for No Result</Label>
                <Input 
                  id="pointsPerNoResult" 
                  type="number"
                  min={0}
                  value={tournamentForm.pointsPerNoResult.toString()}
                  onChange={(e) => setTournamentForm({
                    ...tournamentForm,
                    pointsPerNoResult: parseInt(e.target.value)
                  })}
                />
              </div>
            </div>
            
            {tournamentForm.tournamentType === "group_stage_knockout" && (
              <div className="space-y-2">
                <Label htmlFor="qualificationRules">Qualification Rules</Label>
                <Textarea 
                  id="qualificationRules" 
                  placeholder="e.g., Top 2 teams from each group qualify for semifinals"
                  value={tournamentForm.qualificationRules}
                  onChange={(e) => setTournamentForm({
                    ...tournamentForm,
                    qualificationRules: e.target.value
                  })}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                resetTournamentForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTournament}>
              Create Tournament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Match Dialog */}
      <Dialog open={addMatchDialogOpen} onOpenChange={setAddMatchDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Match</DialogTitle>
            <DialogDescription>
              Add a match to {selectedTournament?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Team 1</Label>
              <Select 
                value={selectedTeams[0]?.toString() || ""}
                onValueChange={(value) => setSelectedTeams([parseInt(value), selectedTeams[1]])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams && Array.isArray(teams) ? teams.map(team => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Team 2</Label>
              <Select 
                value={selectedTeams[1]?.toString() || ""}
                onValueChange={(value) => setSelectedTeams([selectedTeams[0], parseInt(value)])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams && Array.isArray(teams) ? teams.map(team => (
                    team.id !== selectedTeams[0] && (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    )
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Venue</Label>
              <Select 
                value={selectedVenue?.toString() || ""}
                onValueChange={(value) => setSelectedVenue(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues && Array.isArray(venues) ? venues.map(venue => (
                    <SelectItem key={venue.id} value={venue.id.toString()}>
                      {venue.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker
                  selected={matchDate}
                  onSelect={setMatchDate}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input 
                  id="time" 
                  type="time"
                  value={matchTime}
                  onChange={(e) => setMatchTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select 
                value={matchStage}
                onValueChange={(value) => setMatchStage(value as "group" | "knockout" | "final")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group Stage</SelectItem>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {matchStage !== "group" && (
              <div className="space-y-2">
                <Label htmlFor="round">Round</Label>
                <Input 
                  id="round" 
                  placeholder="e.g., Quarterfinal, Semifinal 1"
                  value={matchRound}
                  onChange={(e) => setMatchRound(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddMatchDialogOpen(false);
                resetMatchForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMatch}>
              Add Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Generate Schedule Dialog */}
      <Dialog open={generateScheduleDialogOpen} onOpenChange={setGenerateScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Schedule</DialogTitle>
            <DialogDescription>
              Automatically create a complete match schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="doubleRoundRobin"
                checked={scheduleSettings.doubleRoundRobin}
                onCheckedChange={(checked) => setScheduleSettings({
                  ...scheduleSettings,
                  doubleRoundRobin: checked
                })}
              />
              <Label htmlFor="doubleRoundRobin">Double Round Robin</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="homeAndAway"
                checked={scheduleSettings.homeAndAway}
                onCheckedChange={(checked) => setScheduleSettings({
                  ...scheduleSettings,
                  homeAndAway: checked
                })}
              />
              <Label htmlFor="homeAndAway">Home and Away Matches</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="weekdayMatches"
                checked={scheduleSettings.scheduleWeekdayMatches}
                onCheckedChange={(checked) => setScheduleSettings({
                  ...scheduleSettings,
                  scheduleWeekdayMatches: checked
                })}
              />
              <Label htmlFor="weekdayMatches">Include Weekday Matches</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxMatchesPerDay">Maximum Matches Per Day</Label>
              <Input 
                id="maxMatchesPerDay" 
                type="number"
                min={1}
                max={5}
                value={scheduleSettings.maxMatchesPerDay.toString()}
                onChange={(e) => setScheduleSettings({
                  ...scheduleSettings,
                  maxMatchesPerDay: parseInt(e.target.value)
                })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  selected={scheduleSettings.startDate}
                  onSelect={(date) => setScheduleSettings({
                    ...scheduleSettings,
                    startDate: date
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  selected={scheduleSettings.endDate}
                  onSelect={(date) => setScheduleSettings({
                    ...scheduleSettings,
                    endDate: date
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Preferred Match Days</Label>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                  <div 
                    key={day}
                    className={`
                      flex items-center justify-center p-2 rounded-md cursor-pointer
                      ${scheduleSettings.specificDays.includes(day) 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"}
                    `}
                    onClick={() => {
                      if (scheduleSettings.specificDays.includes(day)) {
                        setScheduleSettings({
                          ...scheduleSettings,
                          specificDays: scheduleSettings.specificDays.filter(d => d !== day)
                        });
                      } else {
                        setScheduleSettings({
                          ...scheduleSettings,
                          specificDays: [...scheduleSettings.specificDays, day]
                        });
                      }
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setGenerateScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateSchedule}>
              Generate Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}