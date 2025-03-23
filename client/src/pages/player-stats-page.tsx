import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import { PlayerStats, PlayerMatch, PlayerMatchPerformance, User } from "@shared/schema";
import { StatsOverview } from "@/components/stats/stats-overview";
import { MatchHistory } from "@/components/stats/match-history";
import { PerformanceTrends } from "@/components/stats/performance-trends";
import { PlayerProfile } from "@/components/stats/player-profile";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";

type PlayerWithStats = {
  user: User;
  stats: PlayerStats;
  matches: (PlayerMatch & { performance?: PlayerMatchPerformance })[];
};

export default function PlayerStatsPage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();

  const { data: playerData, isLoading } = useQuery<PlayerWithStats>({
    queryKey: [`/api/users/${username}/full-stats`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!username && !!currentUser,
    staleTime: 30000,
  });

  if (!currentUser) {
    return <div>Please log in to view stats</div>;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!playerData || !playerData.stats) {
    return <div>No stats available</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <PlayerProfile user={playerData.user} stats={playerData.stats} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <StatsOverview stats={playerData.stats} />
          <PerformanceTrends matches={playerData.matches} />
        </div>

        <div className="mt-8">
          <MatchHistory matches={playerData.matches} />
        </div>
      </main>

      <MobileNav />
    </div>
  );
}