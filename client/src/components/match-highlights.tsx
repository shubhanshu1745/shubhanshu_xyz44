import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, CalendarDays, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type MatchHighlight = {
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

const demoHighlights: MatchHighlight[] = [
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
  }
];

export function MatchHighlights() {
  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-[#FF5722]" />
            <CardTitle className="text-lg font-bold">Match Highlights</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-sm">
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {demoHighlights.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </TabsContent>
          
          <TabsContent value="live" className="space-y-4">
            {demoHighlights
              .filter((match) => match.status === "live")
              .map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-4">
            {demoHighlights
              .filter((match) => match.status === "upcoming")
              .map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {demoHighlights
              .filter((match) => match.status === "completed")
              .map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MatchCard({ match }: { match: MatchHighlight }) {
  return (
    <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md cursor-pointer">
      <div className="flex items-center p-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">{match.title}</h3>
            {match.status === "live" ? (
              <Badge className="bg-red-500">LIVE</Badge>
            ) : match.status === "upcoming" ? (
              <Badge variant="outline" className="text-neutral-500">Upcoming</Badge>
            ) : (
              <Badge variant="outline" className="text-neutral-500">Completed</Badge>
            )}
          </div>
          
          <div className="flex items-center mb-3">
            <div className="flex items-center justify-end flex-1">
              <span className="font-semibold text-sm mr-2">{match.teams.team1.name}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={match.teams.team1.logo} />
                <AvatarFallback>{match.teams.team1.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            
            <div className="mx-2 text-center flex flex-col">
              {match.status === "live" || match.status === "completed" ? (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs font-bold">{match.teams.team1.score}</span>
                  <span className="text-xs text-neutral-500">vs</span>
                  <span className="text-xs font-bold">{match.teams.team2.score}</span>
                </div>
              ) : (
                <span className="text-xs text-neutral-500">vs</span>
              )}
            </div>
            
            <div className="flex items-center flex-1">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={match.teams.team2.logo} />
                <AvatarFallback>{match.teams.team2.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">{match.teams.team2.name}</span>
            </div>
          </div>
          
          {match.result && (
            <p className="text-xs text-center text-[#FF5722] font-medium mb-2">{match.result}</p>
          )}
          
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center">
              <CalendarDays className="h-3 w-3 mr-1" />
              <span>{new Date(match.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{match.time}</span>
            </div>
            <Badge variant="outline" className="text-xs">{match.type}</Badge>
          </div>
        </div>
        
        {match.imageUrl && (
          <div className="ml-4 hidden md:block">
            <img 
              src={match.imageUrl} 
              alt={match.title} 
              className="h-24 w-24 object-cover rounded-md"
            />
          </div>
        )}
      </div>
    </Card>
  );
}