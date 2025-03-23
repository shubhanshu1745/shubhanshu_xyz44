
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { StatsOverview } from "@/components/stats/stats-overview";
import { MatchHistory } from "@/components/stats/match-history";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddMatchDialog } from "@/components/stats/add-match-dialog";

export default function PlayerStatsPage() {
  const { user } = useAuth();
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);

  const { data: playerStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/users/${user?.username}/player-stats`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.username,
    staleTime: 30000,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: [`/api/users/${user?.username}/matches`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.username,
    staleTime: 30000,
  });

  if (!user) {
    return <div className="flex items-center justify-center h-screen">
      Please log in to view stats
    </div>;
  }

  if (statsLoading || matchesLoading) {
    return <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Player Statistics</h1>
        <Button onClick={() => setIsAddMatchOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Match
        </Button>
      </div>
      
      <StatsOverview stats={playerStats} isLoading={statsLoading} />
      <MatchHistory matches={matches || []} isLoading={matchesLoading} />
      
      <AddMatchDialog 
        open={isAddMatchOpen} 
        onOpenChange={setIsAddMatchOpen}
      />
    </div>
  );
}
