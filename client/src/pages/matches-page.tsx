import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Clock, Trophy, MapPin, Filter, Search, Loader2, AlertCircle, Check, Bell, Play, Video, MessageSquare, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryFn } from "@/lib/queryClient";
import { LiveStreamingDialog } from "@/components/live-match-streaming";
import { MatchGroupDiscussionDialog } from "@/components/match-discussion-groups";

type Match = {
  id: string;
  title: string;
  teams: {
    team1: { name: string; logo: string; score?: string };
    team2: { name: string; logo: string; score?: string };
  };
  status: "upcoming" | "live" | "completed";
  result?: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  imageUrl?: string;
};

export default function MatchesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [matchType, setMatchType] = useState("all");
  
  // Fetch matches data from API
  const { data: matches, isLoading, error } = useQuery<Match[]>({
    queryKey: ["/api/cricket/matches"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Filter matches based on search query and match type
  const filteredMatches = matches ? matches.filter(match => {
    const matchesSearch = 
      match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.teams.team1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.teams.team2.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.venue.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (matchType === "all") return matchesSearch;
    return matchesSearch && match.type.toLowerCase() === matchType.toLowerCase();
  }) : [];

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header />
      
      <main className="flex-grow pt-16 pb-16 md:pb-0">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Cricket Matches</h1>
            <p className="text-neutral-500">Follow live matches, upcoming fixtures, and recent results</p>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input 
                placeholder="Search matches, teams, venues..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={matchType} onValueChange={setMatchType}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="T20">T20</SelectItem>
                  <SelectItem value="ODI">ODI</SelectItem>
                  <SelectItem value="Test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Matches */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-[#FF5722]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-red-100 bg-red-50 rounded-md">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-red-700 mb-2">Unable to load match data</h3>
              <p className="text-red-600 max-w-md">We're experiencing issues retrieving the latest match information. Please check your connection and try again later.</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-6">
                Retry
              </Button>
            </div>
          ) : filteredMatches.length === 0 && !searchQuery && matchType === "all" ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-neutral-200 bg-white rounded-md">
              <Trophy className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-xl font-medium text-neutral-700 mb-2">No matches available</h3>
              <p className="text-neutral-500 max-w-md">We don't have any cricket matches to display at the moment. Please check back later for updates.</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-neutral-200 bg-white rounded-md">
              <Search className="h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-xl font-medium text-neutral-700 mb-2">No matches found</h3>
              <p className="text-neutral-500 max-w-md">We couldn't find any matches matching your search criteria. Try adjusting your filters or search terms.</p>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => {setSearchQuery(""); setMatchType("all");}} variant="outline">
                  Clear all filters
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6 w-full justify-start bg-white border border-neutral-200 rounded-md p-1">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="live" className="flex-1">Live</TabsTrigger>
                <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="live">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches
                    .filter(match => match.status === "live")
                    .map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="upcoming">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches
                    .filter(match => match.status === "upcoming")
                    .map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches
                    .filter(match => match.status === "completed")
                    .map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    
    if (match.status === "upcoming") {
      // Simulate setting a reminder
      setTimeout(() => {
        setReminderSet(!reminderSet);
        setLoading(false);
      }, 500);
    } else {
      // Simulate opening a modal or starting a live stream
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };
  
  return (
    <Card 
      className="overflow-hidden shadow-sm transition-all hover:shadow-md cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium">{match.title}</CardTitle>
          <div className="flex items-center text-xs text-neutral-500 mt-1">
            <CalendarDays className="h-3 w-3 mr-1" />
            <span>{new Date(match.date).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <Clock className="h-3 w-3 mr-1" />
            <span>{match.time}</span>
          </div>
        </div>
        {match.status === "live" ? (
          <Badge className="bg-red-500 animate-pulse">LIVE</Badge>
        ) : match.status === "upcoming" ? (
          <Badge variant="outline" className="text-neutral-500">Upcoming</Badge>
        ) : (
          <Badge variant="outline" className="text-neutral-500">Completed</Badge>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex items-center my-3">
          <div className="flex items-center justify-end w-5/12">
            <div className="text-right mr-3">
              <p className="font-semibold">{match.teams.team1.name}</p>
              {match.teams.team1.score && (
                <p className="text-xs font-bold text-neutral-700">{match.teams.team1.score}</p>
              )}
            </div>
            <Avatar className="h-12 w-12">
              <AvatarImage src={match.teams.team1.logo} alt={match.teams.team1.name} />
              <AvatarFallback>{match.teams.team1.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="w-2/12 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <span className="text-xs font-semibold">VS</span>
            </div>
          </div>
          
          <div className="flex items-center w-5/12">
            <Avatar className="h-12 w-12 mr-3">
              <AvatarImage src={match.teams.team2.logo} alt={match.teams.team2.name} />
              <AvatarFallback>{match.teams.team2.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{match.teams.team2.name}</p>
              {match.teams.team2.score && (
                <p className="text-xs font-bold text-neutral-700">{match.teams.team2.score}</p>
              )}
            </div>
          </div>
        </div>
        
        {match.result && (
          <p className="text-sm text-center text-[#FF5722] font-medium mb-3">{match.result}</p>
        )}
        
        {expanded && match.status === "upcoming" && (
          <div className="my-3 p-3 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-blue-700 mb-1">Match Details</h4>
            <p className="text-xs text-blue-600">
              Don't miss the exciting cricket action between {match.teams.team1.name} and {match.teams.team2.name}. 
              Set a reminder to get notified when the match starts.
            </p>
          </div>
        )}
        
        {expanded && match.status === "live" && (
          <div className="my-3 p-3 bg-red-50 rounded-md border border-red-100">
            <h4 className="text-sm font-medium text-red-700 mb-1">Live Match</h4>
            <p className="text-xs text-red-600">
              The match is currently in progress. Click "Watch Live" to stream the match and follow ball-by-ball updates.
            </p>
          </div>
        )}
        
        {expanded && match.status === "completed" && match.imageUrl && (
          <div className="my-3 flex justify-center">
            <img 
              src={match.imageUrl} 
              alt={match.title} 
              className="max-h-36 rounded-md object-cover"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3 border-t border-neutral-100 pt-3">
          <div className="flex items-center text-xs text-neutral-500">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{match.venue}</span>
          </div>
          <Badge variant="outline" className="text-xs">{match.type}</Badge>
        </div>
        
        <div className="flex flex-col space-y-2">
          {match.status === "live" && (
            <div className="flex space-x-2">
              <LiveStreamingDialog 
                match={{
                  id: parseInt(match.id),
                  title: match.title,
                  team1: match.teams.team1.name,
                  team2: match.teams.team2.name,
                  team1Logo: match.teams.team1.logo,
                  team2Logo: match.teams.team2.logo,
                  venue: match.venue,
                  format: match.type,
                  startTime: new Date(match.date + " " + match.time),
                  status: match.status
                }}
                isHost={false}
              />
              
              <MatchGroupDiscussionDialog matchId={parseInt(match.id)} />
            </div>
          )}
          
          <Button 
            className="w-full" 
            variant={match.status === "upcoming" && reminderSet ? "default" : match.status === "live" ? "default" : "outline"}
            onClick={handleButtonClick}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : match.status === "live" ? (
              <><Play className="h-4 w-4 mr-2" /> Watch Live</>
            ) : match.status === "upcoming" ? (
              reminderSet ? (
                <><Check className="h-4 w-4 mr-2" /> Reminder Set</>
              ) : (
                <><Bell className="h-4 w-4 mr-2" /> Set Reminder</>
              )
            ) : (
              <><Video className="h-4 w-4 mr-2" /> View Highlights</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}