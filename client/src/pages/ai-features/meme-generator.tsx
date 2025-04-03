import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw, Download, Share2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

interface Meme {
  id: string;
  meme: {
    prompt: string;
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

  // Generate meme
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate meme');
      }
      
      const data = await response.json();
      setMeme(data);
      setHistory(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 memes
    } catch (err) {
      setError('Failed to generate meme. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Examples to help users get started
  const examples = [
    "Cricket batsman missing the ball by a mile",
    "When the umpire gives you out but you know you didn't hit it",
    "Cricket fans waiting for rain to stop",
    "When you drop an easy catch and try to act normal",
    "Test match vs T20: Expectation vs Reality"
  ];

  // Use an example as prompt
  const useExample = (example: string) => {
    setPrompt(example);
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
        <h1 className="text-3xl font-bold mt-2">Cricket Meme Generator</h1>
        <p className="text-muted-foreground mt-1">
          Create hilarious cricket-themed memes with AI
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt Input Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create a Meme</CardTitle>
              <CardDescription>Enter a prompt describing the meme you want</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <Textarea 
                  placeholder="Describe your cricket meme idea..." 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                  disabled={loading}
                />
                
                <div>
                  <p className="text-sm font-medium mb-2">Need inspiration? Try these:</p>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => useExample(example)}
                        disabled={loading}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={generateMeme}
                disabled={!prompt.trim() || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : 'Generate Meme'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Recent Memes */}
          {history.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Recent Memes</CardTitle>
                <CardDescription>Memes you've recently created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {history.map((item, index) => (
                    <div 
                      key={index}
                      className="border rounded-md overflow-hidden cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setMeme(item)}
                    >
                      <div className="h-24 bg-muted flex items-center justify-center">
                        <p className="text-xs text-center p-2 text-muted-foreground">
                          {item.meme.prompt.length > 50 
                            ? item.meme.prompt.substring(0, 50) + '...' 
                            : item.meme.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Meme Display Section */}
        <div className="lg:col-span-2">
          {!meme && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-4xl">😂</div>
              <h3 className="text-2xl font-semibold mb-2">Create Your Cricket Meme</h3>
              <p className="text-muted-foreground mb-6">
                Enter a prompt describing a cricket-themed meme, and our AI will generate it for you.
              </p>
              <div className="text-muted-foreground mb-6 max-w-md">
                <p className="mb-2">Examples:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>A batsman celebrating too early and getting out</li>
                  <li>Fans reaction when their team loses from a winning position</li>
                  <li>A wicketkeeper missing an easy stumping</li>
                </ul>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-12 w-12 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Creating Your Meme</h3>
              <p className="text-muted-foreground mb-6">
                Our AI is generating your cricket meme based on your prompt...
              </p>
              <Progress value={65} className="w-full max-w-md" />
            </div>
          )}
          
          {meme && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Your Generated Meme</CardTitle>
                <CardDescription className="text-center">{meme.meme.prompt}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="border rounded-md overflow-hidden w-full max-w-md">
                  {/* This would display the actual AI-generated meme in production */}
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <div className="text-center p-4">
                      <p className="font-bold text-xl mb-2">Your Cricket Meme</p>
                      <p className="text-muted-foreground italic mb-4">
                        (AI-generated meme image would appear here)
                      </p>
                      <p className="font-medium text-sm">Based on prompt:</p>
                      <p className="text-sm text-muted-foreground">"{meme.meme.prompt}"</p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  Created: {new Date(meme.meme.createdAt).toLocaleString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button 
                  variant="secondary"
                  onClick={generateMeme}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Meme
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeGeneratorPage;