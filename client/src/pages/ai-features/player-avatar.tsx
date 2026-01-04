import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, ArrowLeft, RefreshCw, Download, Camera, Sparkles, Palette, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Player {
  id: string;
  name: string;
  role: string;
  country: string;
}

interface Avatar {
  id: string;
  avatar: {
    player: string;
    country: string;
    style: string;
    title: string;
    visualDescription: string;
    colorPalette: string[];
    pose: string;
    expression: string;
    accessories: string[];
    background: string;
    styleNotes: string;
    signatureElement: string;
    imageUrl: string;
    createdAt: string;
  };
}

const avatarStyles = [
  { id: 'cartoon', name: 'Cartoon', icon: '🎨', desc: 'Fun and colorful cartoon style' },
  { id: 'pixel', name: 'Pixel Art', icon: '👾', desc: 'Retro 8-bit pixel art' },
  { id: 'comic', name: '3D Comic', icon: '💥', desc: 'Bold comic book style' },
  { id: 'anime', name: 'Anime', icon: '🌸', desc: 'Japanese anime style' },
  { id: 'caricature', name: 'Caricature', icon: '😄', desc: 'Exaggerated fun features' },
  { id: 'minimalist', name: 'Minimalist', icon: '⬜', desc: 'Clean and simple' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨', desc: 'Artistic watercolor painting' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🤖', desc: 'Futuristic neon style' },
];

const PlayerAvatarPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('cartoon');
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Avatar[]>([]);

  useEffect(() => {
    const mockPlayers: Player[] = [
      { id: '1', name: 'Virat Kohli', role: 'Batsman', country: 'India' },
      { id: '2', name: 'Rohit Sharma', role: 'Batsman', country: 'India' },
      { id: '3', name: 'Jasprit Bumrah', role: 'Bowler', country: 'India' },
      { id: '4', name: 'Joe Root', role: 'Batsman', country: 'England' },
      { id: '5', name: 'Ben Stokes', role: 'All-rounder', country: 'England' },
      { id: '6', name: 'Pat Cummins', role: 'Bowler', country: 'Australia' },
      { id: '7', name: 'Steve Smith', role: 'Batsman', country: 'Australia' },
      { id: '8', name: 'Kane Williamson', role: 'Batsman', country: 'New Zealand' },
      { id: '9', name: 'Trent Boult', role: 'Bowler', country: 'New Zealand' },
      { id: '10', name: 'Babar Azam', role: 'Batsman', country: 'Pakistan' },
      { id: '11', name: 'Shaheen Afridi', role: 'Bowler', country: 'Pakistan' },
      { id: '12', name: 'Rashid Khan', role: 'Bowler', country: 'Afghanistan' },
      { id: '13', name: 'Shakib Al Hasan', role: 'All-rounder', country: 'Bangladesh' },
      { id: '14', name: 'Quinton de Kock', role: 'Batsman', country: 'South Africa' },
    ];
    setPlayers(mockPlayers);
  }, []);

  const generateAvatar = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    setAvatar(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/player-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerData: selectedPlayer, style: selectedStyle }),
      });
      
      if (!response.ok) throw new Error('Failed to generate avatar');
      
      const data = await response.json();
      setAvatar(data);
      setHistory(prev => [data, ...prev.slice(0, 4)]);
    } catch (err) {
      setError('Failed to generate avatar. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const countriesMap: Record<string, Player[]> = {};
  players.forEach(player => {
    if (!countriesMap[player.country]) countriesMap[player.country] = [];
    countriesMap[player.country].push(player);
  });
  const countries = Object.keys(countriesMap).sort();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/ai-features">
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to AI Features
          </Button>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <User className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">AI Player Avatar Creator</h1>
        </div>
        <p className="text-muted-foreground mt-1">Create unique stylized avatars with Gemini AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create an Avatar</CardTitle>
              <CardDescription>Select a player and style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (<Alert variant="destructive" className="mb-2"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
              
              <div>
                <label className="block text-sm font-medium mb-2">Player</label>
                <Tabs defaultValue={countries[0] || ''}>
                  <TabsList className="w-full flex flex-wrap h-auto">
                    {countries.slice(0, 4).map(country => (
                      <TabsTrigger key={country} value={country} className="flex-1 text-xs">{country}</TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {countries.map(country => (
                    <TabsContent key={country} value={country} className="mt-2">
                      <ScrollArea className="h-[180px]">
                        {countriesMap[country].map(player => (
                          <div 
                            key={player.id}
                            className={`p-3 mb-2 rounded-md cursor-pointer border transition-all ${selectedPlayer?.id === player.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border hover:border-primary/50'}`}
                            onClick={() => setSelectedPlayer(player)}
                          >
                            <div className="font-medium">{player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.role}</div>
                          </div>
                        ))}
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Avatar Style</label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger><SelectValue placeholder="Select a style" /></SelectTrigger>
                  <SelectContent>
                    {avatarStyles.map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        <span className="flex items-center gap-2">{style.icon} {style.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">{avatarStyles.find(s => s.id === selectedStyle)?.desc}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={generateAvatar} disabled={!selectedPlayer || loading}>
                {loading ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : (<><Sparkles className="mr-2 h-4 w-4" />Generate AI Avatar</>)}
              </Button>
            </CardFooter>
          </Card>
          
          {history.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Avatars</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {history.map((item, index) => (
                    <div key={index} className="border rounded-md p-2 cursor-pointer hover:border-primary transition-colors" onClick={() => setAvatar(item)}>
                      <p className="font-medium text-xs truncate">{item.avatar.player}</p>
                      <p className="text-xs text-muted-foreground">{avatarStyles.find(s => s.id === item.avatar.style)?.icon} {item.avatar.style}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedPlayer && !avatar && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-6xl">{avatarStyles.find(s => s.id === selectedStyle)?.icon || '🎨'}</div>
              <h3 className="text-2xl font-semibold mb-2">Create AI Avatar</h3>
              <p className="text-muted-foreground mb-2">{selectedPlayer.name} ({selectedPlayer.country})</p>
              <p className="text-muted-foreground mb-6">Style: {avatarStyles.find(s => s.id === selectedStyle)?.name}</p>
              <Button onClick={generateAvatar}><Sparkles className="mr-2 h-4 w-4" />Generate AI Avatar</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-16 w-16 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Creating AI Avatar</h3>
              <p className="text-muted-foreground mb-6">Gemini AI is designing a {selectedStyle} avatar for {selectedPlayer?.name}...</p>
              <Progress value={60} className="w-full max-w-md" />
            </div>
          )}

          {avatar && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <User className="h-6 w-6 text-purple-500" />
                      {avatar.avatar.title || `${avatar.avatar.player}'s Avatar`}
                    </CardTitle>
                    <CardDescription>{avatar.avatar.country} • {avatarStyles.find(s => s.id === avatar.avatar.style)?.icon} {avatarStyles.find(s => s.id === avatar.avatar.style)?.name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-muted to-muted/50 aspect-square rounded-lg flex items-center justify-center border-2 border-dashed">
                    <div className="text-center p-6">
                      <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-bold mb-2">{avatar.avatar.player}</h3>
                      <p className="text-sm text-muted-foreground italic">{avatar.avatar.visualDescription}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {avatar.avatar.pose && (
                      <div><h4 className="text-sm font-medium text-muted-foreground">Pose</h4><p className="font-medium">{avatar.avatar.pose}</p></div>
                    )}
                    {avatar.avatar.expression && (
                      <div><h4 className="text-sm font-medium text-muted-foreground">Expression</h4><p className="font-medium">{avatar.avatar.expression}</p></div>
                    )}
                    {avatar.avatar.background && (
                      <div><h4 className="text-sm font-medium text-muted-foreground">Background</h4><p className="font-medium">{avatar.avatar.background}</p></div>
                    )}
                    {avatar.avatar.signatureElement && (
                      <div><h4 className="text-sm font-medium text-muted-foreground">Signature Element</h4><p className="font-medium">{avatar.avatar.signatureElement}</p></div>
                    )}
                    
                    {avatar.avatar.colorPalette && avatar.avatar.colorPalette.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1"><Palette className="h-4 w-4" />Color Palette</h4>
                        <div className="flex gap-2">
                          {avatar.avatar.colorPalette.map((color, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <div className="w-6 h-6 rounded-full border" style={{backgroundColor: color}}></div>
                              <span className="text-xs">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {avatar.avatar.accessories && avatar.avatar.accessories.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Accessories</h4>
                        <div className="flex flex-wrap gap-2">
                          {avatar.avatar.accessories.map((acc, i) => (
                            <Badge key={i} variant="outline">{acc}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {avatar.avatar.styleNotes && (
                  <><Separator className="my-6" />
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Style Notes</h4>
                    <p className="text-sm text-muted-foreground">{avatar.avatar.styleNotes}</p>
                  </div></>
                )}
              </CardContent>
              <CardFooter className="flex justify-between bg-muted/30">
                <div className="text-sm text-muted-foreground flex items-center gap-2"><Sparkles className="h-4 w-4" />{new Date(avatar.avatar.createdAt).toLocaleString()}</div>
                <div className="flex gap-2">
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" />Download</Button>
                  <Button onClick={generateAvatar}><RefreshCw className="mr-2 h-4 w-4" />New Avatar</Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerAvatarPage;
