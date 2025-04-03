import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface Match {
  id: string;
  team1: string;
  team2: string;
  venue: string;
  date: string;
  format: string;
  status: string;
}

interface MatchPrediction {
  id: string;
  matchId: string;
  prediction: {
    homeTeamWinProbability: number;
    awayTeamWinProbability: number;
    drawProbability: number;
    predictedScore: {
      homeTeam: number;
      awayTeam: number;
    };
    keyFactors: string[];
    timestamp: string;
  };
}

const MatchPredictionPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [prediction, setPrediction] = useState<MatchPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch upcoming matches (simulated for now)
  useEffect(() => {
    // This would normally fetch from your API
    const mockMatches: Match[] = [
      { id: '1', team1: 'India', team2: 'Australia', venue: 'Sydney Cricket Ground', date: '2025-04-15', format: 'T20', status: 'upcoming' },
      { id: '2', team1: 'England', team2: 'South Africa', venue: 'Lord\'s Cricket Ground', date: '2025-04-20', format: 'ODI', status: 'upcoming' },
      { id: '3', team1: 'New Zealand', team2: 'Pakistan', venue: 'Wellington Stadium', date: '2025-04-25', format: 'Test', status: 'upcoming' },
      { id: '4', team1: 'Sri Lanka', team2: 'Bangladesh', venue: 'R. Premadasa Stadium', date: '2025-04-18', format: 'T20', status: 'upcoming' },
      { id: '5', team1: 'West Indies', team2: 'Afghanistan', venue: 'Kensington Oval', date: '2025-04-22', format: 'ODI', status: 'upcoming' },
    ];
    setMatches(mockMatches);
  }, []);

  // Generate prediction
  const generatePrediction = async () => {
    if (!selectedMatch) return;
    
    setLoading(true);
    setPrediction(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/match-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchData: selectedMatch }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate prediction');
      }
      
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError('Failed to generate prediction. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter matches by type
  const t20Matches = matches.filter(match => match.format === 'T20');
  const odiMatches = matches.filter(match => match.format === 'ODI');
  const testMatches = matches.filter(match => match.format === 'Test');

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/ai-features">
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Features
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-2">AI Match Prediction</h1>
        <p className="text-muted-foreground mt-1">
          Get AI-powered predictions for upcoming cricket matches
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Selection Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select a Match</CardTitle>
              <CardDescription>Choose an upcoming match for prediction</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="t20">
                <TabsList className="w-full">
                  <TabsTrigger value="t20" className="flex-1">T20</TabsTrigger>
                  <TabsTrigger value="odi" className="flex-1">ODI</TabsTrigger>
                  <TabsTrigger value="test" className="flex-1">Test</TabsTrigger>
                </TabsList>
                
                <TabsContent value="t20" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    {t20Matches.length > 0 ? (
                      t20Matches.map((match) => (
                        <div 
                          key={match.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="font-medium">{match.team1} vs {match.team2}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(match.date)}</div>
                          <div className="text-sm text-muted-foreground">{match.venue}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No T20 matches available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="odi" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    {odiMatches.length > 0 ? (
                      odiMatches.map((match) => (
                        <div 
                          key={match.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="font-medium">{match.team1} vs {match.team2}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(match.date)}</div>
                          <div className="text-sm text-muted-foreground">{match.venue}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No ODI matches available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="test" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    {testMatches.length > 0 ? (
                      testMatches.map((match) => (
                        <div 
                          key={match.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="font-medium">{match.team1} vs {match.team2}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(match.date)}</div>
                          <div className="text-sm text-muted-foreground">{match.venue}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No Test matches available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={generatePrediction}
                disabled={!selectedMatch || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : 'Generate Prediction'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Prediction Display Section */}
        <div className="lg:col-span-2">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedMatch && !prediction && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-4xl">🏏</div>
              <h3 className="text-2xl font-semibold mb-2">Ready for Prediction</h3>
              <p className="text-muted-foreground mb-6">
                Selected match: {selectedMatch.team1} vs {selectedMatch.team2}
              </p>
              <Button onClick={generatePrediction}>Generate Prediction</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-12 w-12 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Analyzing Match Data</h3>
              <p className="text-muted-foreground mb-6">
                Our AI is processing match data, team statistics, and historical performance...
              </p>
              <Progress value={70} className="w-full max-w-md" />
            </div>
          )}

          {prediction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {selectedMatch?.team1} vs {selectedMatch?.team2}
                </CardTitle>
                <CardDescription className="text-center">
                  {selectedMatch?.venue} • {formatDate(selectedMatch?.date || '')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Win Probability</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {(prediction.prediction.homeTeamWinProbability * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">{selectedMatch?.team1}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {(prediction.prediction.drawProbability * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Draw</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {(prediction.prediction.awayTeamWinProbability * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">{selectedMatch?.team2}</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Predicted Score</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="font-semibold text-muted-foreground mb-1">{selectedMatch?.team1}</div>
                      <div className="text-3xl font-bold">{prediction.prediction.predictedScore.homeTeam}</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="font-semibold text-muted-foreground mb-1">{selectedMatch?.team2}</div>
                      <div className="text-3xl font-bold">{prediction.prediction.predictedScore.awayTeam}</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Factors</h3>
                  <ul className="space-y-2">
                    {prediction.prediction.keyFactors.map((factor, index) => (
                      <li key={index} className="flex">
                        <span className="text-primary mr-2">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <div className="text-sm text-muted-foreground text-center w-full">
                  Prediction generated on {new Date(prediction.prediction.timestamp).toLocaleString()}
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={generatePrediction}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Prediction
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchPredictionPage;