
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerStats } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  stats: PlayerStats | null;
  isLoading: boolean;
  children?: React.ReactNode;
}

export function StatsCard({ title, stats, isLoading, children }: StatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-md border-[#1F3A8A]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#1F3A8A]">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
