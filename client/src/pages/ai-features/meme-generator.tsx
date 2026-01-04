import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw, Download, Share2, Sparkles, Laugh, TrendingUp, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Meme {
  id: string;
  meme: {
    prompt: string;
    title: string;
    topText: string;
    bottomText: string;
    description: string;
    suggestedTemplate: string;
    humorType: string;
    targetAudience: string;
    viralPotential: number;
    imageUrl: string;
    createdAt: string;
  };
}

const MemeGeneratorPage: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [meme, setMeme] = useState<Meme | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Meme[]>([]);

  const generateMeme = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    setLoading(true);
    setMeme(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/meme-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) throw new Error('Failed to generate meme');
      
      const data = await response.json();
      setMeme(data);
      setHistory(prev => [data, ...prev.slice(0, 9)]);
    } catch (err) {
      setError('Failed to generate meme. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "When Kohli gets out on 49",
    "Dhoni finishing the match in last over",
    "Rain Perera winning another match",
    "When you drop an easy catch",
    "Test cricket fans vs T20 fans",
    "IPL auction day reactions",
    "When umpire gives wrong decision",
    "Bowler after getting hit for 6 sixes"
  ];

  const getViralColor = (potential: number) => {
    if (potential >= 8) return 'text-green-500';
    if (potential >= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHumorBadgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'savage': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'sarcastic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'wholesome': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
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
          <Laugh className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">AI Cricket Meme Generator</h1>
        </div>
        <p className="text-muted-foreground mt-1">Create hilarious cricket memes with Gemini AI</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create a Meme</CardTitle>
              <CardDescription>Describe your cricket meme idea</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <Textarea 
                  placeholder="Describe your cricket meme idea... e.g., 'When Kohli gets out on 49'" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                  disabled={loading}
                />
                
                <div>
                  <p className="text-sm font-medium mb-2">🔥 Trending Ideas:</p>
                  <div className="flex flex-wrap gap-2">
                    {examples.slice(0, 4).map((example, index) => (
                      <Button key={index} variant="outline" size="sm" onClick={() => setPrompt(example)} disabled={loading} className="text-xs">
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={generateMeme} disabled={!prompt.trim() || loading}>
                {loading ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : (<><Sparkles className="mr-2 h-4 w-4" />Generate AI Meme</>)}
              </Button>
            </CardFooter>
          </Card>
          
          {history.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Recent Memes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.slice(0, 5).map((item, index) => (
                    <div 
                      key={index}
                      className="p-2 border rounded-md cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setMeme(item)}
                    >
                      <p className="text-sm font-medium truncate">{item.meme.title || 'Untitled Meme'}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.meme.prompt}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="lg:col-span-2">
          {!meme && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-6xl">😂</div>
              <h3 className="text-2xl font-semibold mb-2">Create Your Cricket Meme</h3>
              <p className="text-muted-foreground mb-6">Enter a prompt and let Gemini AI create a hilarious meme for you</p>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                {examples.slice(4).map((example, index) => (
                  <Button key={index} variant="outline" size="sm" onClick={() => { setPrompt(example); }} className="text-xs">
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-16 w-16 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Creating Your Meme</h3>
              <p className="text-muted-foreground mb-6">Gemini AI is crafting the perfect cricket meme...</p>
              <Progress value={65} className="w-full max-w-md" />
            </div>
          )}
          
          {meme && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Laugh className="h-6 w-6 text-yellow-500" />
                      {meme.meme.title || 'Your Cricket Meme'}
                    </CardTitle>
                    <CardDescription className="mt-1">Based on: "{meme.meme.prompt}"</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {meme.meme.humorType && (
                      <Badge className={getHumorBadgeColor(meme.meme.humorType)}>{meme.meme.humorType}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed rounded-lg overflow-hidden mb-6">
                  <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center p-6">
                    {meme.meme.topText && (
                      <p className="text-2xl font-bold text-center uppercase tracking-wide mb-4 text-white drop-shadow-lg" style={{textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'}}>
                        {meme.meme.topText}
                      </p>
                    )}
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-muted-foreground text-center italic">{meme.meme.description}</p>
                    </div>
                    {meme.meme.bottomText && (
                      <p className="text-2xl font-bold text-center uppercase tracking-wide mt-4 text-white drop-shadow-lg" style={{textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'}}>
                        {meme.meme.bottomText}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Template</p>
                    <p className="font-medium text-sm">{meme.meme.suggestedTemplate || 'Custom'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Users className="h-3 w-3" />Audience</p>
                    <p className="font-medium text-sm">{meme.meme.targetAudience || 'Cricket fans'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3" />Viral Score</p>
                    <p className={`font-bold text-lg ${getViralColor(meme.meme.viralPotential || 5)}`}>{meme.meme.viralPotential || 5}/10</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />Created: {new Date(meme.meme.createdAt).toLocaleString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-4 bg-muted/30">
                <Button variant="outline"><Download className="mr-2 h-4 w-4" />Download</Button>
                <Button><Share2 className="mr-2 h-4 w-4" />Share</Button>
                <Button variant="secondary" onClick={generateMeme}><RefreshCw className="mr-2 h-4 w-4" />New Meme</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeGeneratorPage;
