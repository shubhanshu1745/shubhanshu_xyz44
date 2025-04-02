import { Card, CardContent } from "@/components/ui/card";
import { CalendarClock, Info } from "lucide-react";

export function MatchHighlights() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Match Highlights</h2>
      </div>

      <Card className="bg-[#1F3B4D] text-white overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <CalendarClock className="h-16 w-16 mb-4 opacity-80" />
          <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
          <p className="text-center text-white/80 max-w-md mb-4">
            Match highlights will be available soon! We're currently integrating with cricket data providers to bring you the best highlights from matches around the world.
          </p>
          <div className="flex items-center text-white/70 text-sm">
            <Info className="h-4 w-4 mr-2" />
            <span>Check back soon for exciting cricket moments</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MatchHighlights;