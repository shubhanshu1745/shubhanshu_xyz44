import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, CalendarDays, Clock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";

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

export function MatchHighlights() {
  const { data: matches, isLoading, error } = useQuery<MatchHighlight[]>({
    queryKey: ["/api/cricket/matches"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-[#FF5722]" />
            <CardTitle className="text-lg font-bold">Match Highlights</CardTitle>
          </div>
          <Link href="/matches">
            <Button variant="ghost" size="sm" className="text-sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF5722]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-red-500 font-medium">Unable to load match data</p>
            <p className="text-sm text-neutral-500 mt-1">Please check your connection and try again later</p>
          </div>
        ) : !matches || matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="p-3 rounded-full bg-neutral-100 mb-2">
              <Trophy className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-neutral-500">No matches available at the moment</p>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </TabsContent>
            
            <TabsContent value="live" className="space-y-4">
              {matches
                .filter((match) => match.status === "live")
                .map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
            </TabsContent>
            
            <TabsContent value="upcoming" className="space-y-4">
              {matches
                .filter((match) => match.status === "upcoming")
                .map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {matches
                .filter((match) => match.status === "completed")
                .map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
            </TabsContent>
          </Tabs>
        )}
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