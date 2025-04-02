import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, ArrowDown, ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Match, Team } from "@/types/schema";

interface TossDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
  team1: Team | null;
  team2: Team | null;
  onTossComplete: (winner: number, decision: "bat" | "bowl") => void;
}

export default function TossDialog({ 
  open, 
  onOpenChange, 
  match, 
  team1,
  team2,
  onTossComplete 
}: TossDialogProps) {
  const { toast } = useToast();
  const [tossWinner, setTossWinner] = useState<number | null>(null);
  const [tossDecision, setTossDecision] = useState<"bat" | "bowl" | null>(null);
  const [tossMethod, setTossMethod] = useState<"coin" | "manual">("coin");
  const [coinResult, setCoinResult] = useState<"heads" | "tails" | null>(null);
  const [team1Call, setTeam1Call] = useState<"heads" | "tails" | null>(null);

  const handleToss = () => {
    if (tossMethod === "coin" && team1Call) {
      // Simulate a coin toss
      const result = Math.random() < 0.5 ? "heads" : "tails";
      setCoinResult(result);
      
      // Determine winner based on call
      const winner = result === team1Call ? team1?.id : team2?.id;
      if (winner) {
        setTossWinner(winner);
        toast({
          title: "Coin Toss Result",
          description: `It's ${result}! ${result === team1Call ? team1?.name : team2?.name} wins the toss.`,
        });
      }
    }
  };

  const completeToss = () => {
    if (!tossWinner || !tossDecision) {
      toast({
        title: "Cannot complete toss",
        description: "Please select a toss winner and decision",
        variant: "destructive"
      });
      return;
    }

    onTossComplete(tossWinner, tossDecision);
    onOpenChange(false);
    
    // Reset state
    setTossWinner(null);
    setTossDecision(null);
    setCoinResult(null);
    setTeam1Call(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Match Toss
          </DialogTitle>
          <DialogDescription>
            Determine which team will bat or bowl first
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Toss Method</Label>
            <RadioGroup
              value={tossMethod}
              onValueChange={(value) => setTossMethod(value as "coin" | "manual")}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="coin" id="coin" />
                <Label htmlFor="coin">Coin Toss</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Manual Selection</Label>
              </div>
            </RadioGroup>
          </div>

          {tossMethod === "coin" && (
            <>
              <div className="grid gap-2">
                <Label>Coin Call by {team1?.name}</Label>
                <RadioGroup
                  value={team1Call || ""}
                  onValueChange={(value) => setTeam1Call(value as "heads" | "tails")}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="heads" id="heads" />
                    <Label htmlFor="heads">Heads</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tails" id="tails" />
                    <Label htmlFor="tails">Tails</Label>
                  </div>
                </RadioGroup>
              </div>

              {!coinResult && (
                <Button onClick={handleToss} disabled={!team1Call}>
                  Flip Coin
                </Button>
              )}

              {coinResult && (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="font-semibold">Result: {coinResult.toUpperCase()}</p>
                  <p>
                    {coinResult === team1Call 
                      ? `${team1?.name} wins the toss!` 
                      : `${team2?.name} wins the toss!`}
                  </p>
                </div>
              )}
            </>
          )}

          {(tossMethod === "manual" || coinResult) && (
            <>
              {tossMethod === "manual" && (
                <div className="grid gap-2">
                  <Label>Toss Winner</Label>
                  <Select 
                    value={tossWinner?.toString() || ""} 
                    onValueChange={(value) => setTossWinner(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select toss winner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={team1?.id?.toString() || ""}>{team1?.name}</SelectItem>
                      <SelectItem value={team2?.id?.toString() || ""}>{team2?.name}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Toss Decision</Label>
                <RadioGroup
                  value={tossDecision || ""}
                  onValueChange={(value) => setTossDecision(value as "bat" | "bowl")}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bat" id="bat" />
                    <Label htmlFor="bat" className="flex items-center gap-1">
                      <ArrowDown className="h-4 w-4" /> Bat
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bowl" id="bowl" />
                    <Label htmlFor="bowl" className="flex items-center gap-1">
                      <ArrowUp className="h-4 w-4" /> Bowl
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={completeToss} 
            disabled={!tossWinner || !tossDecision}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}