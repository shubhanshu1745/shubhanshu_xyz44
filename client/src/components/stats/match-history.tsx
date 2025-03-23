
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";

interface MatchHistoryProps {
  matches: Array<{
    id: number;
    matchName: string;
    matchDate: string;
    venue: string;
    opponent: string;
    result: string;
    matchType: string;
    teamScore: string;
    opponentScore: string;
  }>;
}

export default function MatchHistory({ matches }: MatchHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Match History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="border-b last:border-0 pb-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{match.matchName}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(match.matchDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    {match.venue}
                  </div>
                </div>
                <Badge variant={match.result === "Win" ? "success" : "destructive"}>
                  {match.result}
                </Badge>
              </div>
              <div className="text-sm">
                <div>{match.teamScore} vs {match.opponentScore}</div>
                <Badge variant="outline" className="mt-2">{match.matchType}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
