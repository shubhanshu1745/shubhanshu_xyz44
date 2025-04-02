import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Award, Medal, UserCircle2 } from "lucide-react";
import { Player, Team } from "@/types/schema";

interface TeamOfficialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team1: Team | null;
  team2: Team | null;
  team1Players: Player[];
  team2Players: Player[];
  onSave: (
    team1Captain: number, 
    team1ViceCaptain: number, 
    team1Wicketkeeper: number,
    team2Captain: number,
    team2ViceCaptain: number,
    team2Wicketkeeper: number
  ) => void;
}

export default function TeamOfficialsDialog({
  open,
  onOpenChange,
  team1,
  team2,
  team1Players,
  team2Players,
  onSave
}: TeamOfficialsDialogProps) {
  const { toast } = useToast();
  const [team1Captain, setTeam1Captain] = useState<number | null>(null);
  const [team1ViceCaptain, setTeam1ViceCaptain] = useState<number | null>(null);
  const [team1Wicketkeeper, setTeam1Wicketkeeper] = useState<number | null>(null);
  
  const [team2Captain, setTeam2Captain] = useState<number | null>(null);
  const [team2ViceCaptain, setTeam2ViceCaptain] = useState<number | null>(null);
  const [team2Wicketkeeper, setTeam2Wicketkeeper] = useState<number | null>(null);

  const saveTeamOfficials = () => {
    if (!team1Captain || !team2Captain) {
      toast({
        title: "Select Team Captains",
        description: "Both teams must have a captain selected",
        variant: "destructive"
      });
      return;
    }

    onSave(
      team1Captain,
      team1ViceCaptain || team1Players[1]?.id || 0,  // Default to second player if not selected
      team1Wicketkeeper || team1Players.find(p => p.role === "Wicket-keeper")?.id || 0,
      team2Captain,
      team2ViceCaptain || team2Players[1]?.id || 0,
      team2Wicketkeeper || team2Players.find(p => p.role === "Wicket-keeper")?.id || 0
    );
    
    onOpenChange(false);
    toast({
      title: "Team Officials Set",
      description: "Captain, vice-captain and wicketkeeper roles have been assigned for both teams"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Team Officials
          </DialogTitle>
          <DialogDescription>
            Assign captain, vice-captain and wicketkeeper for both teams
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="team1" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team1">{team1?.name || "Team 1"}</TabsTrigger>
            <TabsTrigger value="team2">{team2?.name || "Team 2"}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="team1" className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Captain
                </Label>
                <Select 
                  value={team1Captain?.toString() || ""} 
                  onValueChange={(value) => setTeam1Captain(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select captain" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {team1Players.map(player => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-slate-400" />
                  Vice-Captain
                </Label>
                <Select 
                  value={team1ViceCaptain?.toString() || ""} 
                  onValueChange={(value) => setTeam1ViceCaptain(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vice-captain" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {team1Players
                        .filter(player => player.id !== team1Captain)
                        .map(player => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.name}
                          </SelectItem>
                        ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-blue-500" />
                  Wicketkeeper
                </Label>
                <Select 
                  value={team1Wicketkeeper?.toString() || ""} 
                  onValueChange={(value) => setTeam1Wicketkeeper(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wicketkeeper" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {team1Players.map(player => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name} {player.role === "Wicket-keeper" ? "(WK)" : ""}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="team2" className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Captain
                </Label>
                <Select 
                  value={team2Captain?.toString() || ""} 
                  onValueChange={(value) => setTeam2Captain(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select captain" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {team2Players.map(player => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-slate-400" />
                  Vice-Captain
                </Label>
                <Select 
                  value={team2ViceCaptain?.toString() || ""} 
                  onValueChange={(value) => setTeam2ViceCaptain(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vice-captain" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {team2Players
                        .filter(player => player.id !== team2Captain)
                        .map(player => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.name}
                          </SelectItem>
                        ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-blue-500" />
                  Wicketkeeper
                </Label>
                <Select 
                  value={team2Wicketkeeper?.toString() || ""} 
                  onValueChange={(value) => setTeam2Wicketkeeper(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wicketkeeper" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {team2Players.map(player => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name} {player.role === "Wicket-keeper" ? "(WK)" : ""}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveTeamOfficials}>
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}