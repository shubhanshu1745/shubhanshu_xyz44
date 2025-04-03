import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ArrowLeft, RefreshCw, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Player {
  id: string;
  name: string;
  role: string;
  country: string;
  image?: string;
  stats?: {
    matches: number;
    runs?: number;
    average?: number;
    wickets?: number;
    economy?: number;
  };
}

interface PlayerCard {
  id: string;
  playerCard: {
    playerId: string;
    playerName: string;
    cardStyle: string;
    cardRarity: string;
    cardValue: number;
    attributes: {
      batting: number;
      bowling: number;
      fielding: number;
      leadership: number;
    };
    cardImageUrl: string;
    createdAt: string;
  };
}

const cardStyles = [
  { id: 'classic', name: 'Classic' },
  { id: 'modern', name: 'Modern' },
  { id: 'retro', name: 'Retro' },
  { id: 'futuristic', name: 'Futuristic' },
  { id: 'comic', name: 'Comic Book' },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'Common': return 'bg-gray-200 text-gray-800';
    case 'Uncommon': return 'bg-green-200 text-green-800';
    case 'Rare': return 'bg-blue-200 text-blue-800';
    case 'Epic': return 'bg-purple-200 text-purple-800';
    case 'Legendary': return 'bg-yellow-200 text-yellow-800';
    default: return 'bg-gray-200 text-gray-800';
  }
};

const PlayerCardsPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('classic');
  const [playerCard, setPlayerCard] = useState<PlayerCard | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch players (simulated for now)
  useEffect(() => {
    // This would normally fetch from your API
    const mockPlayers: Player[] = [
      { 
        id: '1', 
        name: 'Virat Kohli', 
        role: 'Batsman', 
        country: 'India',
        stats: { matches: 102, runs: 3296, average: 52.32 }
      },
      { 
        id: '2', 
        name: 'Joe Root', 
        role: 'Batsman', 
        country: 'England',
        stats: { matches: 117, runs: 9823, average: 50.38 }
      },
      { 
        id: '3', 
        name: 'Jasprit Bumrah', 
        role: 'Bowler', 
        country: 'India',
        stats: { matches: 38, wickets: 130, economy: 2.69 }
      },
      { 
        id: '4', 
        name: 'Kane Williamson', 
        role: 'Batsman', 
        country: 'New Zealand',
        stats: { matches: 91, runs: 7683, average: 54.31 }
      },
      { 
        id: '5', 
        name: 'Babar Azam', 
        role: 'Batsman', 
        country: 'Pakistan',
        stats: { matches: 40, runs: 3472, average: 49.16 }
      },
      { 
        id: '6', 
        name: 'Pat Cummins', 
        role: 'Bowler', 
        country: 'Australia',
        stats: { matches: 43, wickets: 214, economy: 2.76 }
      },
      { 
        id: '7', 
        name: 'Shakib Al Hasan', 
        role: 'All-rounder', 
        country: 'Bangladesh',
        stats: { matches: 63, runs: 4251, wickets: 224 }
      },
      { 
        id: '8', 
        name: 'Ben Stokes', 
        role: 'All-rounder', 
        country: 'England',
        stats: { matches: 75, runs: 4789, wickets: 175 }
      },
    ];
    setPlayers(mockPlayers);
  }, []);

  // Generate player card
  const generatePlayerCard = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    setPlayerCard(null);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/player-card', {
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
        throw new Error('Failed to generate player card');
      }
      
      const data = await response.json();
      setPlayerCard(data);
    } catch (err) {
      setError('Failed to generate player card. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter players by role
  const batsmen = players.filter(player => player.role === 'Batsman');
  const bowlers = players.filter(player => player.role === 'Bowler');
  const allRounders = players.filter(player => player.role === 'All-rounder');

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Link href="/ai-features">
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Features
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mt-2">Player Trading Cards</h1>
        <p className="text-muted-foreground mt-1">
          Create unique digital trading cards for cricket players
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Selection Section */}
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
                
                <TabsContent value="batsmen" className="mt-4">
                  <ScrollArea className="h-[240px]">
                    {batsmen.length > 0 ? (
                      batsmen.map((player) => (
                        <div 
                          key={player.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedPlayer?.id === player.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">{player.country}</div>
                          <div className="text-sm text-muted-foreground">
                            Matches: {player.stats?.matches} | Avg: {player.stats?.average}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No batsmen available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="bowlers" className="mt-4">
                  <ScrollArea className="h-[240px]">
                    {bowlers.length > 0 ? (
                      bowlers.map((player) => (
                        <div 
                          key={player.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedPlayer?.id === player.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">{player.country}</div>
                          <div className="text-sm text-muted-foreground">
                            Matches: {player.stats?.matches} | Wickets: {player.stats?.wickets}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No bowlers available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="allrounders" className="mt-4">
                  <ScrollArea className="h-[240px]">
                    {allRounders.length > 0 ? (
                      allRounders.map((player) => (
                        <div 
                          key={player.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${selectedPlayer?.id === player.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-muted-foreground">{player.country}</div>
                          <div className="text-sm text-muted-foreground">
                            Matches: {player.stats?.matches} | Runs: {player.stats?.runs} | Wickets: {player.stats?.wickets}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">No all-rounders available</p>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Card Style</label>
                <Select 
                  value={selectedStyle} 
                  onValueChange={setSelectedStyle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a card style" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardStyles.map((style) => (
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
                onClick={generatePlayerCard}
                disabled={!selectedPlayer || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : 'Generate Card'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Card Display Section */}
        <div className="lg:col-span-2">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedPlayer && !playerCard && !loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <div className="mb-4 text-4xl">🏏</div>
              <h3 className="text-2xl font-semibold mb-2">Ready to Create Card</h3>
              <p className="text-muted-foreground mb-2">
                Selected player: {selectedPlayer.name} ({selectedPlayer.country})
              </p>
              <p className="text-muted-foreground mb-6">
                Style: {cardStyles.find(s => s.id === selectedStyle)?.name}
              </p>
              <Button onClick={generatePlayerCard}>Generate Card</Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center border rounded-lg bg-muted/30">
              <RefreshCw className="h-12 w-12 animate-spin mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2">Creating Player Card</h3>
              <p className="text-muted-foreground mb-6">
                Our AI is generating a unique trading card for {selectedPlayer?.name}...
              </p>
              <Progress value={75} className="w-full max-w-md" />
            </div>
          )}

          {playerCard && (
            <div className="flex flex-col items-center">
              <div className="max-w-md w-full">
                <Card className="border-2 overflow-hidden">
                  <div className="relative">
                    {/* This would be the actual card image in production */}
                    <div className="bg-primary/20 aspect-[3/4] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-4xl mb-2">{selectedPlayer?.name}</p>
                        <p className="text-xl">{selectedPlayer?.country}</p>
                        {/* This is a placeholder for the AI-generated image */}
                        <p className="mt-8 text-muted-foreground italic">
                          (AI-generated player card image would appear here)
                        </p>
                      </div>
                    </div>
                    <Badge 
                      className={`absolute top-2 right-2 ${getRarityColor(playerCard.playerCard.cardRarity)}`}
                    >
                      {playerCard.playerCard.cardRarity}
                    </Badge>
                  </div>
                  
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Card Style</h4>
                        <p>{cardStyles.find(s => s.id === playerCard.playerCard.cardStyle)?.name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Card Value</h4>
                        <p>{playerCard.playerCard.cardValue} points</p>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <h4 className="text-sm font-medium mb-2">Attributes</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Batting</span>
                          <span>{playerCard.playerCard.attributes.batting}/100</span>
                        </div>
                        <Progress value={playerCard.playerCard.attributes.batting} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Bowling</span>
                          <span>{playerCard.playerCard.attributes.bowling}/100</span>
                        </div>
                        <Progress value={playerCard.playerCard.attributes.bowling} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Fielding</span>
                          <span>{playerCard.playerCard.attributes.fielding}/100</span>
                        </div>
                        <Progress value={playerCard.playerCard.attributes.fielding} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Leadership</span>
                          <span>{playerCard.playerCard.attributes.leadership}/100</span>
                        </div>
                        <Progress value={playerCard.playerCard.attributes.leadership} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={generatePlayerCard}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        New Card
                      </Button>
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Save Card
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
                
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Card created on {new Date(playerCard.playerCard.createdAt).toLocaleString()}
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