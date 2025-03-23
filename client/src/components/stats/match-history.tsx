
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";
import { Medal, Calendar, MapPin, Trophy, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MatchHistoryProps {
  matches: any[];
}

export function MatchHistory({ matches }: MatchHistoryProps) {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

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
        <Card 
          key={match.id} 
          className={`transition-all duration-300 hover:shadow-lg ${
            expandedMatch === match.id ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <CardHeader className="p-4 bg-gradient-to-r from-[#1F3A8A] to-[#2563EB] text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{match.matchName}</h3>
              <Badge className="bg-white text-[#1F3A8A]">
                {match.format || 'T20'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {format(new Date(match.matchDate), 'dd MMM yyyy')}
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {match.venue}
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
              <div className="text-center">
                <p className="font-bold text-lg">{match.teamScore}</p>
                <p className="text-sm text-gray-600">Your Team</p>
              </div>
              <div className="text-2xl font-bold text-gray-400">VS</div>
              <div className="text-center">
                <p className="font-bold text-lg">{match.opponentScore}</p>
                <p className="text-sm text-gray-600">Opponent</p>
              </div>
            </div>

            {expandedMatch === match.id && match.performance && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Cricket className="h-5 w-5 mr-2 text-[#1F3A8A]" />
                  Personal Performance
                </h4>
                <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Runs</p>
                    <p className="font-bold text-lg text-[#1F3A8A]">
                      {match.performance.runsScored}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Wickets</p>
                    <p className="font-bold text-lg text-[#1F3A8A]">
                      {match.performance.wicketsTaken}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Catches</p>
                    <p className="font-bold text-lg text-[#1F3A8A]">
                      {match.performance.catches}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
            >
              {expandedMatch === match.id ? 'Show Less' : 'View Details'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
