
import { PlayerStats } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Bat, Ball } from "lucide-react";

interface StatsOverviewProps {
  stats: PlayerStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-medium">
            <Trophy className="w-4 h-4 mr-2" />
            Career
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMatches} Matches</div>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.position || "All Rounder"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-medium">
            <Bat className="w-4 h-4 mr-2" />
            Batting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRuns}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Avg: {stats.battingAverage}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-medium">
            <Ball className="w-4 h-4 mr-2" />
            Bowling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWickets}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Best: {stats.bestBowling}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
