import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Trophy, MapPin, Users, User, Star, Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryFn } from "@/lib/queryClient";

type Team = {
  id: string;
  name: string;
  fullName: string;
  logo: string;
  country: string;
  type: "international" | "franchise" | "domestic";
  founded: string;
  homeGround: string;
  captain: string;
  coach: string;
  achievements: string[];
  players: string[];
  ranking?: {
    test?: number;
    odi?: number;
    t20?: number;
  };
  recentForm: string;
};

// Fallback teams data in case API fails
const fallbackTeams: Team[] = [
  {
    id: "t1",
    name: "India",
    fullName: "Indian Cricket Team",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png",
    country: "India",
    type: "international",
    founded: "1932",
    homeGround: "Multiple venues across India",
    captain: "Rohit Sharma",
    coach: "Rahul Dravid",
    achievements: ["T20 World Cup (2007)", "Cricket World Cup (1983, 2011)", "ICC Champions Trophy (2013)"],
    players: ["Rohit Sharma", "Virat Kohli", "Jasprit Bumrah", "Ravindra Jadeja", "KL Rahul"],
    ranking: {
      test: 1,
      odi: 2,
      t20: 1
    },
    recentForm: "W-W"
  },
  {
    id: "t2",
    name: "Australia",
    fullName: "Australian Cricket Team",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/1200px-Flag_of_Australia_%28converted%29.svg.png",
    country: "Australia",
    type: "international",
    founded: "1877",
    homeGround: "Melbourne Cricket Ground",
    captain: "Pat Cummins",
    coach: "Andrew McDonald",
    achievements: ["Cricket World Cup (1987, 1999, 2003, 2007, 2015, 2023)", "ICC Champions Trophy (2006, 2009)"],
    players: ["Pat Cummins", "Steve Smith", "Mitchell Starc", "Josh Hazlewood", "David Warner"],
    ranking: {
      test: 2,
      odi: 1,
      t20: 3
    },
    recentForm: "W"
  },
  {
    id: "t3",
    name: "CSK",
    fullName: "Chennai Super Kings",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png",
    country: "India",
    type: "franchise",
    founded: "2008",
    homeGround: "M. A. Chidambaram Stadium, Chennai",
    captain: "MS Dhoni",
    coach: "Stephen Fleming",
    achievements: ["IPL Champions (2010, 2011, 2018, 2021, 2023)", "Champions League T20 (2010, 2014)"],
    players: ["MS Dhoni", "Ravindra Jadeja", "Ruturaj Gaikwad", "Devon Conway", "Deepak Chahar"],
    recentForm: "W"
  },
  {
    id: "t4",
    name: "England",
    fullName: "England Cricket Team",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/1200px-Flag_of_England.svg.png",
    country: "England",
    type: "international",
    founded: "1877",
    homeGround: "Lord's Cricket Ground",
    captain: "Jos Buttler",
    coach: "Brendon McCullum",
    achievements: ["Cricket World Cup (2019)", "T20 World Cup (2022)"],
    players: ["Jos Buttler", "Joe Root", "Ben Stokes", "James Anderson", "Jonny Bairstow"],
    ranking: {
      test: 3,
      odi: 3,
      t20: 2
    },
    recentForm: "L-W"
  },
  {
    id: "t5",
    name: "RCB",
    fullName: "Royal Challengers Bangalore",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/logos/Roundbig/RCBroundbig.png",
    country: "India",
    type: "franchise",
    founded: "2008",
    homeGround: "M. Chinnaswamy Stadium, Bangalore",
    captain: "Faf du Plessis",
    coach: "Andy Flower",
    achievements: ["IPL Runners-up (2009, 2011, 2016)"],
    players: ["Virat Kohli", "Faf du Plessis", "Glenn Maxwell", "Mohammed Siraj", "Dinesh Karthik"],
    recentForm: "L"
  },
  {
    id: "t6",
    name: "Pakistan",
    fullName: "Pakistan Cricket Team",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Pakistan.svg/1200px-Flag_of_Pakistan.svg.png",
    country: "Pakistan",
    type: "international",
    founded: "1952",
    homeGround: "Gaddafi Stadium, Lahore",
    captain: "Babar Azam",
    coach: "Gary Kirsten",
    achievements: ["Cricket World Cup (1992)", "T20 World Cup (2009)", "ICC Champions Trophy (2017)"],
    players: ["Babar Azam", "Mohammad Rizwan", "Shaheen Afridi", "Shadab Khan", "Fakhar Zaman"],
    ranking: {
      test: 6,
      odi: 5,
      t20: 4
    },
    recentForm: "L-L"
  }
];

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [teamType, setTeamType] = useState("all");
  
  // Fetch teams data from API
  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ["/api/cricket/teams"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Use API data or fallback to demo data if loading failed
  const teamData = teams || fallbackTeams;
  
  // Filter teams based on search query and team type
  const filteredTeams = teamData.filter(team => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (teamType === "all") return matchesSearch;
    return matchesSearch && team.type === teamType;
  });

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header />
      
      <main className="flex-grow pt-16 pb-16 md:pb-0">
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Cricket Teams</h1>
            <p className="text-neutral-500">Follow your favorite teams from around the world</p>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input 
                placeholder="Search teams, countries..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={teamType} onValueChange={setTeamType}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="franchise">Franchise</SelectItem>
                  <SelectItem value="domestic">Domestic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Teams */}
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-[#FF5722]" />
            </div>
          ) : (
            <Tabs defaultValue="grid" className="w-full">
              <TabsList className="mb-6 w-48 justify-start bg-white border border-neutral-200 rounded-md p-1">
                <TabsTrigger value="grid" className="flex-1">Grid View</TabsTrigger>
                <TabsTrigger value="list" className="flex-1">List View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="grid">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredTeams.map(team => (
                    <TeamGridCard key={team.id} team={team} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="list">
                <div className="space-y-4">
                  {filteredTeams.map(team => (
                    <TeamListCard key={team.id} team={team} />
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

function TeamGridCard({ team }: { team: Team }) {
  return (
    <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md cursor-pointer">
      <div className="h-32 flex items-center justify-center p-4 bg-neutral-50">
        <Avatar className="h-20 w-20 rounded-md">
          <AvatarImage src={team.logo} alt={team.name} className="object-contain" />
          <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
      
      <CardContent className="p-4 text-center">
        <h3 className="font-bold text-lg mb-1">{team.name}</h3>
        <p className="text-sm text-neutral-500 mb-2">{team.fullName}</p>
        
        <div className="flex justify-center space-x-2 mb-3">
          {team.ranking?.test && (
            <Badge variant="outline" className="bg-[#f5fff8] text-[#33b956] border-[#d7ffe2]">
              Test: #{team.ranking.test}
            </Badge>
          )}
          {team.ranking?.odi && (
            <Badge variant="outline" className="bg-[#f5f8ff] text-[#3356b9] border-[#d7e2ff]">
              ODI: #{team.ranking.odi}
            </Badge>
          )}
          {team.ranking?.t20 && (
            <Badge variant="outline" className="bg-[#fff8f5] text-[#b95633] border-[#ffe2d7]">
              T20: #{team.ranking.t20}
            </Badge>
          )}
        </div>
        
        <Button variant="outline" className="w-full">Follow Team</Button>
      </CardContent>
    </Card>
  );
}

function TeamListCard({ team }: { team: Team }) {
  return (
    <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md cursor-pointer">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/4 flex items-center justify-center p-4 bg-neutral-50">
          <Avatar className="h-20 w-20 rounded-md">
            <AvatarImage src={team.logo} alt={team.name} className="object-contain" />
            <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="w-full md:w-3/4 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg">{team.name}</h3>
              <p className="text-sm text-neutral-500">{team.fullName}</p>
            </div>
            <Badge>{team.type}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="text-neutral-700">Captain: {team.captain}</span>
            </div>
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="text-neutral-700">Coach: {team.coach}</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="text-neutral-700">Home: {team.homeGround.split(',')[0]}</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="text-neutral-700">Founded: {team.founded}</span>
            </div>
          </div>
          
          {team.achievements.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center text-sm mb-1">
                <Trophy className="h-4 w-4 mr-2 text-[#FFC107]" />
                <span className="font-medium">Key Achievements</span>
              </div>
              <p className="text-xs text-neutral-600 pl-6">{team.achievements.slice(0, 2).join(", ")}{team.achievements.length > 2 ? "..." : ""}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {team.ranking?.test && (
                <Badge variant="outline" className="bg-[#f5fff8] text-[#33b956] border-[#d7ffe2]">
                  Test: #{team.ranking.test}
                </Badge>
              )}
              {team.ranking?.odi && (
                <Badge variant="outline" className="bg-[#f5f8ff] text-[#3356b9] border-[#d7e2ff]">
                  ODI: #{team.ranking.odi}
                </Badge>
              )}
              {team.ranking?.t20 && (
                <Badge variant="outline" className="bg-[#fff8f5] text-[#b95633] border-[#ffe2d7]">
                  T20: #{team.ranking.t20}
                </Badge>
              )}
            </div>
            <Button variant="outline">Follow Team</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}