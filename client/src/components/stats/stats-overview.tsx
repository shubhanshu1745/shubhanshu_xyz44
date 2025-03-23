import { Card, CardContent } from "@/components/ui/card";

interface StatsOverviewProps {
  stats: any;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  if (!stats) return null;

  const statItems = [
    { label: "Total Matches", value: stats.totalMatches },
    { label: "Total Runs", value: stats.totalRuns },
    { label: "Batting Average", value: stats.battingAverage },
    { label: "Highest Score", value: stats.highestScore },
    { label: "Total Wickets", value: stats.totalWickets },
    { label: "Bowling Average", value: stats.bowlingAverage },
    { label: "Best Bowling", value: stats.bestBowling },
    { label: "Total Catches", value: stats.totalCatches },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-2xl font-bold">{item.value || 0}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}