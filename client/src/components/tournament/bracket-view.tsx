import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChevronRight } from "lucide-react";

interface Team {
  id: number;
  name: string;
  shortName?: string;
  logo?: string;
}

interface Match {
  id: number;
  tournamentId: number;
  matchNumber: number;
  stage: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home_team_score?: string;
  away_team_score?: string;
  result?: string;
  status: string;
  homeTeam?: Team;
  awayTeam?: Team;
}

interface BracketViewProps {
  tournamentId: number;
  teams?: Team[];
}

export function BracketView({ tournamentId, teams = [] }: BracketViewProps) {
  const { data: matches, isLoading } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/matches`],
    queryFn: async () => {
      return await apiRequest('GET', `/api/tournaments/${tournamentId}/matches`);
    },
    enabled: !!tournamentId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Filter knockout matches
  const knockoutMatches = (matches as Match[] || []).filter(m => 
    m.stage === 'quarter-final' || 
    m.stage === 'semi-final' || 
    m.stage === 'final'
  );

  if (knockoutMatches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Knockout Matches</h3>
          <p className="text-muted-foreground">
            Knockout stage matches will appear here once generated.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group matches by stage
  const quarterFinals = knockoutMatches.filter(m => m.stage === 'quarter-final');
  const semiFinals = knockoutMatches.filter(m => m.stage === 'semi-final');
  const finals = knockoutMatches.filter(m => m.stage === 'final');

  const getTeamName = (teamId: number | null) => {
    if (!teamId) return "TBD";
    const team = teams.find(t => t.id === teamId);
    return team?.shortName || team?.name || "TBD";
  };

  const getTeamLogo = (teamId: number | null) => {
    if (!teamId) return null;
    const team = teams.find(t => t.id === teamId);
    return team?.logo;
  };

  const isWinner = (match: Match, teamId: number | null) => {
    if (!teamId || match.status !== 'completed') return false;
    if (match.result === 'home_win' && match.home_team_id === teamId) return true;
    if (match.result === 'away_win' && match.away_team_id === teamId) return true;
    return false;
  };

  const MatchCard = ({ match }: { match: Match }) => {
    const homeWinner = isWinner(match, match.home_team_id);
    const awayWinner = isWinner(match, match.away_team_id);

    return (
      <div className="bg-card border rounded-lg p-3 min-w-[180px] shadow-sm">
        <div className="text-xs text-muted-foreground mb-2 text-center capitalize">
          {match.stage?.replace('-', ' ')}
        </div>
        
        {/* Home Team */}
        <div className={`flex items-center justify-between p-2 rounded ${homeWinner ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted/50'}`}>
          <div className="flex items-center gap-2">
            {getTeamLogo(match.home_team_id) ? (
              <img 
                src={getTeamLogo(match.home_team_id)!} 
                alt="" 
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                {getTeamName(match.home_team_id).charAt(0)}
              </div>
            )}
            <span className={`text-sm ${homeWinner ? 'font-bold' : ''}`}>
              {getTeamName(match.home_team_id)}
            </span>
          </div>
          {match.home_team_score && (
            <span className={`text-sm font-mono ${homeWinner ? 'font-bold' : ''}`}>
              {match.home_team_score.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className={`flex items-center justify-between p-2 rounded mt-1 ${awayWinner ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted/50'}`}>
          <div className="flex items-center gap-2">
            {getTeamLogo(match.away_team_id) ? (
              <img 
                src={getTeamLogo(match.away_team_id)!} 
                alt="" 
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                {getTeamName(match.away_team_id).charAt(0)}
              </div>
            )}
            <span className={`text-sm ${awayWinner ? 'font-bold' : ''}`}>
              {getTeamName(match.away_team_id)}
            </span>
          </div>
          {match.away_team_score && (
            <span className={`text-sm font-mono ${awayWinner ? 'font-bold' : ''}`}>
              {match.away_team_score.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-2 text-center">
          {match.status === 'completed' ? (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Completed
            </Badge>
          ) : match.status === 'live' ? (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 animate-pulse">
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Scheduled
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const Connector = () => (
    <div className="flex items-center justify-center px-2">
      <div className="w-8 h-px bg-border"></div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <div className="w-8 h-px bg-border"></div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Knockout Bracket
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex items-center justify-center gap-4 min-w-max py-4">
            {/* Quarter Finals */}
            {quarterFinals.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="text-center text-sm font-medium text-muted-foreground mb-2">
                  Quarter Finals
                </div>
                {quarterFinals.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}

            {quarterFinals.length > 0 && semiFinals.length > 0 && <Connector />}

            {/* Semi Finals */}
            {semiFinals.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="text-center text-sm font-medium text-muted-foreground mb-2">
                  Semi Finals
                </div>
                {semiFinals.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}

            {semiFinals.length > 0 && finals.length > 0 && <Connector />}

            {/* Final */}
            {finals.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="text-center text-sm font-medium text-muted-foreground mb-2">
                  <Trophy className="h-4 w-4 inline mr-1 text-yellow-500" />
                  Final
                </div>
                {finals.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            Winner
          </span>
          <span>TBD = To Be Determined</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default BracketView;
