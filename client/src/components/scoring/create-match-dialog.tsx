import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Player {
  id: number;
  name: string;
  role: string;
}

interface Team {
  name: string;
  players: Player[];
}

interface Match {
  name: string;
  venue: string;
  date: string;
  overs: number;
  team1: Team;
  team2: Team;
}

interface CreateMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchCreated: (match: Match) => void;
}

export default function CreateMatchDialog({ open, onOpenChange, onMatchCreated }: CreateMatchDialogProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const [matchDetails, setMatchDetails] = useState<Match>({
    name: "",
    venue: "",
    date: new Date().toISOString().split("T")[0],
    overs: 20,
    team1: {
      name: "",
      players: Array(11).fill(null).map((_, i) => ({ 
        id: i + 1, 
        name: "", 
        role: "Batsman" 
      }))
    },
    team2: {
      name: "",
      players: Array(11).fill(null).map((_, i) => ({ 
        id: i + 12, 
        name: "", 
        role: "Batsman" 
      }))
    }
  });

  const updateMatchDetail = (field: keyof Match, value: string | number) => {
    setMatchDetails({
      ...matchDetails,
      [field]: value
    });
  };

  const updateTeamName = (team: 'team1' | 'team2', name: string) => {
    setMatchDetails({
      ...matchDetails,
      [team]: {
        ...matchDetails[team],
        name
      }
    });
  };

  const updatePlayerName = (team: 'team1' | 'team2', index: number, name: string) => {
    const updatedPlayers = [...matchDetails[team].players];
    updatedPlayers[index] = { 
      ...updatedPlayers[index], 
      name 
    };

    setMatchDetails({
      ...matchDetails,
      [team]: {
        ...matchDetails[team],
        players: updatedPlayers
      }
    });
  };

  const updatePlayerRole = (team: 'team1' | 'team2', index: number, role: string) => {
    const updatedPlayers = [...matchDetails[team].players];
    updatedPlayers[index] = { 
      ...updatedPlayers[index], 
      role 
    };

    setMatchDetails({
      ...matchDetails,
      [team]: {
        ...matchDetails[team],
        players: updatedPlayers
      }
    });
  };

  const createMatch = () => {
    // Validate match details
    if (!matchDetails.name.trim()) {
      toast({
        title: "Match name required",
        description: "Please enter a name for the match",
        variant: "destructive"
      });
      return;
    }

    if (!matchDetails.venue.trim()) {
      toast({
        title: "Venue required",
        description: "Please enter a venue for the match",
        variant: "destructive"
      });
      return;
    }

    if (!matchDetails.team1.name.trim()) {
      toast({
        title: "Team 1 name required",
        description: "Please enter a name for Team 1",
        variant: "destructive"
      });
      return;
    }

    if (!matchDetails.team2.name.trim()) {
      toast({
        title: "Team 2 name required",
        description: "Please enter a name for Team 2",
        variant: "destructive"
      });
      return;
    }

    // Check if at least a few players are filled in
    const team1PlayersFilled = matchDetails.team1.players.filter(p => p.name.trim()).length;
    const team2PlayersFilled = matchDetails.team2.players.filter(p => p.name.trim()).length;

    if (team1PlayersFilled < 2) {
      toast({
        title: "Team 1 players required",
        description: "Please enter at least two players for Team 1",
        variant: "destructive"
      });
      return;
    }

    if (team2PlayersFilled < 2) {
      toast({
        title: "Team 2 players required",
        description: "Please enter at least two players for Team 2",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    // Simulate API call to create match
    setTimeout(() => {
      setIsCreating(false);
      onMatchCreated(matchDetails);
      onOpenChange(false);
      
      toast({
        title: "Match created",
        description: `${matchDetails.name} has been created successfully`
      });
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
          <DialogDescription>Set up a new cricket match for scoring</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="match-name">Match Name</Label>
              <Input 
                id="match-name" 
                placeholder="e.g. Friendly Match" 
                value={matchDetails.name}
                onChange={(e) => updateMatchDetail('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input 
                id="venue" 
                placeholder="e.g. Local Ground" 
                value={matchDetails.venue}
                onChange={(e) => updateMatchDetail('venue', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Match Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={matchDetails.date}
                onChange={(e) => updateMatchDetail('date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overs">Overs</Label>
              <Select
                value={matchDetails.overs.toString()}
                onValueChange={(value) => updateMatchDetail('overs', parseInt(value))}
              >
                <SelectTrigger id="overs">
                  <SelectValue placeholder="Select overs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Overs</SelectItem>
                  <SelectItem value="10">10 Overs</SelectItem>
                  <SelectItem value="20">20 Overs (T20)</SelectItem>
                  <SelectItem value="50">50 Overs (ODI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team1-name">Team 1 Name</Label>
                  <Input 
                    id="team1-name" 
                    placeholder="e.g. Tigers" 
                    value={matchDetails.team1.name}
                    onChange={(e) => updateTeamName('team1', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Team 1 Players</Label>
                    <div className="text-xs text-muted-foreground">
                      {matchDetails.team1.players.filter(p => p.name.trim()).length}/11 players added
                    </div>
                  </div>
                  <div className="space-y-3">
                    {matchDetails.team1.players.map((player, index) => (
                      <div key={`team1-player-${index}`} className="flex items-center gap-3">
                        <span className="font-medium w-6 text-right">{index + 1}.</span>
                        <Input 
                          placeholder={`Player ${index + 1}`} 
                          value={player.name}
                          onChange={(e) => updatePlayerName('team1', index, e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={player.role}
                          onValueChange={(value) => updatePlayerRole('team1', index, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Batsman">Batsman</SelectItem>
                            <SelectItem value="Bowler">Bowler</SelectItem>
                            <SelectItem value="All-rounder">All-rounder</SelectItem>
                            <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team2-name">Team 2 Name</Label>
                  <Input 
                    id="team2-name" 
                    placeholder="e.g. Lions" 
                    value={matchDetails.team2.name}
                    onChange={(e) => updateTeamName('team2', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Team 2 Players</Label>
                    <div className="text-xs text-muted-foreground">
                      {matchDetails.team2.players.filter(p => p.name.trim()).length}/11 players added
                    </div>
                  </div>
                  <div className="space-y-3">
                    {matchDetails.team2.players.map((player, index) => (
                      <div key={`team2-player-${index}`} className="flex items-center gap-3">
                        <span className="font-medium w-6 text-right">{index + 1}.</span>
                        <Input 
                          placeholder={`Player ${index + 1}`} 
                          value={player.name}
                          onChange={(e) => updatePlayerName('team2', index, e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={player.role}
                          onValueChange={(value) => updatePlayerRole('team2', index, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Batsman">Batsman</SelectItem>
                            <SelectItem value="Bowler">Bowler</SelectItem>
                            <SelectItem value="All-rounder">All-rounder</SelectItem>
                            <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
            onClick={createMatch}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create Match"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}