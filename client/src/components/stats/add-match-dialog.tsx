
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPlayerMatchSchema, createPlayerMatchPerformanceSchema } from "@shared/schema";
import type { CreatePlayerMatchFormData, CreatePlayerMatchPerformanceFormData } from "@shared/schema";
import { useToast } from "../ui/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function AddMatchDialog({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'match' | 'performance'>('match');
  const [newMatchId, setNewMatchId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // For handling opening/closing from parent components if needed
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    // Only reset when closing the dialog
    if (!newOpen) {
      setCurrentStep('match');
      setNewMatchId(null);
      matchForm.reset();
      performanceForm.reset();
    }
  };

  const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD string
  
  const matchForm = useForm<Omit<CreatePlayerMatchFormData, 'matchDate'> & { matchDate: string }>({
    resolver: zodResolver(
      createPlayerMatchSchema.omit({ matchDate: true }).extend({
        matchDate: z.string().min(1, "Match date is required")
      })
    ),
    defaultValues: {
      matchName: '',
      matchDate: today,
      venue: '',
      opponent: '',
      matchType: 'T20',
    },
  });

  const performanceForm = useForm<CreatePlayerMatchPerformanceFormData>({
    resolver: zodResolver(createPlayerMatchPerformanceSchema),
    defaultValues: {
      runsScored: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      oversBowled: '0',
      runsConceded: 0,
      wicketsTaken: 0,
      maidens: 0,
      catches: 0,
      runOuts: 0,
    },
  });

  const addMatchMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchFormData) => {
      const response = await fetch(`/api/users/${user?.username}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add match');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setNewMatchId(data.id);
      setCurrentStep('performance');
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}/matches`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addPerformanceMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchPerformanceFormData) => {
      const response = await fetch(`/api/users/${user?.username}/matches/${newMatchId}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add performance');
      return response.json();
    },
    onSuccess: () => {
      handleOpenChange(false);
      setCurrentStep('match');
      setNewMatchId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}/player-stats`] });
      toast({
        title: "Success",
        description: "Match and performance recorded successfully",
      });
      matchForm.reset();
      performanceForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add performance. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onMatchSubmit = (data: Omit<CreatePlayerMatchFormData, 'matchDate'> & { matchDate: string }) => {
    // Convert string date to Date object as required by the API
    const formattedData = {
      ...data,
      matchDate: new Date(data.matchDate),
      userId: user?.id || 0
    };
    addMatchMutation.mutate(formattedData as unknown as CreatePlayerMatchFormData);
  };

  const onPerformanceSubmit = (data: CreatePlayerMatchPerformanceFormData) => {
    if (newMatchId) {
      addPerformanceMutation.mutate({ 
        ...data, 
        matchId: newMatchId,
        userId: user?.id || 0
      });
    }
  };

  const openDialog = () => {
    setOpen(true);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" onClick={openDialog} className="bg-[#2E8B57] hover:bg-[#1F3B4D]">
          Add New Match
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'match' ? 'Add New Match' : 'Add Performance Details'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'match'
              ? 'Enter the details of your cricket match'
              : 'Record your performance in this match'
            }
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'match' ? (
          <Form {...matchForm}>
            <form onSubmit={matchForm.handleSubmit(onMatchSubmit)} className="space-y-4">
              <FormField
                control={matchForm.control}
                name="matchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Friendly Match vs Team X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={matchForm.control}
                name="matchDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={matchForm.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="Match location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={matchForm.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent</FormLabel>
                    <FormControl>
                      <Input placeholder="Opponent team name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={matchForm.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select match type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="T20">T20</SelectItem>
                        <SelectItem value="ODI">ODI</SelectItem>
                        <SelectItem value="Test">Test</SelectItem>
                        <SelectItem value="Practice">Practice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2E8B57] hover:bg-[#1F3B4D]">
                  Next: Add Performance
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...performanceForm}>
            <form onSubmit={performanceForm.handleSubmit(onPerformanceSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Batting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={performanceForm.control}
                    name="runsScored"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Runs</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
  
                  <FormField
                    control={performanceForm.control}
                    name="ballsFaced"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balls</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
  
                  <FormField
                    control={performanceForm.control}
                    name="fours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>4s</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
  
                  <FormField
                    control={performanceForm.control}
                    name="sixes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6s</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
  
              <div>
                <h3 className="text-lg font-medium mb-3">Bowling</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={performanceForm.control}
                    name="oversBowled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overs</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
  
                  <FormField
                    control={performanceForm.control}
                    name="runsConceded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Runs Conceded</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
  
                  <FormField
                    control={performanceForm.control}
                    name="wicketsTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wickets</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
  
                  <FormField
                    control={performanceForm.control}
                    name="maidens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maidens</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
  
              <div>
                <h3 className="text-lg font-medium mb-3">Fielding</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={performanceForm.control}
                    name="catches"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catches</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
  
                  <FormField
                    control={performanceForm.control}
                    name="runOuts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Run Outs</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
  
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('match')}
                  className="mr-auto"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="bg-[#2E8B57] hover:bg-[#1F3B4D]">
                  Save Performance
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
