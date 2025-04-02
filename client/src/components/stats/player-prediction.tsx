import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart2, Cpu, Award, TrendingUp, Percent, Flame, ThumbsUp, Target } from "lucide-react";

interface PlayerPredictionProps {
  playerId?: number;
  opponentId?: number;
  matchType?: string;
  venue?: string;
}

export default function PlayerPrediction({ playerId, opponentId, matchType, venue }: PlayerPredictionProps) {
  const [predictionType, setPredictionType] = useState<'batting' | 'bowling'>('batting');
  
  const battingPredictions = {
    runs: {
      predicted: 42,
      confidence: 78,
      range: [28, 56],
      form: "Good",
    },
    strikeRate: {
      predicted: 138.5,
      confidence: 72,
      range: [125.2, 152.8],
      form: "Excellent",
    },
    boundaries: {
      predicted: 5,
      confidence: 81,
      range: [3, 7],
      form: "Good",
    },
    dismissalRisk: {
      predicted: 35,
      confidence: 68,
      range: [25, 45],
      form: "Average",
    }
  };
  
  const bowlingPredictions = {
    wickets: {
      predicted: 2,
      confidence: 74,
      range: [1, 3],
      form: "Good",
    },
    economy: {
      predicted: 7.8,
      confidence: 82,
      range: [6.5, 9.1],
      form: "Average",
    },
    dotBalls: {
      predicted: 8,
      confidence: 76,
      range: [6, 10],
      form: "Good",
    },
    breakthroughProbability: {
      predicted: 65,
      confidence: 71,
      range: [55, 75],
      form: "Excellent",
    }
  };
  
  const getFormColor = (form: string) => {
    switch (form) {
      case "Excellent": return "text-green-600";
      case "Good": return "text-blue-500";
      case "Average": return "text-amber-500";
      case "Poor": return "text-red-500";
      default: return "text-gray-500";
    }
  };
  
  const getFormIcon = (form: string) => {
    switch (form) {
      case "Excellent": return <Flame className="h-4 w-4 text-green-600" />;
      case "Good": return <ThumbsUp className="h-4 w-4 text-blue-500" />;
      case "Average": return <TrendingUp className="h-4 w-4 text-amber-500" />;
      case "Poor": return <Award className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                AI Performance Prediction
              </CardTitle>
              <CardDescription>
                Machine learning based predictions for upcoming performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium">Virat Kohli</div>
                <div className="text-sm text-muted-foreground">vs Mumbai Indians</div>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>VK</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="batting" onValueChange={(value) => setPredictionType(value as 'batting' | 'bowling')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="batting">Batting Prediction</TabsTrigger>
              <TabsTrigger value="bowling">Bowling Prediction</TabsTrigger>
            </TabsList>
            
            <TabsContent value="batting" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Runs Prediction */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Predicted Runs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{battingPredictions.runs.predicted}</div>
                    <div className="text-sm text-muted-foreground mb-2">Range: {battingPredictions.runs.range[0]} - {battingPredictions.runs.range[1]} runs</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{battingPredictions.runs.confidence}%</span>
                      </div>
                      <Progress value={battingPredictions.runs.confidence} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-sm">Form:</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${getFormColor(battingPredictions.runs.form)}`}>
                        {getFormIcon(battingPredictions.runs.form)}
                        {battingPredictions.runs.form}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Strike Rate Prediction */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Predicted Strike Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{battingPredictions.strikeRate.predicted}</div>
                    <div className="text-sm text-muted-foreground mb-2">Range: {battingPredictions.strikeRate.range[0]} - {battingPredictions.strikeRate.range[1]}</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{battingPredictions.strikeRate.confidence}%</span>
                      </div>
                      <Progress value={battingPredictions.strikeRate.confidence} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-sm">Form:</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${getFormColor(battingPredictions.strikeRate.form)}`}>
                        {getFormIcon(battingPredictions.strikeRate.form)}
                        {battingPredictions.strikeRate.form}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Boundaries Prediction */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Predicted Boundaries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{battingPredictions.boundaries.predicted}</div>
                    <div className="text-sm text-muted-foreground mb-2">Range: {battingPredictions.boundaries.range[0]} - {battingPredictions.boundaries.range[1]}</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{battingPredictions.boundaries.confidence}%</span>
                      </div>
                      <Progress value={battingPredictions.boundaries.confidence} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-sm">Form:</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${getFormColor(battingPredictions.boundaries.form)}`}>
                        {getFormIcon(battingPredictions.boundaries.form)}
                        {battingPredictions.boundaries.form}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Dismissal Risk */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Dismissal Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{battingPredictions.dismissalRisk.predicted}%</div>
                    <div className="text-sm text-muted-foreground mb-2">Range: {battingPredictions.dismissalRisk.range[0]}% - {battingPredictions.dismissalRisk.range[1]}%</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{battingPredictions.dismissalRisk.confidence}%</span>
                      </div>
                      <Progress value={battingPredictions.dismissalRisk.confidence} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-sm">Form:</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${getFormColor(battingPredictions.dismissalRisk.form)}`}>
                        {getFormIcon(battingPredictions.dismissalRisk.form)}
                        {battingPredictions.dismissalRisk.form}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="bowling" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Wickets Prediction */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      Predicted Wickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{bowlingPredictions.wickets.predicted}</div>
                    <div className="text-sm text-muted-foreground mb-2">Range: {bowlingPredictions.wickets.range[0]} - {bowlingPredictions.wickets.range[1]} wickets</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{bowlingPredictions.wickets.confidence}%</span>
                      </div>
                      <Progress value={bowlingPredictions.wickets.confidence} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-sm">Form:</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${getFormColor(bowlingPredictions.wickets.form)}`}>
                        {getFormIcon(bowlingPredictions.wickets.form)}
                        {bowlingPredictions.wickets.form}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Economy Prediction */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Predicted Economy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{bowlingPredictions.economy.predicted}</div>
                    <div className="text-sm text-muted-foreground mb-2">Range: {bowlingPredictions.economy.range[0]} - {bowlingPredictions.economy.range[1]} RPO</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{bowlingPredictions.economy.confidence}%</span>
                      </div>
                      <Progress value={bowlingPredictions.economy.confidence} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-sm">Form:</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${getFormColor(bowlingPredictions.economy.form)}`}>
                        {getFormIcon(bowlingPredictions.economy.form)}
                        {bowlingPredictions.economy.form}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Dot Balls Prediction */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Predicted Dot Balls
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{bowlingPredictions.dotBalls.predicted}</div>
                    <div className="text-sm text-muted-foreground mb-2">Range: {bowlingPredictions.dotBalls.range[0]} - {bowlingPredictions.dotBalls.range[1]}</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{bowlingPredictions.dotBalls.confidence}%</span>
                      </div>
                      <Progress value={bowlingPredictions.dotBalls.confidence} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-sm">Form:</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${getFormColor(bowlingPredictions.dotBalls.form)}`}>
                        {getFormIcon(bowlingPredictions.dotBalls.form)}
                        {bowlingPredictions.dotBalls.form}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Breakthrough Probability */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Breakthrough Probability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{bowlingPredictions.breakthroughProbability.predicted}%</div>
                    <div className="text-sm text-muted-foreground mb-2">Range: {bowlingPredictions.breakthroughProbability.range[0]}% - {bowlingPredictions.breakthroughProbability.range[1]}%</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{bowlingPredictions.breakthroughProbability.confidence}%</span>
                      </div>
                      <Progress value={bowlingPredictions.breakthroughProbability.confidence} className="h-2" />
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <span className="text-sm">Form:</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${getFormColor(bowlingPredictions.breakthroughProbability.form)}`}>
                        {getFormIcon(bowlingPredictions.breakthroughProbability.form)}
                        {bowlingPredictions.breakthroughProbability.form}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-6 text-sm text-muted-foreground">
            <p className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              Predictions based on historical player data, match conditions, opposition analysis, and venue statistics
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}