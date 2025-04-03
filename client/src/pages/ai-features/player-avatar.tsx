import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, ArrowLeft, RefreshCw, Download, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Player {
  id: string;
  name: string;
  role: string;
  country: string;
  image?: string;
}

interface Avatar {
  id: string;
  avatar: {
    player: string;
    country: string;
    style: string;
    imageUrl: string;
    createdAt: string;
  };
}

const avatarStyles = [
  { id: 'cartoon', name: 'Cartoon' },
  { id: 'pixel', name: 'Pixel Art' },
  { id: 'comic', name: '3D Comic' },
  { id: 'anime', name: 'Anime' },
  { id: 'caricature', name: 'Caricature' }
];

const PlayerAvatarPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('cartoon');
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Avatar[]>([]);

  // Fetch players (simulated for now)
  useEffect(() => {
    // This would normally fetch from your API
    const mockPlayers: Player[] = [
      { id: '1', name: 'Virat Kohli', role: 'Batsman', country: 'India' },
      { id: '2', name: 'Joe Root', role: 'Batsman', country: 'England' },
      { id: '3', name: 'Jasprit Bumrah', role: 'Bowler', country: 'India' },
      { id: '4', name: 'Kane Williamson', role: 'Batsman', country: 'New Zealand' },
      { id: '5', name: 'Babar Azam', role: 'Batsman', country: 'Pakistan' },
      { id: '6', name: 'Pat Cummins', role: 'Bowler', country: 'Australia' },
      { id: '7', name: 'Shakib Al Hasan', role: 'All-rounder', country: 'Bangladesh' },
      { id: '8', name: 'Ben Stokes', role: 'All-rounder', country: 'England' },
      { id: '9', name: 'Rohit Sharma', role: 'Batsman', country: 'India' },
      { id: '10', name: 'Steve Smith', role: 'Batsman', country: 'Australia' },
      { id: '11', name: 'Trent Boult', role: 'Bowler', country: 'New Zealand' },
      { id: '12', name: 'Rashid Khan', role: 'Bowler', country: 'Afghanistan' },
    ];
    setPlayers(mockPlayers);
  }, []);

  // Generate avatar
  const generateAvatar = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    setAvatar(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/player-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          playerData: selectedPlayer,
          style: selectedStyle 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate avatar');
      }
      
      const data = await response.json();
      setAvatar(data);
      setHistory(prev => [data, ...prev.slice(0, 4)]); // Keep last 5 avatars
    } catch (err) {
      setError('Failed to generate avatar. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter players by country
  const countriesMap: Record<string, Player[]> = {};
  players.forEach(player => {
    if (!countriesMap[player.country]) {
      countriesMap[player.country] = [];
    }
    countriesMap[player.country].push(player);
  });
  
  const countries = Object.keys(countriesMap).sort();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/ai-features">
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Features
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-2">Player Avatar Creator</h1>
        <p className="text-muted-foreground mt-1">
          Create fun stylized avatars of cricket players
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Selection Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create an Avatar</CardTitle>
              <CardDescription>Select a player and style for their avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-2">Player</label>
                <Tabs defaultValue={countries[0] || ''}>
                  <TabsList className="w-full flex flex-wrap">
                    {countries.map(country => (
                      <TabsTrigger 
                        key={country} 
                        value={country}
                        className="flex-1 min-w-max"
                      >
                        {country}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {countries.map(country => (
                    <TabsContent key={country} value={country} className="mt-2">
                      <ScrollArea className="h-[200px]">
                        {countriesMap[country].map(player => (
                          <div 
                            key={player.id}
                            className={`p-3 mb-2 rounded-md cursor-pointer border ${
                              selectedPlayer?.id === player.id ? 'border-primary bg-primary/10' : 'border-border'
                            }`}
                            onClick={() => setSelectedPlayer(player)}
                          >
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground">{player.role}</div>
                          </div>
                        ))}
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Avatar Style</label>
                <Select 
                  value={selectedStyle} 
                  onValueChange={setSelectedStyle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {avatarStyles.map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={generateAvatar}
                disabled={!selectedPlayer || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : 'Generate Avatar'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Recent Avatars */}
          {history.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Avatars</CardTitle>
                <CardDescription>Avatars you've recently created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {history.map((item, index) => (
                    <div 
                      key={index}
                      className="border rounded-md overflow-hidden cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setAvatar(item)}
                    >
                      <div className="bg-muted aspect-square flex items-center justify-center">
                        <div className="text-center p-2">
                          <p className="font-medium text-xs">{item.avatar.player}</p>
                          <p className="text-xs text-muted-foreground">{item.avatar.style}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Avatar Display Section */}
        <div className="lg:col-span-2">
          {selectedPlayer && !avatar && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-4xl">🏏</div>
              <h3 className="text-2xl font-semibold mb-2">Create a Player Avatar</h3>
              <p className="text-muted-foreground mb-2">
                Selected player: {selectedPlayer.name} ({selectedPlayer.country})
              </p>
              <p className="text-muted-foreground mb-6">
                Style: {avatarStyles.find(s => s.id === selectedStyle)?.name}
              </p>
              <Button onClick={generateAvatar}>Generate Avatar</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-12 w-12 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Creating Avatar</h3>
              <p className="text-muted-foreground mb-6">
                Our AI is generating a stylized avatar for {selectedPlayer?.name}...
              </p>
              <Progress value={60} className="w-full max-w-md" />
            </div>
          )}

          {avatar && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {avatar.avatar.player}'s Avatar
                </CardTitle>
                <CardDescription className="text-center">
                  {avatar.avatar.country} • {avatarStyles.find(s => s.id === avatar.avatar.style)?.name} style
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-muted aspect-square w-full max-w-[400px] rounded-md overflow-hidden relative">
                  {/* This would display the actual AI-generated avatar in production */}
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-bold mb-2">{avatar.avatar.player}</h3>
                      <p className="text-muted-foreground italic mb-4">
                        (AI-generated {avatar.avatar.style} avatar would appear here)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  Created: {new Date(avatar.avatar.createdAt).toLocaleString()}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Avatar
                </Button>
                <Button 
                  onClick={generateAvatar}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New Avatar
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerAvatarPage;