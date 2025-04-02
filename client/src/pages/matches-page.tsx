import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchHistory } from "@/components/match-history";
import { Calendar, MapPin, Clock, Trophy, AlertCircle } from "lucide-react";

interface Team {
  name: string;
  logo: string;
  score?: string;
}

interface MatchData {
  id: string;
  title: string;
  teams: {
    team1: Team;
    team2: Team;
  };
  status: "upcoming" | "live" | "completed";
  result?: string;
  date: string;
  time: string;
  venue: string;
  type: string;
  imageUrl?: string;
}

export default function MatchesPage() {
  const [filterType, setFilterType] = useState('all');
  
  // Fetch live matches
  const { 
    data: liveMatches, 
    isLoading: isLoadingLive, 
    error: liveError
  } = useQuery<MatchData[]>({
    queryKey: ['/api/match/live'],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Apply filters to matches
  const filteredLiveMatches = liveMatches ? 
    (filterType === 'all' ? 
      liveMatches : 
      liveMatches.filter(match => match.type.toLowerCase().includes(filterType.toLowerCase()))
    ) : [];
  
  return (
    <div className="container max-w-6xl mx-auto p-4 mt-4">
      <h1 className="text-3xl font-bold mb-6">Cricket Matches</h1>
      
      {/* Match type filter */}
      <div className="mb-8">
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="all">All Formats</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="odi">ODI</TabsTrigger>
            <TabsTrigger value="t20">T20</TabsTrigger>
            <TabsTrigger value="league">Leagues</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Live matches section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Live Matches</h2>
        {liveError ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Failed to load live matches</p>
                <p className="text-muted-foreground">Please try again later</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {isLoadingLive ? (
              // Loading skeletons
              <div className="grid grid-cols-1 gap-4">
                {Array(2).fill(0).map((_, i) => (
                  <LiveMatchSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {filteredLiveMatches.length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className="text-lg font-medium">No live matches right now</p>
                        <p className="text-muted-foreground">Check back later for live match updates</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredLiveMatches.map(match => (
                      <LiveMatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
      
      {/* Recent matches section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Matches</h2>
        <MatchHistory />
      </section>
    </div>
  );
}

function LiveMatchCard({ match }: { match: MatchData }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{match.title}</CardTitle>
          <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-medium animate-pulse">
            LIVE
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{match.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{match.time}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{match.venue}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Team 1 */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <img 
              src={match.teams.team1.logo} 
              alt={match.teams.team1.name} 
              className="w-16 h-16 object-contain mb-2"
            />
            <h3 className="font-semibold text-lg">{match.teams.team1.name}</h3>
            {match.teams.team1.score && (
              <p className="text-lg font-bold text-primary">{match.teams.team1.score}</p>
            )}
          </div>
          
          {/* Match status */}
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3 text-lg font-bold">
              vs
            </div>
            {match.result && (
              <div className="p-2 border rounded mb-2 text-sm max-w-[200px] text-center">
                {match.result}
              </div>
            )}
            <a 
              href={`/matches/${match.id}`} 
              className="text-primary text-sm font-medium hover:underline mt-2"
            >
              View details
            </a>
          </div>
          
          {/* Team 2 */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <img 
              src={match.teams.team2.logo} 
              alt={match.teams.team2.name} 
              className="w-16 h-16 object-contain mb-2"
            />
            <h3 className="font-semibold text-lg">{match.teams.team2.name}</h3>
            {match.teams.team2.score && (
              <p className="text-lg font-bold text-primary">{match.teams.team2.score}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveMatchSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-3 mt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Team 1 skeleton */}
          <div className="flex flex-col items-center md:items-end">
            <Skeleton className="w-16 h-16 rounded-full mb-2" />
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-7 w-24" />
          </div>
          
          {/* Middle skeleton */}
          <div className="flex flex-col items-center justify-center">
            <Skeleton className="w-10 h-10 rounded-full mb-3" />
            <Skeleton className="h-10 w-32 rounded mb-2" />
            <Skeleton className="h-5 w-24 mt-2" />
          </div>
          
          {/* Team 2 skeleton */}
          <div className="flex flex-col items-center md:items-start">
            <Skeleton className="w-16 h-16 rounded-full mb-2" />
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}