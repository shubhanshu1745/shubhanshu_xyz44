import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Team {
  id: number;
  name: string;
  shortName?: string;
  logo?: string;
}

interface Standing {
  id: number;
  tournamentId: number;
  teamId: number;
  team?: Team;
  position: number;
  played: number;
  won: number;
  lost: number;
  tied: number;
  no_result: number;
  points: number;
  netRunRate: string;
  forRuns: number;
  forOvers: string;
  againstRuns: number;
  againstOvers: string;
  formGuide?: string[];
  nrrFormatted?: string;
}

interface StandingsTableProps {
  tournamentId: number;
  qualifyingPositions?: number;
  showFormGuide?: boolean;
}

export function StandingsTable({ 
  tournamentId, 
  qualifyingPositions = 4,
  showFormGuide = true 
}: StandingsTableProps) {
  const { data: standings, isLoading, error } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/enhanced-standings`],
    queryFn: async () => {
      return await apiRequest('GET', `/api/tournaments/${tournamentId}/enhanced-standings`);
    },
    enabled: !!tournamentId
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error || !standings) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load standings
      </div>
    );
  }

  const getFormBadge = (result: string) => {
    switch (result) {
      case 'W':
        return <Badge className="bg-green-500 hover:bg-green-600 w-6 h-6 p-0 flex items-center justify-center text-xs">W</Badge>;
      case 'L':
        return <Badge className="bg-red-500 hover:bg-red-600 w-6 h-6 p-0 flex items-center justify-center text-xs">L</Badge>;
      case 'T':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 w-6 h-6 p-0 flex items-center justify-center text-xs">T</Badge>;
      case 'N':
        return <Badge className="bg-gray-500 hover:bg-gray-600 w-6 h-6 p-0 flex items-center justify-center text-xs">N</Badge>;
      default:
        return <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">-</Badge>;
    }
  };

  const getNRRColor = (nrr: string) => {
    const value = parseFloat(nrr);
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center w-12">P</TableHead>
            <TableHead className="text-center w-12">W</TableHead>
            <TableHead className="text-center w-12">L</TableHead>
            <TableHead className="text-center w-12">T</TableHead>
            <TableHead className="text-center w-12">N/R</TableHead>
            <TableHead className="text-center w-20">NRR</TableHead>
            <TableHead className="text-center w-16">Pts</TableHead>
            {showFormGuide && <TableHead className="text-center">Form</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(standings as Standing[]).map((standing, index) => {
            const isQualified = standing.position <= qualifyingPositions;
            
            return (
              <TableRow 
                key={standing.id}
                className={isQualified ? "bg-green-50 dark:bg-green-950/20" : ""}
              >
                <TableCell className="text-center font-medium">
                  <div className="flex items-center justify-center gap-1">
                    {standing.position === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    {standing.position}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {standing.team?.logo ? (
                      <img 
                        src={standing.team.logo} 
                        alt={standing.team.name} 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {standing.team?.shortName?.charAt(0) || standing.team?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{standing.team?.name || 'Unknown Team'}</div>
                      {standing.team?.shortName && (
                        <div className="text-xs text-muted-foreground">{standing.team.shortName}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">{standing.played}</TableCell>
                <TableCell className="text-center font-medium text-green-600">{standing.won}</TableCell>
                <TableCell className="text-center text-red-600">{standing.lost}</TableCell>
                <TableCell className="text-center text-yellow-600">{standing.tied}</TableCell>
                <TableCell className="text-center text-gray-600">{standing.no_result}</TableCell>
                <TableCell className={`text-center font-mono text-sm ${getNRRColor(standing.nrrFormatted || standing.netRunRate)}`}>
                  {standing.nrrFormatted || (parseFloat(standing.netRunRate) >= 0 ? '+' : '') + parseFloat(standing.netRunRate).toFixed(3)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={isQualified ? "default" : "secondary"} className="font-bold">
                    {standing.points}
                  </Badge>
                </TableCell>
                {showFormGuide && (
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      {standing.formGuide && standing.formGuide.length > 0 ? (
                        standing.formGuide.map((result, i) => (
                          <span key={i}>{getFormBadge(result)}</span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Legend */}
      <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground flex flex-wrap gap-4">
        <span>P = Played</span>
        <span>W = Won</span>
        <span>L = Lost</span>
        <span>T = Tied</span>
        <span>N/R = No Result</span>
        <span>NRR = Net Run Rate</span>
        <span>Pts = Points</span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 rounded"></div>
          Qualified
        </span>
      </div>
    </div>
  );
}

export default StandingsTable;
