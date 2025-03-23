import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface MatchHistoryProps {
  matches: any[];
}

export function MatchHistory({ matches }: MatchHistoryProps) {
  if (!matches.length) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-center text-gray-500">No matches found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Match History</h2>
      {matches.map((match) => (
        <Card key={match.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{match.matchName}</h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(match.matchDate), 'dd MMM yyyy')} • {match.venue}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{match.result}</p>
                <p className="text-sm text-gray-500">
                  {match.teamScore} vs {match.opponentScore}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}