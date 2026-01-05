import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface Team {
  id: number;
  name: string;
  shortName?: string;
}

interface Match {
  id: number;
  tournamentId: number;
  home_team_id: number;
  away_team_id: number;
  homeTeam?: Team;
  awayTeam?: Team;
  scheduledDate?: string;
  stage?: string;
}

interface ScoreEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
  homeTeamName?: string;
  awayTeamName?: string;
}

export function ScoreEntryModal({
  open,
  onOpenChange,
  match,
  homeTeamName = "Home Team",
  awayTeamName = "Away Team"
}: ScoreEntryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Score state
  const [homeRuns, setHomeRuns] = useState("");
  const [homeWickets, setHomeWickets] = useState("");
  const [homeOvers, setHomeOvers] = useState("");
  const [awayRuns, setAwayRuns] = useState("");
  const [awayWickets, setAwayWickets] = useState("");
  const [awayOvers, setAwayOvers] = useState("");
  const [result, setResult] = useState<string>("");
  const [resultDetails, setResultDetails] = useState("");

  const submitResultMutation = useMutation({
    mutationFn: async (data: {
      home_team_score: string;
      away_team_score: string;
      result: string;
      resultDetails: string;
    }) => {
      if (!match) throw new Error("No match selected");
      return await apiRequest(
        'POST',
        `/api/tournaments/${match.tournamentId}/matches/${match.id}/result`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${match?.tournamentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${match?.tournamentId}/enhanced-standings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${match?.tournamentId}/matches`] });
      
      toast({
        title: "Result Saved",
        description: "Match result has been saved and standings updated."
      });
      
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Result",
        description: error.message || "There was an error saving the match result.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setHomeRuns("");
    setHomeWickets("");
    setHomeOvers("");
    setAwayRuns("");
    setAwayWickets("");
    setAwayOvers("");
    setResult("");
    setResultDetails("");
  };

  const handleSubmit = () => {
    if (!match) return;

    // Validate inputs
    if (!homeRuns || !awayRuns) {
      toast({
        title: "Missing Scores",
        description: "Please enter runs for both teams.",
        variant: "destructive"
      });
      return;
    }

    if (!result) {
      toast({
        title: "Missing Result",
        description: "Please select the match result.",
        variant: "destructive"
      });
      return;
    }

    // Format scores
    const homeScore = `${homeRuns}/${homeWickets || '0'}${homeOvers ? ` (${homeOvers})` : ''}`;
    const awayScore = `${awayRuns}/${awayWickets || '0'}${awayOvers ? ` (${awayOvers})` : ''}`;

    submitResultMutation.mutate({
      home_team_score: homeScore,
      away_team_score: awayScore,
      result,
      resultDetails
    });
  };

  const determineResult = () => {
    const homeRunsNum = parseInt(homeRuns) || 0;
    const awayRunsNum = parseInt(awayRuns) || 0;

    if (homeRunsNum > awayRunsNum) {
      setResult("home_win");
      const margin = homeRunsNum - awayRunsNum;
      setResultDetails(`${homeTeamName} won by ${margin} runs`);
    } else if (awayRunsNum > homeRunsNum) {
      setResult("away_win");
      const wicketsRemaining = 10 - (parseInt(awayWickets) || 0);
      setResultDetails(`${awayTeamName} won by ${wicketsRemaining} wickets`);
    } else {
      setResult("tie");
      setResultDetails("Match tied");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enter Match Result</DialogTitle>
          <DialogDescription>
            {match?.stage && <span className="capitalize">{match.stage} • </span>}
            {homeTeamName} vs {awayTeamName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Home Team Score */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{homeTeamName}</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="homeRuns" className="text-xs text-muted-foreground">Runs</Label>
                <Input
                  id="homeRuns"
                  type="number"
                  placeholder="0"
                  value={homeRuns}
                  onChange={(e) => setHomeRuns(e.target.value)}
                  className="text-center text-lg font-bold"
                />
              </div>
              <div>
                <Label htmlFor="homeWickets" className="text-xs text-muted-foreground">Wickets</Label>
                <Input
                  id="homeWickets"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="10"
                  value={homeWickets}
                  onChange={(e) => setHomeWickets(e.target.value)}
                  className="text-center"
                />
              </div>
              <div>
                <Label htmlFor="homeOvers" className="text-xs text-muted-foreground">Overs</Label>
                <Input
                  id="homeOvers"
                  type="text"
                  placeholder="20.0"
                  value={homeOvers}
                  onChange={(e) => setHomeOvers(e.target.value)}
                  className="text-center"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Away Team Score */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">{awayTeamName}</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="awayRuns" className="text-xs text-muted-foreground">Runs</Label>
                <Input
                  id="awayRuns"
                  type="number"
                  placeholder="0"
                  value={awayRuns}
                  onChange={(e) => setAwayRuns(e.target.value)}
                  className="text-center text-lg font-bold"
                />
              </div>
              <div>
                <Label htmlFor="awayWickets" className="text-xs text-muted-foreground">Wickets</Label>
                <Input
                  id="awayWickets"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="10"
                  value={awayWickets}
                  onChange={(e) => setAwayWickets(e.target.value)}
                  className="text-center"
                />
              </div>
              <div>
                <Label htmlFor="awayOvers" className="text-xs text-muted-foreground">Overs</Label>
                <Input
                  id="awayOvers"
                  type="text"
                  placeholder="20.0"
                  value={awayOvers}
                  onChange={(e) => setAwayOvers(e.target.value)}
                  className="text-center"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Result Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Result</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={determineResult}
                disabled={!homeRuns || !awayRuns}
              >
                Auto-detect
              </Button>
            </div>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home_win">{homeTeamName} Won</SelectItem>
                <SelectItem value="away_win">{awayTeamName} Won</SelectItem>
                <SelectItem value="tie">Tie</SelectItem>
                <SelectItem value="no_result">No Result</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Result Details */}
          <div className="space-y-2">
            <Label htmlFor="resultDetails" className="text-sm">Result Details (Optional)</Label>
            <Input
              id="resultDetails"
              placeholder="e.g., Team A won by 25 runs"
              value={resultDetails}
              onChange={(e) => setResultDetails(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitResultMutation.isPending}
          >
            {submitResultMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ScoreEntryModal;
