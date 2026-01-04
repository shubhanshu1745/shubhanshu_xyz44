import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, ArrowLeft, RefreshCw, BarChart2, Heart, Sparkles, Zap, Users, TrendingUp, Laugh } from 'lucide-react';
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
    overallMood: string;
    team1FanMood: string;
    team2FanMood: string;
    keyMoments: {
      timestamp: string;
      event: string;
      dominantEmotion: string;
      emotionIntensity: number;
      description?: string;
    }[];
    emotionalHighlight: string;
    predictedFinish: string;
    memeWorthyMoments: string[];
    timestamp: string;
  };
}

const getEmotionColor = (emotion: string) => {
  const e = emotion?.toLowerCase() || '';
  if (e.includes('excit') || e.includes('thrill')) return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
  if (e.includes('joy') || e.includes('happy')) return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200';
  if (e.includes('anticip')) return 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
  if (e.includes('anxi') || e.includes('nervous')) return 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
  if (e.includes('disappoint') || e.includes('sad')) return 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200';
  if (e.includes('frustrat') || e.includes('angry')) return 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200';
  if (e.includes('surpris') || e.includes('shock')) return 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200';
  if (e.includes('pride') || e.includes('proud')) return 'bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-200';
  if (e.includes('tense') || e.includes('nail')) return 'bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200';
  return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getMoodColor = (mood: string) => {
  const m = mood?.toLowerCase() || '';
  if (m.includes('thrill') || m.includes('excit')) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
  if (m.includes('nail') || m.includes('tense')) return 'bg-gradient-to-r from-pink-500 to-red-500 text-white';
  if (m.includes('one-sided')) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
  return 'bg-gradient-to-r from-blue-400 to-purple-500 text-white';
};

const EmotionTrackerPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mockMatches: Match[] = [
      { id: '1', team1: 'India', team2: 'Australia', venue: 'Sydney Cricket Ground', date: '2026-01-04', format: 'T20', status: 'live' },
      { id: '2', team1: 'Mumbai Indians', team2: 'Chennai Super Kings', venue: 'Wankhede Stadium', date: '2026-01-04', format: 'T20', status: 'live' },
      { id: '3', team1: 'England', team2: 'South Africa', venue: 'Lord\'s Cricket Ground', date: '2026-01-03', format: 'ODI', status: 'completed' },
      { id: '4', team1: 'New Zealand', team2: 'Pakistan', venue: 'Wellington Stadium', date: '2026-01-02', format: 'Test', status: 'completed' },
      { id: '5', team1: 'Sri Lanka', team2: 'Bangladesh', venue: 'R. Premadasa Stadium', date: '2026-01-10', format: 'T20', status: 'upcoming' },
      { id: '6', team1: 'West Indies', team2: 'Afghanistan', venue: 'Kensington Oval', date: '2026-01-15', format: 'ODI', status: 'upcoming' },
    ];
    setMatches(mockMatches);
  }, []);

  const trackEmotions = async () => {
    if (!selectedMatch) return;
    
    setLoading(true);
    setEmotionData(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/match-emotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchData: selectedMatch }),
      });
      
      if (!response.ok) throw new Error('Failed to track match emotions');
      
      const data = await response.json();
      setEmotionData(data);
    } catch (err) {
      setError('Failed to track match emotions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const liveMatches = matches.filter(match => match.status === 'live');
  const completedMatches = matches.filter(match => match.status === 'completed');
  const upcomingMatches = matches.filter(match => match.status === 'upcoming');

  const getSentimentText = (value: number) => {
    if (value >= 0.8) return 'Electrifying';
    if (value >= 0.7) return 'Very Positive';
    if (value >= 0.6) return 'Positive';
    if (value >= 0.5) return 'Engaged';
    if (value >= 0.4) return 'Neutral';
    return 'Tense';
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/ai-features">
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to AI Features
          </Button>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Heart className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold">AI Match Emotion Tracker</h1>
        </div>
        <p className="text-muted-foreground mt-1">Track and analyze crowd emotions during cricket matches with Gemini AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select a Match</CardTitle>
              <CardDescription>Choose a match to track emotions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="live">
                <TabsList className="w-full">
                  <TabsTrigger value="live" className="flex-1">🔴 Live</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">✅ Done</TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex-1">📅 Soon</TabsTrigger>
                </TabsList>
                
                {['live', 'completed', 'upcoming'].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    <ScrollArea className="h-[240px]">
                      {(tab === 'live' ? liveMatches : tab === 'completed' ? completedMatches : upcomingMatches).map((match) => (
                        <div 
                          key={match.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border transition-all ${selectedMatch?.id === match.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border hover:border-primary/50'}`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{match.team1} vs {match.team2}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(match.date)}</div>
                              <div className="text-xs text-muted-foreground">{match.venue}</div>
                            </div>
                            <Badge className={tab === 'live' ? 'bg-red-500 text-white animate-pulse' : tab === 'completed' ? 'bg-gray-500 text-white' : 'bg-blue-500 text-white'}>
                              {tab === 'live' ? 'LIVE' : tab === 'completed' ? 'DONE' : 'SOON'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {(tab === 'live' ? liveMatches : tab === 'completed' ? completedMatches : upcomingMatches).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No {tab} matches</p>
                      )}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={trackEmotions} disabled={!selectedMatch || loading}>
                {loading ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>) : (<><Sparkles className="mr-2 h-4 w-4" />Track AI Emotions</>)}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {error && (<Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}

          {selectedMatch && !emotionData && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-6xl">💓</div>
              <h3 className="text-2xl font-semibold mb-2">Ready to Track Emotions</h3>
              <p className="text-muted-foreground mb-6">{selectedMatch.team1} vs {selectedMatch.team2}</p>
              <Button onClick={trackEmotions}><Sparkles className="mr-2 h-4 w-4" />Track AI Emotions</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-16 w-16 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Analyzing Match Emotions</h3>
              <p className="text-muted-foreground mb-6">Gemini AI is analyzing crowd reactions and match dynamics...</p>
              <Progress value={80} className="w-full max-w-md" />
            </div>
          )}

          {emotionData && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-500/10 via-pink-500/10 to-purple-500/10">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2"><Heart className="h-6 w-6 text-red-500" />{selectedMatch?.team1} vs {selectedMatch?.team2}</CardTitle>
                    <CardDescription>{selectedMatch?.venue} • {formatDate(selectedMatch?.date || '')}</CardDescription>
                  </div>
                  <Badge className={`px-4 py-2 text-lg ${getMoodColor(emotionData.emotions.overallMood)}`}>{emotionData.emotions.overallMood}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground mb-1">Crowd Sentiment</p>
                    <p className="text-2xl font-bold text-primary">{(emotionData.emotions.crowdSentiment * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">{getSentimentText(emotionData.emotions.crowdSentiment)}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <span className="text-2xl">🏏</span>
                    <p className="text-xs text-muted-foreground mb-1">{selectedMatch?.team1} Fans</p>
                    <Badge className={getEmotionColor(emotionData.emotions.team1FanMood)}>{emotionData.emotions.team1FanMood}</Badge>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <span className="text-2xl">🏏</span>
                    <p className="text-xs text-muted-foreground mb-1">{selectedMatch?.team2} Fans</p>
                    <Badge className={getEmotionColor(emotionData.emotions.team2FanMood)}>{emotionData.emotions.team2FanMood}</Badge>
                  </div>
                </div>

                {emotionData.emotions.emotionalHighlight && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2"><Zap className="h-5 w-5 text-yellow-500" /><span className="font-semibold">Emotional Highlight</span></div>
                    <p className="text-muted-foreground">{emotionData.emotions.emotionalHighlight}</p>
                  </div>
                )}

                <Separator className="my-6" />

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5" />Key Emotional Moments</h3>
                  <div className="space-y-3">
                    {emotionData.emotions.keyMoments?.map((moment, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getEmotionColor(moment.dominantEmotion)}>{moment.dominantEmotion}</Badge>
                          <span className="text-sm font-medium text-muted-foreground">{moment.timestamp}</span>
                        </div>
                        <p className="font-medium mb-1">{moment.event}</p>
                        {moment.description && <p className="text-sm text-muted-foreground">{moment.description}</p>}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1"><span>Intensity</span><span className="font-medium">{(moment.emotionIntensity * 100).toFixed(0)}%</span></div>
                          <Progress value={moment.emotionIntensity * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {emotionData.emotions.predictedFinish && (
                  <><Separator className="my-6" />
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><BarChart2 className="h-4 w-4" />Predicted Finish</h4>
                    <p className="text-muted-foreground">{emotionData.emotions.predictedFinish}</p>
                  </div></>
                )}

                {emotionData.emotions.memeWorthyMoments && emotionData.emotions.memeWorthyMoments.length > 0 && (
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Laugh className="h-4 w-4 text-yellow-500" />Meme-Worthy Moments</h4>
                    <div className="flex flex-wrap gap-2">
                      {emotionData.emotions.memeWorthyMoments.map((moment, i) => (
                        <Badge key={i} variant="outline" className="bg-yellow-500/10">{moment}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between bg-muted/30">
                <div className="text-sm text-muted-foreground flex items-center gap-2"><Sparkles className="h-4 w-4" />AI analysis: {new Date(emotionData.emotions.timestamp).toLocaleString()}</div>
                <Button variant="outline" onClick={trackEmotions}><RefreshCw className="mr-2 h-4 w-4" />Update</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionTrackerPage;
