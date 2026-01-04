import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ArrowLeft, RefreshCw, Download, Sparkles, Star, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Player {
  id: string;
  name: string;
  role: string;
  country: string;
  battingStyle?: string;
  bowlingStyle?: string;
  stats?: {
    matches: number;
    runs?: number;
    average?: number;
    wickets?: number;
    economy?: number;
    strikeRate?: number;
  };
}

interface PlayerCard {
  id: string;
  playerCard: {
    playerId: string;
    playerName: string;
    cardStyle: string;
    cardTitle: string;
    cardRarity: string;
    cardDescription: string;
    specialAbility: string;
    abilityDescription: string;
    cardValue: number;
    flavorText: string;
    attributes: {
      batting: number;
      bowling: number;
      fielding: number;
      leadership: number;
      clutch: number;
    };
    cardImageUrl: string;
    createdAt: string;
  };
}

const cardStyles = [
  { id: 'classic', name: 'Classic', icon: '🏆' },
  { id: 'modern', name: 'Modern', icon: '✨' },
  { id: 'retro', name: 'Retro', icon: '📻' },
  { id: 'futuristic', name: 'Futuristic', icon: '🚀' },
  { id: 'comic', name: 'Comic Book', icon: '💥' },
  { id: 'holographic', name: 'Holographic', icon: '🌈' },
  { id: 'minimalist', name: 'Minimalist', icon: '⬜' },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'Common': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'Uncommon': return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200';
    case 'Rare': return 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
    case 'Epic': return 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
    case 'Legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
    default: return 'bg-gray-200 text-gray-800';
  }
};

const getRarityGlow = (rarity: string) => {
  switch (rarity) {
    case 'Legendary': return 'shadow-lg shadow-yellow-500/50';
    case 'Epic': return 'shadow-lg shadow-purple-500/50';
    case 'Rare': return 'shadow-lg shadow-blue-500/50';
    default: return '';
  }
};

const PlayerCardsPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('classic');
  const [playerCard, setPlayerCard] = useState<PlayerCard | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mockPlayers: Player[] = [
      { id: '1', name: 'Virat Kohli', role: 'Batsman', country: 'India', battingStyle: 'Right-handed', stats: { matches: 102, runs: 3296, average: 52.32, strikeRate: 137.96 } },
      { id: '2', name: 'Joe Root', role: 'Batsman', country: 'England', battingStyle: 'Right-handed', stats: { matches: 117, runs: 9823, average: 50.38 } },
      { id: '3', name: 'Jasprit Bumrah', role: 'Bowler', country: 'India', bowlingStyle: 'Right-arm fast', stats: { matches: 38, wickets: 130, economy: 2.69 } },
      { id: '4', name: 'Kane Williamson', role: 'Batsman', country: 'New Zealand', battingStyle: 'Right-handed', stats: { matches: 91, runs: 7683, average: 54.31 } },
      { id: '5', name: 'Babar Azam', role: 'Batsman', country: 'Pakistan', battingStyle: 'Right-handed', stats: { matches: 40, runs: 3472, average: 49.16 } },
      { id: '6', name: 'Pat Cummins', role: 'Bowler', country: 'Australia', bowlingStyle: 'Right-arm fast', stats: { matches: 43, wickets: 214, economy: 2.76 } },
      { id: '7', name: 'Shakib Al Hasan', role: 'All-rounder', country: 'Bangladesh', battingStyle: 'Left-handed', bowlingStyle: 'Left-arm spin', stats: { matches: 63, runs: 4251, wickets: 224 } },
      { id: '8', name: 'Ben Stokes', role: 'All-rounder', country: 'England', battingStyle: 'Left-handed', bowlingStyle: 'Right-arm fast-medium', stats: { matches: 75, runs: 4789, wickets: 175 } },
      { id: '9', name: 'Rohit Sharma', role: 'Batsman', country: 'India', battingStyle: 'Right-handed', stats: { matches: 243, runs: 9825, average: 48.64, strikeRate: 89.04 } },
      { id: '10', name: 'Mitchell Starc', role: 'Bowler', country: 'Australia', bowlingStyle: 'Left-arm fast', stats: { matches: 77, wickets: 195, economy: 5.02 } },
    ];
    setPlayers(mockPlayers);
  }, []);

  const generatePlayerCard = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    setPlayerCard(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/player-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerData: selectedPlayer, style: selectedStyle }),
      });
      
      if (!response.ok) throw new Error('Failed to generate player card');
      
      const data = await response.json();
      setPlayerCard(data);
    } catch (err) {
      setError('Failed to generate player card. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const batsmen = players.filter(player => player.role === 'Batsman');
  const bowlers = players.filter(player => player.role === 'Bowler');
  const allRounders = players.filter(player => player.role === 'All-rounder');

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/ai-features">
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to AI Features
          </Button>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Star className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">AI Player Trading Cards</h1>
        </div>
        <p className="text-muted-foreground mt-1">Create unique AI-generated trading cards with special abilities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select a Player</CardTitle>
              <CardDescription>Choose a player for your trading card</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="batsmen">
                <TabsList className="w-full">
                  <TabsTrigger value="batsmen" className="flex-1">Batsmen</TabsTrigger>
                  <TabsTrigger value="bowlers" className="flex-1">Bowlers</TabsTrigger>
                  <TabsTrigger value="allrounders" className="flex-1">All-rounders</TabsTrigger>
                </TabsList>
                
                {['batsmen', 'bowlers', 'allrounders'].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    <ScrollArea className="h-[240px]">
                      {(tab === 'batsmen' ? batsmen : tab === 'bowlers' ? bowlers : allRounders).map((player) => (
                        <div 
                          key={player.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border transition-all ${selectedPlayer?.id === player.id ? 'border-primary bg-primary/10 shadow-md' : 'border-border hover:border-primary/50'}`}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">{player.country}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {player.stats?.matches} matches | {player.stats?.runs ? `${player.stats.runs} runs` : `${player.stats?.wickets} wickets`}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Card Style</label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger><SelectValue placeholder="Select a card style" /></SelectTrigger>
                  <SelectContent>
                    {cardStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>{style.icon} {style.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={generatePlayerCard} disabled={!selectedPlayer || loading}>
                {loading ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generating...</>) : (<><Sparkles className="mr-2 h-4 w-4" />Generate AI Card</>)}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {error && (<Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}

          {selectedPlayer && !playerCard && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-6xl">🃏</div>
              <h3 className="text-2xl font-semibold mb-2">Ready to Create Card</h3>
              <p className="text-muted-foreground mb-2">Player: {selectedPlayer.name} ({selectedPlayer.country})</p>
              <p className="text-muted-foreground mb-6">Style: {cardStyles.find(s => s.id === selectedStyle)?.icon} {cardStyles.find(s => s.id === selectedStyle)?.name}</p>
              <Button onClick={generatePlayerCard}><Sparkles className="mr-2 h-4 w-4" />Generate AI Card</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-16 w-16 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Creating AI Card</h3>
              <p className="text-muted-foreground mb-6">Gemini AI is generating a unique card for {selectedPlayer?.name}...</p>
              <Progress value={75} className="w-full max-w-md" />
            </div>
          )}

          {playerCard && (
            <div className="flex flex-col items-center">
              <div className="max-w-md w-full">
                <Card className={`border-2 overflow-hidden ${getRarityGlow(playerCard.playerCard.cardRarity)}`}>
                  <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6">
                    <Badge className={`absolute top-2 right-2 ${getRarityColor(playerCard.playerCard.cardRarity)}`}>
                      {playerCard.playerCard.cardRarity}
                    </Badge>
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-1">{playerCard.playerCard.cardTitle || selectedPlayer?.name}</h2>
                      <p className="text-lg text-muted-foreground">{selectedPlayer?.country}</p>
                      <Badge variant="outline" className="mt-2">{selectedPlayer?.role}</Badge>
                    </div>
                  </div>
                  
                  <CardContent className="pt-6">
                    {playerCard.playerCard.cardDescription && (
                      <p className="text-sm text-muted-foreground italic mb-4 text-center">"{playerCard.playerCard.cardDescription}"</p>
                    )}

                    {playerCard.playerCard.specialAbility && (
                      <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-sm">Special Ability: {playerCard.playerCard.specialAbility}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{playerCard.playerCard.abilityDescription}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><h4 className="text-sm font-medium mb-1">Card Style</h4><p className="text-sm">{cardStyles.find(s => s.id === playerCard.playerCard.cardStyle)?.icon} {cardStyles.find(s => s.id === playerCard.playerCard.cardStyle)?.name}</p></div>
                      <div><h4 className="text-sm font-medium mb-1">Card Value</h4><p className="text-sm font-bold text-primary">{playerCard.playerCard.cardValue} pts</p></div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <h4 className="text-sm font-medium mb-3">Attributes</h4>
                    <div className="space-y-2">
                      {Object.entries(playerCard.playerCard.attributes).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{key}</span>
                            <span className="font-medium">{value}/100</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      ))}
                    </div>

                    {playerCard.playerCard.flavorText && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs italic text-center text-muted-foreground">"{playerCard.playerCard.flavorText}"</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex justify-between">
                      <Button variant="outline" onClick={generatePlayerCard}><RefreshCw className="mr-2 h-4 w-4" />New Card</Button>
                      <Button><Download className="mr-2 h-4 w-4" />Save Card</Button>
                    </div>
                  </CardFooter>
                </Card>
                
                <div className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />AI card created on {new Date(playerCard.playerCard.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerCardsPage;
