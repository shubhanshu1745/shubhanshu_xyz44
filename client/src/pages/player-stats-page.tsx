
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { StatsOverview } from "@/components/stats/stats-overview";
import { MatchHistory } from "@/components/stats/match-history";
import { Loader2 } from "lucide-react";

export default function PlayerStatsPage() {
  const { user } = useAuth();

  const { data: playerStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/users', user?.username, 'player-stats'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
    staleTime: 30000,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/users', user?.username, 'matches'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
    staleTime: 30000,
  });

  if (statsLoading || matchesLoading) {
    return <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Player Statistics</h1>
      <StatsOverview stats={playerStats} />
      <MatchHistory matches={matches || []} />
    </div>
  );
}
