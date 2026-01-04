import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ArrowLeft, RefreshCw, Trophy, TrendingUp, Cloud, MapPin, Calendar, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Match {
  id: string;
  team1: string;
  team2: string;
  venue: string;
  date: string;
  format: string;
  status: string;
  weather?: string;
  team1Score?: string;
  team2Score?: string;
  tossWinner?: string;
  tossDecision?: string;
  pitchCondition?: string;
}

interface MatchPrediction {
  id: string;
  matchId: string;
  prediction: {
    homeTeamWinProbability: number;
    awayTeamWinProbability: number;
    drawProbability: number;
    predictedWinner: string;
    winReason: string;
    predictedScore: {
      homeTeam: string;
      awayTeam: string;
    };
    keyFactors: string[];
    matchAnalysis: string;
    timestamp: string;
  };
}

const MatchPredictionPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [prediction, setPrediction] = useState<MatchPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customMatch, setCustomMatch] = useState<Partial<Match>>({
    format: 'T20',
    weather: 'Clear',
    pitchCondition: 'Batting friendly'
  });
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    const mockMatches: Match[] = [
      { id: '1', team1: 'India', team2: 'Australia', venue: 'Sydney Cricket Ground', date: '2026-02-15', format: 'T20', status: 'upcoming', weather: 'Sunny', pitchCondition: 'Batting friendly' },
      { id: '2', team1: 'England', team2: 'South Africa', venue: 'Lord\'s Cricket Ground', date: '2026-02-20', format: 'ODI', status: 'upcoming', weather: 'Cloudy', pitchCondition: 'Balanced' },
      { id: '3', team1: 'New Zealand', team2: 'Pakistan', venue: 'Wellington Stadium', date: '2026-02-25', format: 'Test', status: 'upcoming', weather: 'Overcast', pitchCondition: 'Bowling friendly' },
      { id: '4', team1: 'Sri Lanka', team2: 'Bangladesh', venue: 'R. Premadasa Stadium', date: '2026-02-18', format: 'T20', status: 'upcoming', weather: 'Hot', pitchCondition: 'Spin friendly' },
      { id: '5', team1: 'West Indies', team2: 'Afghanistan', venue: 'Kensington Oval', date: '2026-02-22', format: 'ODI', status: 'upcoming', weather: 'Humid', pitchCondition: 'Batting friendly' },
      { id: '6', team1: 'Mumbai Indians', team2: 'Chennai Super Kings', venue: 'Wankhede Stadium', date: '2026-03-01', format: 'T20', status: 'upcoming', weather: 'Clear', pitchCondition: 'High scoring' },
      { id: '7', team1: 'Royal Challengers', team2: 'Kolkata Knight Riders', venue: 'M. Chinnaswamy Stadium', date: '2026-03-05', format: 'T20', status: 'upcoming', weather: 'Pleasant', pitchCondition: 'Batting paradise' },
    ];
    setMatches(mockMatches);
  }, []);

  const generatePrediction = async (matchToPredict?: Match) => {
    const match = matchToPredict || selectedMatch;
    if (!match) return;
    
    setLoading(true);
    setPrediction(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/match-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchData: match }),
      });
      
      if (!response.ok) throw new Error('Failed to generate prediction');
      
      const data = await response.json();
      setPrediction(data);
      if (matchToPredict) setSelectedMatch(matchToPredict);
    } catch (err) {
      setError('Failed to generate prediction. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomPrediction = () => {
    if (!customMatch.team1 || !customMatch.team2 || !customMatch.venue || !customMatch.date) {
      setError('Please fill in all required fields');
      return;
    }
    
    const match: Match = {
      id: 'custom-' + Date.now(),
      team1: customMatch.team1,
      team2: customMatch.team2,
      venue: customMatch.venue,
      date: customMatch.date,
      format: customMatch.format || 'T20',
      status: 'custom',
      weather: customMatch.weather,
      pitchCondition: customMatch.pitchCondition,
      team1Score: customMatch.team1Score,
      team2Score: customMatch.team2Score,
      tossWinner: customMatch.tossWinner,
      tossDecision: customMatch.tossDecision
    };
    
    generatePrediction(match);
    setShowCustomForm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const t20Matches = matches.filter(match => match.format === 'T20');
  const odiMatches = matches.filter(match => match.format === 'ODI');
  const testMatches = matches.filter(match => match.format === 'Test');

  const getWinnerColor = (team: string, predictedWinner: string) => {
    return team === predictedWinner ? 'text-green-600 font-bold' : '';
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/ai-features">
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Features
          </Button>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Match Prediction</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Get Gemini AI-powered predictions with win %, reasoning, and key factors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select a Match</CardTitle>
              <CardDescription>Choose an upcoming match or create custom</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="t20">
                <TabsList className="w-full">
                  <TabsTrigger value="t20" className="flex-1">T20</TabsTrigger>
                  <TabsTrigger value="odi" className="flex-1">ODI</TabsTrigger>
                  <TabsTrigger value="test" className="flex-1">Test</TabsTrigger>
                </TabsList>
                
                <TabsContent value="t20" className="mt-4">
                  <ScrollArea className="h-[250px]">
                    {t20Matches.map((match) => (
                      <div 
                        key={match.id}
                        className={`p-3 mb-2 rounded-md cursor-pointer border transition-all ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border hover:border-primary/50'}`}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <div className="font-medium">{match.team1} vs {match.team2}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(match.date)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{match.venue}
                        </div>
                        {match.weather && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Cloud className="h-3 w-3" />{match.weather}
                          </div>
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="odi" className="mt-4">
                  <ScrollArea className="h-[250px]">
                    {odiMatches.map((match) => (
                      <div 
                        key={match.id}
                        className={`p-3 mb-2 rounded-md cursor-pointer border transition-all ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border hover:border-primary/50'}`}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <div className="font-medium">{match.team1} vs {match.team2}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(match.date)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{match.venue}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="test" className="mt-4">
                  <ScrollArea className="h-[250px]">
                    {testMatches.map((match) => (
                      <div 
                        key={match.id}
                        className={`p-3 mb-2 rounded-md cursor-pointer border transition-all ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border hover:border-primary/50'}`}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <div className="font-medium">{match.team1} vs {match.team2}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(match.date)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{match.venue}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => generatePrediction()} disabled={!selectedMatch || loading}>
                {loading ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>) : (<><Sparkles className="mr-2 h-4 w-4" />Generate AI Prediction</>)}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowCustomForm(!showCustomForm)}>
                {showCustomForm ? 'Hide Custom Match' : 'Create Custom Match'}
              </Button>
            </CardFooter>
          </Card>

          {showCustomForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custom Match Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Team 1 *</Label><Input placeholder="e.g., India" value={customMatch.team1 || ''} onChange={(e) => setCustomMatch({...customMatch, team1: e.target.value})} /></div>
                  <div><Label>Team 2 *</Label><Input placeholder="e.g., Australia" value={customMatch.team2 || ''} onChange={(e) => setCustomMatch({...customMatch, team2: e.target.value})} /></div>
                </div>
                <div><Label>Venue *</Label><Input placeholder="e.g., MCG" value={customMatch.venue || ''} onChange={(e) => setCustomMatch({...customMatch, venue: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Date *</Label><Input type="date" value={customMatch.date || ''} onChange={(e) => setCustomMatch({...customMatch, date: e.target.value})} /></div>
                  <div><Label>Format</Label>
                    <Select value={customMatch.format} onValueChange={(v) => setCustomMatch({...customMatch, format: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="T20">T20</SelectItem><SelectItem value="ODI">ODI</SelectItem><SelectItem value="Test">Test</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Weather</Label>
                    <Select value={customMatch.weather} onValueChange={(v) => setCustomMatch({...customMatch, weather: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Clear">Clear</SelectItem><SelectItem value="Sunny">Sunny</SelectItem><SelectItem value="Cloudy">Cloudy</SelectItem><SelectItem value="Overcast">Overcast</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Pitch</Label>
                    <Select value={customMatch.pitchCondition} onValueChange={(v) => setCustomMatch({...customMatch, pitchCondition: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Batting friendly">Batting friendly</SelectItem><SelectItem value="Bowling friendly">Bowling friendly</SelectItem><SelectItem value="Spin friendly">Spin friendly</SelectItem><SelectItem value="Balanced">Balanced</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Team 1 Score</Label><Input placeholder="e.g., 185/6" value={customMatch.team1Score || ''} onChange={(e) => setCustomMatch({...customMatch, team1Score: e.target.value})} /></div>
                  <div><Label>Team 2 Score</Label><Input placeholder="e.g., 120/4" value={customMatch.team2Score || ''} onChange={(e) => setCustomMatch({...customMatch, team2Score: e.target.value})} /></div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCustomPrediction} disabled={loading}><Sparkles className="mr-2 h-4 w-4" />Predict Custom Match</Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {error && (<Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}

          {selectedMatch && !prediction && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-6xl">🏏</div>
              <h3 className="text-2xl font-semibold mb-2">Ready for AI Prediction</h3>
              <p className="text-muted-foreground mb-2">Selected: <span className="font-medium">{selectedMatch.team1} vs {selectedMatch.team2}</span></p>
              <p className="text-sm text-muted-foreground mb-6">{selectedMatch.venue} • {formatDate(selectedMatch.date)}</p>
              <Button onClick={() => generatePrediction()} size="lg"><Sparkles className="mr-2 h-5 w-5" />Generate AI Prediction</Button>
            </div>
          )}

          {!selectedMatch && !loading && !prediction && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-6xl">🎯</div>
              <h3 className="text-2xl font-semibold mb-2">Select a Match</h3>
              <p className="text-muted-foreground">Choose a match from the list or create a custom match</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-16 w-16 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Analyzing with Gemini AI</h3>
              <p className="text-muted-foreground mb-6">Processing match data, historical records, venue statistics...</p>
              <Progress value={65} className="w-full max-w-md" />
            </div>
          )}

          {prediction && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-500" />{selectedMatch?.team1} vs {selectedMatch?.team2}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedMatch?.venue}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(selectedMatch?.date || '')}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">{selectedMatch?.format}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {prediction.prediction.predictedWinner && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                      <span className="text-lg font-semibold text-green-700 dark:text-green-300">Predicted Winner: {prediction.prediction.predictedWinner}</span>
                    </div>
                    <p className="text-center text-sm text-green-600 dark:text-green-400 mt-2">{prediction.prediction.winReason}</p>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5" />Win Probability</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className={`font-medium ${getWinnerColor(selectedMatch?.team1 || '', prediction.prediction.predictedWinner)}`}>{selectedMatch?.team1}</span>
                        <span className="font-bold text-primary">{(prediction.prediction.homeTeamWinProbability * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={prediction.prediction.homeTeamWinProbability * 100} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className={`font-medium ${getWinnerColor(selectedMatch?.team2 || '', prediction.prediction.predictedWinner)}`}>{selectedMatch?.team2}</span>
                        <span className="font-bold text-primary">{(prediction.prediction.awayTeamWinProbability * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={prediction.prediction.awayTeamWinProbability * 100} className="h-3" />
                    </div>
                    {selectedMatch?.format === 'Test' && prediction.prediction.drawProbability > 0 && (
                      <div>
                        <div className="flex justify-between mb-1"><span className="font-medium">Draw</span><span className="font-bold text-muted-foreground">{(prediction.prediction.drawProbability * 100).toFixed(1)}%</span></div>
                        <Progress value={prediction.prediction.drawProbability * 100} className="h-3 bg-muted" />
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Predicted Score</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`text-center p-4 rounded-lg border-2 ${selectedMatch?.team1 === prediction.prediction.predictedWinner ? 'bg-green-50 dark:bg-green-950 border-green-300' : 'bg-muted border-transparent'}`}>
                      <div className="font-semibold text-muted-foreground mb-1">{selectedMatch?.team1}</div>
                      <div className="text-3xl font-bold">{prediction.prediction.predictedScore.homeTeam}</div>
                    </div>
                    <div className={`text-center p-4 rounded-lg border-2 ${selectedMatch?.team2 === prediction.prediction.predictedWinner ? 'bg-green-50 dark:bg-green-950 border-green-300' : 'bg-muted border-transparent'}`}>
                      <div className="font-semibold text-muted-foreground mb-1">{selectedMatch?.team2}</div>
                      <div className="text-3xl font-bold">{prediction.prediction.predictedScore.awayTeam}</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {prediction.prediction.matchAnalysis && (
                  <><div className="mb-6"><h3 className="text-lg font-semibold mb-3">Match Analysis</h3><p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">{prediction.prediction.matchAnalysis}</p></div><Separator className="my-6" /></>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Factors</h3>
                  <ul className="space-y-2">
                    {prediction.prediction.keyFactors.map((factor, index) => (
                      <li key={index} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <span className="text-primary font-bold">{index + 1}.</span><span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col bg-muted/30">
                <div className="text-sm text-muted-foreground text-center w-full flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />AI prediction generated on {new Date(prediction.prediction.timestamp).toLocaleString()}
                </div>
                <Button variant="outline" className="mt-4" onClick={() => generatePrediction()}><RefreshCw className="mr-2 h-4 w-4" />Refresh Prediction</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchPredictionPage;
