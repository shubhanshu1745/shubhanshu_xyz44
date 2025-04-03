import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, ArrowLeft, RefreshCw, BarChart2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Match {
  id: string;
  team1: string;
  team2: string;
  venue: string;
  date: string;
  format: string;
  status: string;
}

interface EmotionData {
  id: string;
  matchId: string;
  emotions: {
    crowdSentiment: number;
    keyMoments: {
      timestamp: string;
      event: string;
      dominantEmotion: string;
      emotionIntensity: number;
    }[];
    overallMood: string;
    timestamp: string;
  };
}

const getEmotionColor = (emotion: string) => {
  switch (emotion) {
    case 'Excitement': return 'bg-yellow-200 text-yellow-800';
    case 'Joy': return 'bg-green-200 text-green-800';
    case 'Anticipation': return 'bg-blue-200 text-blue-800';
    case 'Anxiety': return 'bg-purple-200 text-purple-800';
    case 'Disappointment': return 'bg-red-200 text-red-800';
    case 'Frustration': return 'bg-orange-200 text-orange-800';
    case 'Surprise': return 'bg-indigo-200 text-indigo-800';
    case 'Pride': return 'bg-teal-200 text-teal-800';
    default: return 'bg-gray-200 text-gray-800';
  }
};

const getMoodColor = (mood: string) => {
  switch (mood) {
    case 'Enthusiastic': return 'bg-green-100 text-green-800 border-green-300';
    case 'Positive': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Neutral': return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'Tense': return 'bg-orange-100 text-orange-800 border-orange-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const EmotionTrackerPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch matches (simulated for now)
  useEffect(() => {
    // This would normally fetch from your API
    const mockMatches: Match[] = [
      { id: '1', team1: 'India', team2: 'Australia', venue: 'Sydney Cricket Ground', date: '2025-04-15', format: 'T20', status: 'live' },
      { id: '2', team1: 'England', team2: 'South Africa', venue: 'Lord\'s Cricket Ground', date: '2025-04-20', format: 'ODI', status: 'upcoming' },
      { id: '3', team1: 'New Zealand', team2: 'Pakistan', venue: 'Wellington Stadium', date: '2025-04-25', format: 'Test', status: 'upcoming' },
      { id: '4', team1: 'Sri Lanka', team2: 'Bangladesh', venue: 'R. Premadasa Stadium', date: '2025-04-08', format: 'T20', status: 'completed' },
      { id: '5', team1: 'West Indies', team2: 'Afghanistan', venue: 'Kensington Oval', date: '2025-04-10', format: 'ODI', status: 'completed' },
    ];
    setMatches(mockMatches);
  }, []);

  // Generate emotion tracking data
  const trackEmotions = async () => {
    if (!selectedMatch) return;
    
    setLoading(true);
    setEmotionData(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/match-emotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchData: selectedMatch }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to track match emotions');
      }
      
      const data = await response.json();
      setEmotionData(data);
    } catch (err) {
      setError('Failed to track match emotions. Please try again.');
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

  // Filter matches by status
  const liveMatches = matches.filter(match => match.status === 'live');
  const completedMatches = matches.filter(match => match.status === 'completed');
  const upcomingMatches = matches.filter(match => match.status === 'upcoming');

  // Get sentiment text based on value
  const getSentimentText = (value: number) => {
    if (value >= 0.7) return 'Very Positive';
    if (value >= 0.6) return 'Positive';
    if (value >= 0.5) return 'Somewhat Positive';
    if (value >= 0.4) return 'Neutral';
    if (value >= 0.3) return 'Somewhat Tense';
    return 'Tense';
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
        <h1 className="text-3xl font-bold mt-2">Match Emotion Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Track and analyze crowd emotions during cricket matches
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Selection Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select a Match</CardTitle>
              <CardDescription>Choose a match to track emotions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="live">
                <TabsList className="w-full">
                  <TabsTrigger value="live" className="flex-1">Live</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
                </TabsList>
                
                <TabsContent value="live" className="mt-4">
                  <ScrollArea className="h-[240px]">
                    {liveMatches.length > 0 ? (
                      liveMatches.map((match) => (
                        <div 
                          key={match.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{match.team1} vs {match.team2}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(match.date)}</div>
                              <div className="text-sm text-muted-foreground">{match.venue}</div>
                            </div>
                            <Badge className="bg-red-100 text-red-800 border border-red-300">LIVE</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No live matches available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="completed" className="mt-4">
                  <ScrollArea className="h-[240px]">
                    {completedMatches.length > 0 ? (
                      completedMatches.map((match) => (
                        <div 
                          key={match.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{match.team1} vs {match.team2}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(match.date)}</div>
                              <div className="text-sm text-muted-foreground">{match.venue}</div>
                            </div>
                            <Badge className="bg-gray-100 text-gray-800 border border-gray-300">COMPLETED</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No completed matches available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="upcoming" className="mt-4">
                  <ScrollArea className="h-[240px]">
                    {upcomingMatches.length > 0 ? (
                      upcomingMatches.map((match) => (
                        <div 
                          key={match.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{match.team1} vs {match.team2}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(match.date)}</div>
                              <div className="text-sm text-muted-foreground">{match.venue}</div>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 border border-blue-300">UPCOMING</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No upcoming matches available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={trackEmotions}
                disabled={!selectedMatch || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : 'Track Emotions'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Emotion Display Section */}
        <div className="lg:col-span-2">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedMatch && !emotionData && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-4xl">🏏</div>
              <h3 className="text-2xl font-semibold mb-2">Ready to Track Emotions</h3>
              <p className="text-muted-foreground mb-6">
                Selected match: {selectedMatch.team1} vs {selectedMatch.team2}
              </p>
              <Button onClick={trackEmotions}>Track Emotions</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-12 w-12 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Analyzing Match Emotions</h3>
              <p className="text-muted-foreground mb-6">
                Our AI is analyzing crowd reactions, social media data, and commentary to track emotions...
              </p>
              <Progress value={80} className="w-full max-w-md" />
            </div>
          )}

          {emotionData && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl">
                      {selectedMatch?.team1} vs {selectedMatch?.team2}
                    </CardTitle>
                    <CardDescription>
                      {selectedMatch?.venue} • {formatDate(selectedMatch?.date || '')}
                    </CardDescription>
                  </div>
                  <div className={`px-4 py-2 rounded-md border ${getMoodColor(emotionData.emotions.overallMood)}`}>
                    <span className="font-medium">{emotionData.emotions.overallMood}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Crowd Sentiment</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{getSentimentText(emotionData.emotions.crowdSentiment)}</span>
                      <span>{(emotionData.emotions.crowdSentiment * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={emotionData.emotions.crowdSentiment * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">
                      Overall crowd sentiment based on social media, commentary, and fan reactions
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Emotional Moments</h3>
                  <div className="space-y-4">
                    {emotionData.emotions.keyMoments.map((moment, index) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getEmotionColor(moment.dominantEmotion)}>
                            {moment.dominantEmotion}
                          </Badge>
                          <span className="text-sm font-medium">{moment.timestamp}</span>
                        </div>
                        <p className="mb-2">{moment.event}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Intensity</span>
                            <span>{(moment.emotionIntensity * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={moment.emotionIntensity * 100} className="h-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Analysis performed on {new Date(emotionData.emotions.timestamp).toLocaleString()}
                </div>
                <Button 
                  variant="outline" 
                  onClick={trackEmotions}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Analysis
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionTrackerPage;