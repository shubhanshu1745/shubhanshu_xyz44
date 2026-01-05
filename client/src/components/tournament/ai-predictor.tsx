import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Sparkles, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

interface Team {
  id: number;
  name: string;
  shortName?: string;
  logo?: string;
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
  venue?: string;
}

interface PredictionResult {
  team1WinProbability: number;
  team2WinProbability: number;
  predictedWinner: string;
  reasoning: string;
  keyFactors: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface AIPredictorProps {
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamStats?: {
    played: number;
    won: number;
    nrr: number;
  };
  awayTeamStats?: {
    played: number;
    won: number;
    nrr: number;
  };
}

export function AIPredictor({
  match,
  homeTeamName,
  awayTeamName,
  homeTeamStats,
  awayTeamStats
}: AIPredictorProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const predictMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/match-prediction', {
        matchData: {
          team1: homeTeamName,
          team2: awayTeamName,
          venue: match.venue || 'Unknown',
          date: match.scheduledDate || new Date().toISOString(),
          format: 'T20',
          team1Stats: homeTeamStats ? `${homeTeamStats.won}/${homeTeamStats.played} wins, NRR: ${homeTeamStats.nrr}` : undefined,
          team2Stats: awayTeamStats ? `${awayTeamStats.won}/${awayTeamStats.played} wins, NRR: ${awayTeamStats.nrr}` : undefined
        }
      });
      return response;
    },
    onSuccess: (data: any) => {
      // Map the response to our expected format
      setPrediction({
        team1WinProbability: data.team1WinProbability || 50,
        team2WinProbability: data.team2WinProbability || 50,
        predictedWinner: data.predictedWinner || homeTeamName,
        reasoning: data.winReason || data.matchAnalysis || 'Analysis not available',
        keyFactors: data.keyFactors || [],
        confidence: data.team1WinProbability > 65 || data.team2WinProbability > 65 ? 'high' : 
                   data.team1WinProbability > 55 || data.team2WinProbability > 55 ? 'medium' : 'low'
      });
    }
  });

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-500">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-red-500">Low Confidence</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
          <div className="p-2 bg-indigo-500 rounded-full">
            <Brain className="h-4 w-4 text-white" />
          </div>
          AI Match Prediction
        </CardTitle>
        <CardDescription>
          Powered by Gemini AI - Analyzing team stats, form, and historical data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Info */}
        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-lg">
          <div className="text-center flex-1">
            <div className="font-bold text-lg">{homeTeamName}</div>
            {homeTeamStats && (
              <div className="text-sm text-muted-foreground">
                {homeTeamStats.won}/{homeTeamStats.played} wins • NRR: {homeTeamStats.nrr?.toFixed(2) || '0.00'}
              </div>
            )}
          </div>
          <div className="px-4 text-muted-foreground font-medium">VS</div>
          <div className="text-center flex-1">
            <div className="font-bold text-lg">{awayTeamName}</div>
            {awayTeamStats && (
              <div className="text-sm text-muted-foreground">
                {awayTeamStats.won}/{awayTeamStats.played} wins • NRR: {awayTeamStats.nrr?.toFixed(2) || '0.00'}
              </div>
            )}
          </div>
        </div>

        {/* Prediction Button */}
        {!prediction && !predictMutation.isPending && (
          <Button 
            onClick={() => predictMutation.mutate()}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate AI Prediction
          </Button>
        )}

        {/* Loading State */}
        {predictMutation.isPending && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-indigo-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing match data...</span>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {/* Error State */}
        {predictMutation.isError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to generate prediction. Please try again.</span>
          </div>
        )}

        {/* Prediction Result */}
        {prediction && (
          <div className="space-y-4">
            {/* Win Probabilities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{homeTeamName}</span>
                <span className="font-bold text-indigo-600">{prediction.team1WinProbability}%</span>
              </div>
              <Progress value={prediction.team1WinProbability} className="h-3" />
              
              <div className="flex items-center justify-between">
                <span className="font-medium">{awayTeamName}</span>
                <span className="font-bold text-indigo-600">{prediction.team2WinProbability}%</span>
              </div>
              <Progress value={prediction.team2WinProbability} className="h-3" />
            </div>

            {/* Predicted Winner */}
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-center">
              <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Predicted Winner</div>
              <div className="text-xl font-bold text-indigo-800 dark:text-indigo-200 flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {prediction.predictedWinner}
              </div>
              <div className="mt-2">
                {getConfidenceBadge(prediction.confidence)}
              </div>
            </div>

            {/* Reasoning */}
            <div className="space-y-2">
              <div className="font-medium text-sm text-indigo-700 dark:text-indigo-400">AI Analysis</div>
              <p className="text-sm text-muted-foreground bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                {prediction.reasoning}
              </p>
            </div>

            {/* Key Factors */}
            {prediction.keyFactors && prediction.keyFactors.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-sm text-indigo-700 dark:text-indigo-400">Key Factors</div>
                <ul className="space-y-1">
                  {prediction.keyFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-indigo-500">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regenerate Button */}
            <Button 
              variant="outline" 
              onClick={() => predictMutation.mutate()}
              className="w-full"
              disabled={predictMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${predictMutation.isPending ? 'animate-spin' : ''}`} />
              Regenerate Prediction
            </Button>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          AI predictions are for entertainment purposes only. Actual results may vary.
        </p>
      </CardContent>
    </Card>
  );
}

export default AIPredictor;
