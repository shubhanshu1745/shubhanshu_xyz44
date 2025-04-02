import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  ArrowUpRight, 
  Trophy, 
  MapPin 
} from "lucide-react";

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

export function MatchHistory() {
  const { data: matches, isLoading, error } = useQuery<MatchData[]>({
    queryKey: ['/api/match/recent'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter matches by cricket format
  const testMatches = matches?.filter(match => match.type.includes("Test")) || [];
  const odiMatches = matches?.filter(match => match.type.includes("ODI")) || [];
  const t20Matches = matches?.filter(match => match.type.includes("T20")) || [];

  if (error) {
    return (
      <div className="w-full p-4 text-center">
        <p>Failed to load match history. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Recent Matches</h2>
        <a href="/matches" className="text-sm text-primary flex items-center hover:underline">
          View All <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="odi">ODI</TabsTrigger>
          <TabsTrigger value="t20">T20</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {renderMatchCards(matches, isLoading)}
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4 mt-4">
          {renderMatchCards(testMatches, isLoading)}
        </TabsContent>
        
        <TabsContent value="odi" className="space-y-4 mt-4">
          {renderMatchCards(odiMatches, isLoading)}
        </TabsContent>
        
        <TabsContent value="t20" className="space-y-4 mt-4">
          {renderMatchCards(t20Matches, isLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to render match cards
function renderMatchCards(matches: MatchData[] | undefined, isLoading: boolean) {
  if (isLoading) {
    return Array(3).fill(0).map((_, i) => (
      <MatchCardSkeleton key={i} />
    ));
  }
  
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No matches found</p>
      </div>
    );
  }
  
  return matches.map(match => (
    <MatchCard key={match.id} match={match} />
  ));
}

// Match Card Component
function MatchCard({ match }: { match: MatchData }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* Team 1 */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <img 
              src={match.teams.team1.logo} 
              alt={match.teams.team1.name} 
              className="w-12 h-12 object-contain mb-2"
            />
            <h3 className="font-semibold">{match.teams.team1.name}</h3>
            {match.teams.team1.score && (
              <p className="text-sm font-medium">{match.teams.team1.score}</p>
            )}
          </div>
          
          {/* Match info */}
          <div className="flex flex-col items-center justify-center text-center px-4">
            <span className="px-3 py-1 rounded-full bg-accent text-xs font-medium mb-3">
              {match.type}
            </span>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-2">
              vs
            </div>
            {match.result && (
              <div className="flex items-center text-xs mb-2">
                <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                <span className="line-clamp-2 text-center">{match.result}</span>
              </div>
            )}
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{match.date}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="line-clamp-1">{match.venue}</span>
            </div>
          </div>
          
          {/* Team 2 */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <img 
              src={match.teams.team2.logo} 
              alt={match.teams.team2.name} 
              className="w-12 h-12 object-contain mb-2"
            />
            <h3 className="font-semibold">{match.teams.team2.name}</h3>
            {match.teams.team2.score && (
              <p className="text-sm font-medium">{match.teams.team2.score}</p>
            )}
          </div>
        </div>
        
        {/* Match image if available */}
        {match.imageUrl && (
          <div className="w-full h-40 overflow-hidden">
            <img 
              src={match.imageUrl} 
              alt={match.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton loading state
function MatchCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Team 1 skeleton */}
        <div className="flex flex-col items-center md:items-end">
          <Skeleton className="w-12 h-12 rounded-full mb-2" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        
        {/* Match info skeleton */}
        <div className="flex flex-col items-center justify-center">
          <Skeleton className="h-6 w-16 rounded-full mb-3" />
          <Skeleton className="w-8 h-8 rounded-full mb-2" />
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
        
        {/* Team 2 skeleton */}
        <div className="flex flex-col items-center md:items-start">
          <Skeleton className="w-12 h-12 rounded-full mb-2" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export default MatchHistory;