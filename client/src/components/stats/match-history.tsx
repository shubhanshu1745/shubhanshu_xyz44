
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon, Timer, Trophy, TrendingUp, Target, CircleDot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface MatchPerformance {
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  oversBowled: string;
  runsConceded: number;
  wicketsTaken: number;
  maidens: number;
  catches: number;
  runOuts: number;
  battingStatus?: string;
  stumpings?: number;
}

interface Match {
  id: number;
  userId: number;
  matchName: string;
  matchDate: string;
  venue?: string;
  opponent: string;
  matchType?: string;
  teamScore?: string;
  opponentScore?: string;
  result?: string;
  performance?: MatchPerformance;
  createdAt?: string;
}

interface MatchHistoryProps {
  matches: Match[];
}

export function MatchHistory({ matches = [] }: MatchHistoryProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-medium text-gray-500">No match history found</h3>
        <p className="text-sm text-gray-400 mt-2">
          Add your first match to start tracking your cricket performance
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Match History</h2>
        <Badge variant="outline" className="px-3 py-1">
          {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
        </Badge>
      </div>
      
      <div className="grid gap-6">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{match.matchName}</CardTitle>
                <Badge 
                  variant={
                    match.result?.toLowerCase().includes('won') ? 'default' :
                    match.result?.toLowerCase().includes('lost') ? 'destructive' : 'secondary'
                  }
                  className={match.result?.toLowerCase().includes('won') ? 'bg-green-600' : ''}
                >
                  {match.result || 'Match Recorded'}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>
                    {match.matchDate ? format(new Date(match.matchDate), 'PP') : 'Date not available'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  <span>{match.venue || 'Venue not specified'}</span>
                </div>
                {match.matchType && (
                  <div className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    <span>{match.matchType}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4 py-3">
                <div className="text-center border-r">
                  <div className="text-sm font-medium mb-1">Your Team</div>
                  <div className="text-xl font-bold">{match.teamScore || '-'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium mb-1">{match.opponent}</div>
                  <div className="text-xl font-bold">{match.opponentScore || '-'}</div>
                </div>
              </div>
              
              {match.performance && (
                <>
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Your Performance
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h5 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <CircleDot className="h-3.5 w-3.5" />
                          Batting
                        </h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Runs</span>
                            <div className="font-semibold">{match.performance.runsScored}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Balls</span>
                            <div className="font-semibold">{match.performance.ballsFaced}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">4s</span>
                            <div className="font-semibold">{match.performance.fours}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">6s</span>
                            <div className="font-semibold">{match.performance.sixes}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" />
                          Bowling
                        </h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Wickets</span>
                            <div className="font-semibold">{match.performance.wicketsTaken}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Runs</span>
                            <div className="font-semibold">{match.performance.runsConceded}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Overs</span>
                            <div className="font-semibold">{match.performance.oversBowled}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Maidens</span>
                            <div className="font-semibold">{match.performance.maidens}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(match.performance.catches > 0 || match.performance.runOuts > 0) && (
                      <div className="pt-2">
                        <h5 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Fielding
                        </h5>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Catches: </span>
                            <span className="font-semibold">{match.performance.catches}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Run Outs: </span>
                            <span className="font-semibold">{match.performance.runOuts}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
