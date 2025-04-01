import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardTitle, CardDescription, Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Award, Flag, Clock } from "lucide-react";

// Import our enhanced components
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { MatchHistory } from "@/components/stats/match-history";
import { PerformanceChart } from "@/components/stats/performance-chart";
import { AddMatchDialog } from "@/components/stats/add-match-dialog";

export default function StatsPage() {
  const { user } = useAuth();

  // Fetch player matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: [`/api/users/${user?.username}/matches`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.username}/matches`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
    enabled: !!user?.username
  });

  // Fetch player statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/users/${user?.username}/player-stats`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.username}/player-stats`);
      if (!response.ok) throw new Error('Failed to fetch player stats');
      return response.json();
    },
    enabled: !!user?.username
  });

  // Format match data for performance chart
  const performanceData = matches?.map((match: any) => {
    const date = match.matchDate ? format(new Date(match.matchDate), 'MMM dd') : 'Unknown';
    
    return {
      date,
      runs: match.performance?.runsScored || 0,
      wickets: match.performance?.wicketsTaken || 0,
      // Additional properties for advanced charts
      ballsFaced: match.performance?.ballsFaced || 0,
      fours: match.performance?.fours || 0,
      sixes: match.performance?.sixes || 0,
      oversBowled: match.performance?.oversBowled || '0',
      runsConceded: match.performance?.runsConceded || 0,
      maidens: match.performance?.maidens || 0,
    };
  });

  if (statsLoading || matchesLoading) {
    return <div className="py-10 text-center">Loading stats...</div>;
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cricket Stats</h1>
          <p className="text-muted-foreground">
            Track and analyze your cricket performance
          </p>
        </div>
        <AddMatchDialog />
      </div>

      <div className="grid gap-6">
        <Card className="pt-6">
          <div className="px-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={user?.profileImage || undefined} alt={user?.username} />
                <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {user?.fullName || user?.username}
                </CardTitle>
                <CardDescription>
                  {stats?.totalMatches || 0} matches played
                </CardDescription>
              </div>
            </div>
            
            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="batting">Batting</TabsTrigger>
                <TabsTrigger value="bowling">Bowling</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard 
                    title="Total Matches" 
                    value={stats?.totalMatches?.toString() || "0"} 
                    icon={<Calendar className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Total Runs" 
                    value={stats?.totalRuns?.toString() || "0"} 
                    icon={<Award className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Total Wickets" 
                    value={stats?.totalWickets?.toString() || "0"} 
                    icon={<Flag className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Highest Score" 
                    value={stats?.highestScore?.toString() || "0"} 
                    icon={<Award className="h-5 w-5" />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="batting" className="pt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard 
                    title="Total Runs" 
                    value={stats?.totalRuns?.toString() || "0"} 
                    icon={<Award className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Batting Average" 
                    value={stats?.battingAverage || "0.00"} 
                    icon={<Award className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Strike Rate" 
                    value={stats?.strikeRate || "0.00"} 
                    icon={<Clock className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Highest Score" 
                    value={stats?.highestScore?.toString() || "0"} 
                    icon={<Award className="h-5 w-5" />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="bowling" className="pt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard 
                    title="Total Wickets" 
                    value={stats?.totalWickets?.toString() || "0"} 
                    icon={<Flag className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Bowling Average" 
                    value={stats?.bowlingAverage || "0.00"} 
                    icon={<Award className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Economy Rate" 
                    value={stats?.economyRate || "0.00"} 
                    icon={<Clock className="h-5 w-5" />}
                  />
                  <StatCard 
                    title="Best Bowling" 
                    value={stats?.bestBowling || "0/0"} 
                    icon={<Award className="h-5 w-5" />}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Performance data chart */}
        {matches?.length > 0 && performanceData && (
          <div className="mt-6">
            <PerformanceChart data={performanceData} />
          </div>
        )}
        
        {/* Stats Dashboard */}
        <div className="mt-6">
          <StatsDashboard stats={stats || {}} performanceData={performanceData} />
        </div>
        
        {/* Match History */}
        <div className="mt-6">
          <MatchHistory matches={matches || []} />
        </div>
      </div>
    </div>
  );
}

// Simple StatCard component for this page only
function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="text-primary">{icon}</div>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}