import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import StatsOverview from "@/components/stats/stats-overview";
import MatchHistory from "@/components/stats/match-history";
import { useUser } from "@/lib/hooks/use-user";

export default function PlayerStatsPage() {
  const { user } = useUser();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/users', user?.username, 'player-stats'],
    enabled: !!user
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/users', user?.username, 'matches'],
    enabled: !!user
  });

  if (statsLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Player Statistics</h1>

      {stats && <StatsOverview stats={stats} />}

      {matches && matches.length > 0 ? (
        <MatchHistory matches={matches} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No matches recorded yet
        </div>
      )}
    </div>
  );
}