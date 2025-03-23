
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp, Target, Users } from "lucide-react";
import { PerformanceChart } from "./performance-chart";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
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

export function StatsDashboard({ stats, performanceData }: any) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Matches"
          value={stats.totalMatches.toString()}
          description="All time matches played"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Average Score"
          value={stats.averageScore.toFixed(2)}
          description="Runs per match"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Highest Score"
          value={stats.highestScore.toString()}
          description="Best batting performance"
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Win Rate"
          value={`${(stats.winRate * 100).toFixed(1)}%`}
          description="Match success rate"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      
      <PerformanceChart data={performanceData} />
    </div>
  );
}
