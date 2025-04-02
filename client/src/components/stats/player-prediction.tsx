import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, User, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PlayerPredictionProps {
  playerId?: number;
  opponentId?: number;
  matchType?: string;
  venue?: string;
}

interface PredictionResult {
  runs: {
    predicted: number;
    confidence: number;
    range: [number, number];
  };
  wickets?: {
    predicted: number;
    confidence: number;
    range: [number, number];
  };
  strikeRate?: {
    predicted: number;
    confidence: number;
    range: [number, number];
  };
  economy?: {
    predicted: number;
    confidence: number;
    range: [number, number];
  };
  boundaries?: {
    fours: number;
    sixes: number;
    confidence: number;
  };
  dismissalProbability?: {
    type: string;
    probability: number;
  }[];
  milestoneChances?: {
    fifty: number;
    century: number;
    fiveWickets: number;
  };
  historicalPerformance?: {
    vsTeam: {
      matches: number;
      average: number;
      highScore?: number;
      bestBowling?: string;
    };
    atVenue: {
      matches: number;
      average: number;
      highScore?: number;
      bestBowling?: string;
    };
  };
}

export default function PlayerPrediction({
  playerId,
  opponentId,
  matchType = "T20",
  venue
}: PlayerPredictionProps) {
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<number | undefined>(playerId);
  const [selectedOpponent, setSelectedOpponent] = useState<number | undefined>(opponentId);
  const [selectedMatchType, setSelectedMatchType] = useState<string>(matchType);
  const [selectedVenue, setSelectedVenue] = useState<string | undefined>(venue);
  const [showDetailedPrediction, setShowDetailedPrediction] = useState(false);

  const { data: players } = useQuery({
    queryKey: ['/api/players'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      // For demo purposes, returning mock data
      return [
        { id: 1, name: "Virat Kohli", role: "Batsman" },
        { id: 2, name: "Rohit Sharma", role: "Batsman" },
        { id: 3, name: "Jasprit Bumrah", role: "Bowler" },
        { id: 4, name: "Ben Stokes", role: "All-rounder" },
        { id: 5, name: "Kane Williamson", role: "Batsman" }
      ];
    }
  });

  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      // For demo purposes, returning mock data
      return [
        { id: 1, name: "India" },
        { id: 2, name: "Australia" },
        { id: 3, name: "England" },
        { id: 4, name: "New Zealand" },
        { id: 5, name: "South Africa" }
      ];
    }
  });

  const { data: venues } = useQuery({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      // For demo purposes, returning mock data
      return [
        { id: 1, name: "Eden Gardens, Kolkata" },
        { id: 2, name: "MCG, Melbourne" },
        { id: 3, name: "Lord's, London" },
        { id: 4, name: "Wankhede Stadium, Mumbai" },
        { id: 5, name: "Newlands, Cape Town" }
      ];
    }
  });

  const { data: prediction, isLoading: isPredictionLoading, refetch: runPrediction } = useQuery({
    queryKey: ['/api/predictions/player', selectedPlayer, selectedOpponent, selectedMatchType, selectedVenue],
    queryFn: async () => {
      // In a real implementation, this would fetch predictions from an AI model
      // For demo purposes, we're generating random prediction data
      
      // This randomization is just to simulate different predictions
      // In a real implementation, we would use an actual ML model
      const baseRuns = Math.floor(Math.random() * 80) + 20;
      const confidence = Math.floor(Math.random() * 30) + 70;
      const range: [number, number] = [
        Math.max(0, baseRuns - Math.floor(baseRuns * 0.4)),
        baseRuns + Math.floor(baseRuns * 0.4)
      ];
      
      const result: PredictionResult = {
        runs: {
          predicted: baseRuns,
          confidence: confidence / 100,
          range
        },
        strikeRate: {
          predicted: Math.floor(Math.random() * 50) + 100,
          confidence: (confidence - 5) / 100,
          range: [Math.floor(Math.random() * 80) + 80, Math.floor(Math.random() * 40) + 140]
        },
        boundaries: {
          fours: Math.floor(Math.random() * 8) + 2,
          sixes: Math.floor(Math.random() * 4) + 1,
          confidence: (confidence - 8) / 100
        },
        dismissalProbability: [
          { type: "Bowled", probability: Math.random() * 0.2 },
          { type: "Caught", probability: Math.random() * 0.5 },
          { type: "LBW", probability: Math.random() * 0.15 },
          { type: "Run Out", probability: Math.random() * 0.1 },
          { type: "Stumped", probability: Math.random() * 0.05 }
        ],
        milestoneChances: {
          fifty: Math.random() * 0.6,
          century: Math.random() * 0.2,
          fiveWickets: Math.random() * 0.05
        },
        historicalPerformance: {
          vsTeam: {
            matches: Math.floor(Math.random() * 15) + 1,
            average: Math.floor(Math.random() * 45) + 10,
            highScore: Math.floor(Math.random() * 80) + 30
          },
          atVenue: {
            matches: Math.floor(Math.random() * 8) + 1,
            average: Math.floor(Math.random() * 40) + 15,
            highScore: Math.floor(Math.random() * 70) + 25
          }
        }
      };
      
      // Add bowling stats if the player is a bowler or all-rounder
      const player = players?.find(p => p.id === selectedPlayer);
      if (player && (player.role === "Bowler" || player.role === "All-rounder")) {
        result.wickets = {
          predicted: Math.floor(Math.random() * 3) + 1,
          confidence: (confidence - 10) / 100,
          range: [Math.max(0, Math.floor(Math.random() * 2)), Math.floor(Math.random() * 3) + 2]
        };
        
        result.economy = {
          predicted: Math.floor(Math.random() * 40 + 50) / 10,
          confidence: (confidence - 15) / 100,
          range: [Math.floor(Math.random() * 40 + 40) / 10, Math.floor(Math.random() * 40 + 70) / 10]
        };
      }
      
      return result;
    },
    enabled: false
  });

  const handlePredict = () => {
    if (!selectedPlayer) {
      toast({
        title: "Player Required",
        description: "Please select a player for prediction",
        variant: "destructive"
      });
      return;
    }
    
    runPrediction();
  };

  const formatProbability = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  const getPlayerName = (id?: number) => {
    if (!id || !players) return "Unknown Player";
    const player = players.find(p => p.id === id);
    return player ? player.name : "Unknown Player";
  };

  const getTeamName = (id?: number) => {
    if (!id || !teams) return "Unknown Team";
    const team = teams.find(t => t.id === id);
    return team ? team.name : "Unknown Team";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" /> 
          Player Performance Prediction
        </CardTitle>
        <CardDescription>
          Predict how a player will perform based on historical data and match conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player">Player</Label>
              <Select 
                onValueChange={(value) => setSelectedPlayer(Number(value))}
                defaultValue={selectedPlayer?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players?.map(player => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.name} ({player.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="opponent">Opponent Team</Label>
              <Select 
                onValueChange={(value) => setSelectedOpponent(Number(value))}
                defaultValue={selectedOpponent?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select opponent" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map(team => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="matchType">Match Type</Label>
              <Select 
                onValueChange={setSelectedMatchType}
                defaultValue={selectedMatchType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select match type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T20">T20</SelectItem>
                  <SelectItem value="ODI">ODI</SelectItem>
                  <SelectItem value="Test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Select 
                onValueChange={setSelectedVenue}
                defaultValue={selectedVenue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues?.map(venue => (
                    <SelectItem key={venue.id} value={venue.name}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handlePredict} 
            className="w-full"
            disabled={isPredictionLoading}
          >
            {isPredictionLoading ? "Analyzing..." : "Predict Performance"}
          </Button>
          
          {prediction && (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-semibold">
                    {getPlayerName(selectedPlayer)}
                  </h3>
                  <p className="text-muted-foreground">
                    vs {getTeamName(selectedOpponent)} in {selectedMatchType}
                    {selectedVenue && ` at ${selectedVenue}`}
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">
                  Confidence: {formatProbability(prediction.runs.confidence)}
                </Badge>
              </div>
              
              <Tabs defaultValue="batting" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="batting">Batting Prediction</TabsTrigger>
                  {prediction.wickets && (
                    <TabsTrigger value="bowling">Bowling Prediction</TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="batting" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Predicted Runs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{prediction.runs.predicted}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Range: {prediction.runs.range[0]} - {prediction.runs.range[1]}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Strike Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{prediction.strikeRate?.predicted}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Range: {prediction.strikeRate?.range[0]} - {prediction.strikeRate?.range[1]}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Boundaries</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {prediction.boundaries?.fours}×4s {prediction.boundaries?.sixes}×6s
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.round((prediction.boundaries?.fours || 0) * 4 + (prediction.boundaries?.sixes || 0) * 6)} runs in boundaries
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {showDetailedPrediction && (
                    <>
                      <Separator />
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Milestone Chances</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">50+ Runs</Label>
                            <Progress value={Math.round((prediction.milestoneChances?.fifty || 0) * 100)} />
                            <div className="text-xs text-right">{formatProbability(prediction.milestoneChances?.fifty || 0)}</div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">100+ Runs</Label>
                            <Progress value={Math.round((prediction.milestoneChances?.century || 0) * 100)} />
                            <div className="text-xs text-right">{formatProbability(prediction.milestoneChances?.century || 0)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Dismissal Probability</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {prediction.dismissalProbability?.map(({ type, probability }) => (
                            <div key={type} className="space-y-2">
                              <Label className="text-sm">{type}</Label>
                              <Progress value={Math.round(probability * 100)} />
                              <div className="text-xs text-right">{formatProbability(probability)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Historical Performance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-base">
                                vs {getTeamName(selectedOpponent)}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <dl className="grid grid-cols-2 gap-1 text-sm">
                                <dt>Matches:</dt>
                                <dd>{prediction.historicalPerformance?.vsTeam.matches}</dd>
                                <dt>Average:</dt>
                                <dd>{prediction.historicalPerformance?.vsTeam.average}</dd>
                                <dt>High Score:</dt>
                                <dd>{prediction.historicalPerformance?.vsTeam.highScore}</dd>
                              </dl>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="py-3">
                              <CardTitle className="text-base">
                                at {selectedVenue || "this venue"}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <dl className="grid grid-cols-2 gap-1 text-sm">
                                <dt>Matches:</dt>
                                <dd>{prediction.historicalPerformance?.atVenue.matches}</dd>
                                <dt>Average:</dt>
                                <dd>{prediction.historicalPerformance?.atVenue.average}</dd>
                                <dt>High Score:</dt>
                                <dd>{prediction.historicalPerformance?.atVenue.highScore}</dd>
                              </dl>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                {prediction.wickets && (
                  <TabsContent value="bowling" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">Predicted Wickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{prediction.wickets.predicted}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Range: {prediction.wickets.range[0]} - {prediction.wickets.range[1]}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">Economy Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{prediction.economy?.predicted.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Range: {prediction.economy?.range[0].toFixed(1)} - {prediction.economy?.range[1].toFixed(1)}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">5+ Wickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatProbability(prediction.milestoneChances?.fiveWickets || 0)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Chance of taking 5 or more wickets
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>
      {prediction && (
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowDetailedPrediction(!showDetailedPrediction)}
          >
            {showDetailedPrediction ? "Hide" : "Show"} Detailed Analysis
          </Button>
          <Button variant="default" onClick={handlePredict}>
            Refresh Prediction
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}