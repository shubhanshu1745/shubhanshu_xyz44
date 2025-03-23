
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp, Target, Users, Cricket, Timer, Star } from "lucide-react";
import { PerformanceChart } from "./performance-chart";

export function StatsDashboard({ stats, performanceData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Matches"
          value={stats.totalMatches?.toString() || "0"}
          description="All time matches played"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Batting Average"
          value={stats.battingAverage || "0.00"}
          description="Runs per innings"
          icon={<Cricket className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Highest Score"
          value={stats.highestScore?.toString() || "0"}
          description="Best batting performance"
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Strike Rate"
          value={stats.strikeRate || "0.00"}
          description="Scoring rate"
          icon={<Timer className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Wickets"
          value={stats.totalWickets?.toString() || "0"}
          description="Wickets taken"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Economy Rate"
          value={stats.economyRate || "0.00"}
          description="Runs per over"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Best Bowling"
          value={stats.bestBowling || "0/0"}
          description="Best bowling figures"
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Bowling Average"
          value={stats.bowlingAverage || "0.00"}
          description="Runs per wicket"
          icon={<Cricket className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      
      {performanceData && <PerformanceChart data={performanceData} />}
    </div>
  );
}

function StatCard({ title, value, description, icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
