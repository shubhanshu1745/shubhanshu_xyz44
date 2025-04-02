import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import {
  BarChart,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  Activity,
  Users,
  Bookmark,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type PollOption = {
  id: number;
  option: string;
  imageUrl?: string | null;
};

type Poll = {
  id: number;
  question: string;
  pollType: string;
  options: PollOption[];
  userId: number;
  matchId?: number | null;
  playerId?: number | null;
  teamId?: number | null;
  endTime?: string | null;
  isActive: boolean;
  creator: {
    id: number;
    username: string;
    profileImage?: string | null;
  };
  createdAt: string;
};

type PollResult = {
  optionId: number;
  option: string;
  count: number;
  percentage: number;
};

interface PollCardProps {
  poll: Poll;
  isDetailed?: boolean;
}

export function PollCard({ poll, isDetailed = false }: PollCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(isDetailed);

  // Fetch user's vote if exists
  const { data: userVote } = useQuery({
    queryKey: ["/api/polls", poll.id, "user-vote"],
    queryFn: () => apiRequest(`/api/polls/${poll.id}/user-vote`),
    enabled: !!user,
  });

  // Fetch poll results
  const { data: pollResults } = useQuery({
    queryKey: ["/api/polls", poll.id, "results"],
    queryFn: () => apiRequest(`/api/polls/${poll.id}/results`),
    enabled: showResults || !!userVote,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: (optionId: number) =>
      apiRequest(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        data: { optionId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls", poll.id, "results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls", poll.id, "user-vote"] });
      toast({
        title: "Vote recorded",
        description: "Your vote has been recorded successfully",
      });
      setShowResults(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive",
      });
    },
  });

  // Remove vote mutation
  const removeVoteMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/polls/${poll.id}/vote`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls", poll.id, "results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls", poll.id, "user-vote"] });
      setSelectedOption(null);
      toast({
        title: "Vote removed",
        description: "Your vote has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove your vote",
        variant: "destructive",
      });
    },
  });

  // Set selected option based on user's vote
  useEffect(() => {
    if (userVote) {
      setSelectedOption(userVote.optionId);
      setShowResults(true);
    }
  }, [userVote]);

  const handleVote = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote in polls",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOption) {
      toast({
        title: "Selection required",
        description: "Please select an option to vote",
        variant: "destructive",
      });
      return;
    }

    voteMutation.mutate(selectedOption);
  };

  const handleRemoveVote = () => {
    removeVoteMutation.mutate();
  };

  const isPollEnded = poll.endTime && new Date(poll.endTime) < new Date();
  const isPollActive = poll.isActive && !isPollEnded;

  // Get icon based on poll type
  const getPollTypeIcon = () => {
    switch (poll.pollType) {
      case "match_prediction":
        return <Activity className="h-4 w-4 mr-1" />;
      case "player_performance":
        return <User className="h-4 w-4 mr-1" />;
      case "team_selection":
        return <Users className="h-4 w-4 mr-1" />;
      default:
        return <BarChart className="h-4 w-4 mr-1" />;
    }
  };

  // Format poll type for display
  const formatPollType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card className="w-full mb-4 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{poll.question}</CardTitle>
            <div className="flex items-center mt-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2 py-0 flex items-center">
                  {getPollTypeIcon()}
                  {formatPollType(poll.pollType)}
                </Badge>
                {!isPollActive && (
                  <Badge variant="secondary" className="mr-2">
                    {isPollEnded ? "Ended" : "Inactive"}
                  </Badge>
                )}
                <span className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
                  {new Date(poll.createdAt).toLocaleDateString()}
                </span>
                {poll.endTime && (
                  <span className="flex items-center ml-3">
                    <Clock className="h-3.5 w-3.5 mr-1 opacity-70" />
                    {new Date(poll.endTime).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
        {!expanded && (
          <CardDescription className="mt-1">
            <span className="font-semibold">{poll.options.length}</span> options |{" "}
            {pollResults ? `${pollResults.reduce((sum: number, r: PollResult) => sum + r.count, 0)} votes` : "0 votes"}
          </CardDescription>
        )}
      </CardHeader>

      {expanded && (
        <>
          <CardContent className="pb-3">
            {showResults && pollResults ? (
              <div className="space-y-3">
                {pollResults.map((result: PollResult) => (
                  <div key={result.optionId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        {userVote && userVote.optionId === result.optionId && (
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                        )}
                        <span>{result.option}</span>
                      </div>
                      <span className="font-medium">{result.count} votes ({result.percentage}%)</span>
                    </div>
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {poll.options.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "p-3 border rounded-md transition-colors cursor-pointer",
                      selectedOption === option.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                    onClick={() => isPollActive && setSelectedOption(option.id)}
                  >
                    <div className="flex items-center">
                      {selectedOption === option.id ? (
                        <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/50 mr-2" />
                      )}
                      <span>{option.option}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <Separator />

          <CardFooter className="p-3 flex justify-between items-center">
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1.5" />
                <span>{poll.creator.username}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {!showResults && isPollActive ? (
                <Button
                  size="sm"
                  onClick={handleVote}
                  disabled={!selectedOption || voteMutation.isPending}
                >
                  {voteMutation.isPending ? "Voting..." : "Vote"}
                </Button>
              ) : (
                <>
                  {userVote && isPollActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveVote}
                      disabled={removeVoteMutation.isPending}
                    >
                      {removeVoteMutation.isPending ? "Removing..." : "Remove Vote"}
                    </Button>
                  )}
                  {!showResults && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowResults(true)}
                    >
                      Show Results
                    </Button>
                  )}
                  {showResults && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowResults(false)}
                    >
                      Hide Results
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}