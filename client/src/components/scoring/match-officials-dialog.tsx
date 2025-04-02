import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gavel, User2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MatchOfficialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (officials: MatchOfficials) => void;
}

export interface MatchOfficials {
  mainUmpire: string;
  secondUmpire: string;
  thirdUmpire: string;
  matchReferee: string;
  weatherConditions: string;
  pitchConditions: string;
  venue: string;
  additionalNotes: string;
}

export default function MatchOfficialsDialog({
  open,
  onOpenChange,
  onSave
}: MatchOfficialsDialogProps) {
  const { toast } = useToast();
  const [officials, setOfficials] = useState<MatchOfficials>({
    mainUmpire: "",
    secondUmpire: "",
    thirdUmpire: "",
    matchReferee: "",
    weatherConditions: "Clear",
    pitchConditions: "Dry",
    venue: "",
    additionalNotes: ""
  });

  const handleChange = (key: keyof MatchOfficials, value: string) => {
    setOfficials(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveOfficials = () => {
    if (!officials.mainUmpire) {
      toast({
        title: "Main Umpire Required",
        description: "Please enter the name of the main umpire",
        variant: "destructive"
      });
      return;
    }

    onSave(officials);
    onOpenChange(false);
    toast({
      title: "Match Officials Set",
      description: "Umpires and match officials have been assigned"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Match Officials
          </DialogTitle>
          <DialogDescription>
            Assign umpires and set match conditions
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="mainUmpire" className="flex items-center gap-2">
                <User2 className="h-4 w-4" />
                Main Umpire<span className="text-red-500">*</span>
              </Label>
              <Input
                id="mainUmpire"
                value={officials.mainUmpire}
                onChange={(e) => handleChange("mainUmpire", e.target.value)}
                placeholder="Enter name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="secondUmpire" className="flex items-center gap-2">
                <User2 className="h-4 w-4" />
                Second Umpire
              </Label>
              <Input
                id="secondUmpire"
                value={officials.secondUmpire}
                onChange={(e) => handleChange("secondUmpire", e.target.value)}
                placeholder="Enter name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="thirdUmpire" className="flex items-center gap-2">
                <User2 className="h-4 w-4" />
                Third Umpire
              </Label>
              <Input
                id="thirdUmpire"
                value={officials.thirdUmpire}
                onChange={(e) => handleChange("thirdUmpire", e.target.value)}
                placeholder="Enter name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="matchReferee" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Match Referee
              </Label>
              <Input
                id="matchReferee"
                value={officials.matchReferee}
                onChange={(e) => handleChange("matchReferee", e.target.value)}
                placeholder="Enter name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="weatherConditions">Weather Conditions</Label>
              <Select 
                value={officials.weatherConditions} 
                onValueChange={(value) => handleChange("weatherConditions", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weather conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clear">Clear</SelectItem>
                  <SelectItem value="Sunny">Sunny</SelectItem>
                  <SelectItem value="Cloudy">Cloudy</SelectItem>
                  <SelectItem value="Overcast">Overcast</SelectItem>
                  <SelectItem value="Rainy">Rainy</SelectItem>
                  <SelectItem value="Humid">Humid</SelectItem>
                  <SelectItem value="Foggy">Foggy</SelectItem>
                  <SelectItem value="Windy">Windy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pitchConditions">Pitch Conditions</Label>
              <Select 
                value={officials.pitchConditions} 
                onValueChange={(value) => handleChange("pitchConditions", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pitch conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dry">Dry</SelectItem>
                  <SelectItem value="Green">Green</SelectItem>
                  <SelectItem value="Dusty">Dusty</SelectItem>
                  <SelectItem value="Damp">Damp</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                  <SelectItem value="Flat">Flat</SelectItem>
                  <SelectItem value="Cracked">Cracked</SelectItem>
                  <SelectItem value="Wet">Wet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="venue">Venue Details</Label>
            <Input
              id="venue"
              value={officials.venue}
              onChange={(e) => handleChange("venue", e.target.value)}
              placeholder="Enter venue details"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={officials.additionalNotes}
              onChange={(e) => handleChange("additionalNotes", e.target.value)}
              placeholder="Add any additional notes about match conditions"
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveOfficials}>
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}