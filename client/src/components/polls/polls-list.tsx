import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PollCard } from "./poll-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart } from "lucide-react";

type PollsListProps = {
  userId?: number;
  matchId?: number;
  playerId?: number;
  teamId?: number;
  limit?: number;
  showFilters?: boolean;
};

export function PollsList({
  userId,
  matchId,
  playerId,
  teamId,
  limit = 10,
  showFilters = true,
}: PollsListProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [pollType, setPollType] = useState("all");
  const [page, setPage] = useState(1);

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (userId) params.append("userId", userId.toString());
    if (matchId) params.append("matchId", matchId.toString());
    if (playerId) params.append("playerId", playerId.toString());
    if (teamId) params.append("teamId", teamId.toString());
    if (pollType !== "all") params.append("pollType", pollType);
    if (activeTab === "active") params.append("isActive", "true");
    if (limit) params.append("limit", limit.toString());
    if (page) params.append("page", page.toString());
    
    return params.toString();
  };

  // Fetch polls based on filters
  const { data: polls, isLoading } = useQuery({
    queryKey: ["/api/polls", { userId, matchId, playerId, teamId, pollType, activeTab, page, limit }],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      return fetch(`/api/polls?${queryParams}`).then((res) => res.json());
    },
  });

  const handleLoadMore = () => {
    setPage(page + 1);
  };

  // Reset page when filters change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  const handlePollTypeChange = (value: string) => {
    setPollType(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full">
            <Skeleton className="h-[200px] w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!polls || polls.length === 0) {
    return (
      <EmptyState
        icon={<BarChart className="h-10 w-10" />}
        title="No polls found"
        description="There are no polls matching your criteria."
      />
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="mb-6 space-y-4">
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="all">All Polls</TabsTrigger>
              <TabsTrigger value="active">Active Polls</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={pollType} onValueChange={handlePollTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="match_prediction">Match Prediction</SelectItem>
              <SelectItem value="player_performance">Player Performance</SelectItem>
              <SelectItem value="team_selection">Team Selection</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-4">
        {polls.map((poll: any) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>

      {polls.length >= limit && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}