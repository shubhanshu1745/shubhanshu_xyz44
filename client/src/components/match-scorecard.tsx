import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Trophy,
  AlignLeft
} from "lucide-react";

interface BattingScore {
  batsman: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal: string;
}

interface BowlingFigure {
  bowler: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

interface Innings {
  team: string;
  score: string;
  wickets: number;
  overs: string;
  battingScores: BattingScore[];
  bowlingFigures: BowlingFigure[];
}

interface MatchDetails {
  title: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  time: string;
  teams: {
    team1: { name: string; logo: string; score: string; };
    team2: { name: string; logo: string; score: string; };
  };
  result: string;
  scorecard: {
    innings: Innings[];
  };
}

interface MatchScorecardProps {
  matchId: string;
}

export function MatchScorecard({ matchId }: MatchScorecardProps) {
  const { data: match, isLoading, error } = useQuery<MatchDetails>({
    queryKey: ['/api/match/details', matchId],
    staleTime: 60 * 1000, // 1 minute, refresh more often for live matches
  });
  
  // Get unique team names from innings
  const teams = match?.scorecard.innings.map(inn => inn.team).filter((team, index, self) => 
    self.indexOf(team) === index
  ) || [];

  if (error) {
    return (
      <div className="w-full p-4 text-center">
        <p>Failed to load match details. Please try again later.</p>
      </div>
    );
  }

  if (isLoading) {
    return <MatchScorecardSkeleton />;
  }

  if (!match) {
    return (
      <div className="w-full p-4 text-center">
        <p>Match not found</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Match header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{match.title}</CardTitle>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
            <div className="flex items-center">
              <AlignLeft className="h-4 w-4 mr-1" />
              <span>{match.matchType}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{match.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{match.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{match.venue}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {/* Teams and scores overview */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center py-4">
            {/* Team 1 */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right">
              <img 
                src={match.teams.team1.logo} 
                alt={match.teams.team1.name} 
                className="w-16 h-16 object-contain mb-2"
              />
              <h3 className="font-semibold text-lg">{match.teams.team1.name}</h3>
              <p className="text-md font-medium">{match.teams.team1.score}</p>
            </div>
            
            {/* Match status */}
            <div className="flex flex-col items-center justify-center text-center px-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2 text-lg font-bold">
                vs
              </div>
              <div className="flex items-center mb-1">
                <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                <span className="text-sm">{match.result}</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {match.status}
              </span>
            </div>
            
            {/* Team 2 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <img 
                src={match.teams.team2.logo} 
                alt={match.teams.team2.name} 
                className="w-16 h-16 object-contain mb-2"
              />
              <h3 className="font-semibold text-lg">{match.teams.team2.name}</h3>
              <p className="text-md font-medium">{match.teams.team2.score}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Scorecard */}
      <Card>
        <CardHeader>
          <CardTitle>Scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={teams[0] || "team1"}>
            <TabsList className="w-full mb-4">
              {teams.map(team => (
                <TabsTrigger 
                  key={team} 
                  value={team}
                  className="flex-1"
                >
                  {team}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {teams.map(team => (
              <TabsContent key={team} value={team}>
                {match.scorecard.innings
                  .filter(inn => inn.team === team)
                  .map((inn, innIndex) => (
                    <div key={innIndex} className="space-y-6 mb-8">
                      <h3 className="font-semibold text-lg">
                        {inn.team} - {inn.score} ({inn.overs} overs)
                      </h3>
                      
                      {/* Batting */}
                      <div>
                        <h4 className="font-medium mb-2">Batting</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead className="bg-muted">
                              <tr>
                                <th className="p-2 text-left font-medium">Batter</th>
                                <th className="p-2 text-right font-medium">Runs</th>
                                <th className="p-2 text-right font-medium">Balls</th>
                                <th className="p-2 text-right font-medium">4s</th>
                                <th className="p-2 text-right font-medium">6s</th>
                                <th className="p-2 text-right font-medium">SR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inn.battingScores.map((score, index) => (
                                <tr key={index} className="border-b border-muted">
                                  <td className="p-2">
                                    <div>
                                      <div className="font-medium">{score.batsman}</div>
                                      <div className="text-xs text-muted-foreground">{score.dismissal}</div>
                                    </div>
                                  </td>
                                  <td className="p-2 text-right font-medium">{score.runs}</td>
                                  <td className="p-2 text-right">{score.balls}</td>
                                  <td className="p-2 text-right">{score.fours}</td>
                                  <td className="p-2 text-right">{score.sixes}</td>
                                  <td className="p-2 text-right">{score.strikeRate.toFixed(1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Bowling */}
                      <div>
                        <h4 className="font-medium mb-2">Bowling</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead className="bg-muted">
                              <tr>
                                <th className="p-2 text-left font-medium">Bowler</th>
                                <th className="p-2 text-right font-medium">O</th>
                                <th className="p-2 text-right font-medium">M</th>
                                <th className="p-2 text-right font-medium">R</th>
                                <th className="p-2 text-right font-medium">W</th>
                                <th className="p-2 text-right font-medium">Econ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inn.bowlingFigures.map((figure, index) => (
                                <tr key={index} className="border-b border-muted">
                                  <td className="p-2 font-medium">{figure.bowler}</td>
                                  <td className="p-2 text-right">{figure.overs}</td>
                                  <td className="p-2 text-right">{figure.maidens}</td>
                                  <td className="p-2 text-right">{figure.runs}</td>
                                  <td className="p-2 text-right font-medium">{figure.wickets}</td>
                                  <td className="p-2 text-right">{figure.economy.toFixed(1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function MatchScorecardSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Match header skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex flex-wrap gap-3 mt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            {/* Team 1 */}
            <div className="flex flex-col items-center md:items-end">
              <Skeleton className="w-16 h-16 rounded-full mb-2" />
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            
            {/* Match status */}
            <div className="flex flex-col items-center justify-center">
              <Skeleton className="w-10 h-10 rounded-full mb-2" />
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            
            {/* Team 2 */}
            <div className="flex flex-col items-center md:items-start">
              <Skeleton className="w-16 h-16 rounded-full mb-2" />
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Scorecard skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          
          <div className="space-y-6">
            <Skeleton className="h-6 w-1/2 mb-4" />
            
            {/* Batting skeleton */}
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
            
            {/* Bowling skeleton */}
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MatchScorecard;