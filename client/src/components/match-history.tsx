import { Card, CardContent } from "@/components/ui/card";
import { Globe, ArrowUpRight, Trophy } from "lucide-react";

export function MatchHistory() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Recent Matches</h2>
        <a href="/matches" className="text-sm text-primary flex items-center hover:underline">
          View All <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>

      <Card className="bg-[#1F3B4D] text-white overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Globe className="h-16 w-16 mb-4 opacity-80" />
          <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
          <p className="text-center text-white/80 max-w-md mb-4">
            We're currently integrating with cricket data providers to bring you live match updates, scores, and history from around the world.
          </p>
          <div className="flex items-center text-white/70 text-sm">
            <Trophy className="h-4 w-4 mr-2" />
            <span>Stay tuned for cricket match updates from top tournaments</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MatchHistory;