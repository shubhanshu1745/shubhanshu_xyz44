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
import { CalendarDays, Clock, Trophy, MapPin, Filter, Search, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryFn } from "@/lib/queryClient";

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

// Fallback matches data in case API fails
const fallbackMatches: Match[] = [
  {
    id: "m1",
    title: "T20 World Cup 2023",
    teams: {
      team1: { 
        name: "India", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png",
        score: "184/6" 
      },
      team2: { 
        name: "Australia", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/1200px-Flag_of_Australia_%28converted%29.svg.png",
        score: "185/4" 
      }
    },
    status: "completed",
    result: "Australia won by 6 wickets",
    date: "2023-06-15",
    time: "19:00",
    venue: "Melbourne Cricket Ground",
    type: "T20I",
    imageUrl: "https://resources.pulse.icc-cricket.com/ICC/photo/2023/11/19/1c246730-8321-465a-b390-1118ac859254/Travis-Head.png"
  },
  {
    id: "m2",
    title: "IPL 2023",
    teams: {
      team1: { 
        name: "RCB", 
        logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/logos/Roundbig/RCBroundbig.png"
      },
      team2: { 
        name: "CSK", 
        logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png" 
      }
    },
    status: "upcoming",
    date: "2023-06-20",
    time: "19:30",
    venue: "M. Chinnaswamy Stadium, Bangalore",
    type: "T20"
  },
  {
    id: "m3",
    title: "India vs England Test Series",
    teams: {
      team1: { 
        name: "India", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png",
        score: "245/3" 
      },
      team2: { 
        name: "England", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/1200px-Flag_of_England.svg.png",
        score: "467" 
      }
    },
    status: "live",
    date: "2023-06-18",
    time: "10:00",
    venue: "Lord's Cricket Ground, London",
    type: "Test"
  },
  {
    id: "m4",
    title: "Big Bash League",
    teams: {
      team1: { 
        name: "Sydney Sixers", 
        logo: "https://www.cricket.com.au/-/media/Logos/Teams/BBL/Sydney-Sixers.ashx"
      },
      team2: { 
        name: "Melbourne Stars", 
        logo: "https://www.cricket.com.au/-/media/Logos/Teams/BBL/Melbourne-Stars.ashx" 
      }
    },
    status: "upcoming",
    date: "2023-06-25",
    time: "14:30",
    venue: "Sydney Cricket Ground",
    type: "T20"
  },
  {
    id: "m5",
    title: "Pakistan vs South Africa ODI Series",
    teams: {
      team1: { 
        name: "Pakistan", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Pakistan.svg/1200px-Flag_of_Pakistan.svg.png",
        score: "267/5" 
      },
      team2: { 
        name: "South Africa", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Flag_of_South_Africa.svg/1200px-Flag_of_South_Africa.svg.png",
        score: "205/8" 
      }
    },
    status: "completed",
    result: "Pakistan won by 62 runs",
    date: "2023-06-10",
    time: "13:00",
    venue: "Rawalpindi Cricket Stadium",
    type: "ODI"
  }
];

export default function MatchesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [matchType, setMatchType] = useState("all");
  
  // Fetch matches data from API
  const { data: matches, isLoading, error } = useQuery<Match[]>({
    queryKey: ["/api/cricket/matches"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Use API data or fallback to demo data if loading failed
  const matchData = matches || fallbackMatches;
  
  // Filter matches based on search query and match type
  const filteredMatches = matchData.filter(match => {
    const matchesSearch = 
      match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.teams.team1.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.teams.team2.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.venue.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (matchType === "all") return matchesSearch;
    return matchesSearch && match.type.toLowerCase() === matchType.toLowerCase();
  });

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
  return (
    <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md cursor-pointer">
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
          <Badge className="bg-red-500">LIVE</Badge>
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
        
        <div className="flex items-center justify-between mt-3 border-t border-neutral-100 pt-3">
          <div className="flex items-center text-xs text-neutral-500">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{match.venue}</span>
          </div>
          <Badge variant="outline" className="text-xs">{match.type}</Badge>
        </div>
        
        <Button className="w-full mt-3" variant="outline">
          {match.status === "live" ? "Watch Live" : match.status === "upcoming" ? "Set Reminder" : "View Highlights"}
        </Button>
      </CardContent>
    </Card>
  );
}