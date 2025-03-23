
import { PlayerStats } from "@shared/schema";
import { StatsCard } from "./StatsCard";

interface StatsOverviewProps {
  stats: PlayerStats | null;
  isLoading: boolean;
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <StatsCard title="Batting Stats" stats={stats} isLoading={isLoading}>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Innings</span>
            <span className="font-semibold">{stats?.innings || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Runs</span>
            <span className="font-semibold">{stats?.totalRuns || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Average</span>
            <span className="font-semibold">{stats?.battingAverage || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Strike Rate</span>
            <span className="font-semibold">{stats?.strikeRate || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Highest Score</span>
            <span className="font-semibold">{stats?.highestScore || 0}</span>
          </div>
        </div>
      </StatsCard>

      <StatsCard title="Bowling Stats" stats={stats} isLoading={isLoading}>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Wickets</span>
            <span className="font-semibold">{stats?.totalWickets || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Economy</span>
            <span className="font-semibold">{stats?.economyRate || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Average</span>
            <span className="font-semibold">{stats?.bowlingAverage || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Best Figures</span>
            <span className="font-semibold">{stats?.bestBowling || "0/0"}</span>
          </div>
        </div>
      </StatsCard>

      <StatsCard title="Career Stats" stats={stats} isLoading={isLoading}>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Matches</span>
            <span className="font-semibold">{stats?.totalMatches || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">50s</span>
            <span className="font-semibold">{stats?.fifties || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">100s</span>
            <span className="font-semibold">{stats?.hundreds || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Catches</span>
            <span className="font-semibold">{stats?.totalCatches || 0}</span>
          </div>
        </div>
      </StatsCard>
    </div>
  );
}
