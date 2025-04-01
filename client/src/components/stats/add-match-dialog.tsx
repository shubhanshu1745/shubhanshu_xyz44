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
  // Component state
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'match' | 'performance'>('match');
  const [newMatchId, setNewMatchId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Today's date for default form value
  const today = new Date().toISOString().split('T')[0];

  // Match Form setup
  const matchForm = useForm<Omit<CreatePlayerMatchFormData, 'matchDate' | 'userId'> & { matchDate: string }>({
    resolver: zodResolver(
      createPlayerMatchSchema.omit({ matchDate: true, userId: true }).extend({
        matchDate: z.string().min(1, "Match date is required")
      })
    ),
    defaultValues: {
      matchName: '',
      matchDate: today,
      venue: '',
      opponent: '',
      matchType: 'T20',
      teamScore: '',
      opponentScore: '',
      result: '',
    },
  });

  // Performance Form setup
  const performanceForm = useForm<CreatePlayerMatchPerformanceFormData>({
    resolver: zodResolver(createPlayerMatchPerformanceSchema),
    defaultValues: {
      runsScored: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      battingStatus: 'Not Out',
      oversBowled: '0',
      runsConceded: 0,
      wicketsTaken: 0,
      maidens: 0,
      catches: 0,
      runOuts: 0,
      stumpings: 0,
      playerOfMatch: false,
    },
  });

  // Reset forms when the dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    
    if (!newOpen) {
      resetDialogState();
    }
  };

  // Reset all state and forms
  const resetDialogState = () => {
    setCurrentStep('match');
    setNewMatchId(null);
    setSubmitting(false);
    matchForm.reset({
      matchName: '',
      matchDate: today,
      venue: '',
      opponent: '',
      matchType: 'T20',
      teamScore: '',
      opponentScore: '',
      result: '',
    });
    performanceForm.reset({
      runsScored: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      battingStatus: 'Not Out',
      oversBowled: '0',
      runsConceded: 0,
      wicketsTaken: 0,
      maidens: 0,
      catches: 0,
      runOuts: 0,
      stumpings: 0,
      playerOfMatch: false,
    });
  };

  // Match Creation Mutation
  const addMatchMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchFormData): Promise<{ id: number }> => {
      if (!user?.username) {
        throw new Error("User not authenticated");
      }

      console.log("Match data to submit:", data);
      
      try {
        const response = await fetch(`/api/users/${user.username}/matches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        console.log("Match API response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
          console.error("Match API error:", errorData);
          throw new Error(errorData.message || `Failed with status ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Match API response data:", responseData);
        
        if (!responseData.id || typeof responseData.id !== 'number') {
          throw new Error("Server did not return a valid match ID");
        }

        return responseData;
      } catch (error) {
        console.error("Match submission error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Match created successfully with ID:", data.id);
      setNewMatchId(data.id);
      setCurrentStep('performance');
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}/matches`] });
      toast({
        title: "Success",
        description: "Match created successfully! Now add your performance.",
      });
      setSubmitting(false);
    },
    onError: (error: Error) => {
      console.error("Match creation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create match. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    },
  });

  // Performance Creation Mutation
  const addPerformanceMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchPerformanceFormData) => {
      if (!user?.username) {
        throw new Error("User not authenticated");
      }

      if (newMatchId === null) {
        throw new Error("Match ID is missing");
      }

      console.log("Performance data to submit:", data);
      
      try {
        const response = await fetch(`/api/users/${user.username}/matches/${newMatchId}/performance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        console.log("Performance API response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
          console.error("Performance API error:", errorData);
          throw new Error(errorData.message || `Failed with status ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Performance API response data:", responseData);
        
        return responseData;
      } catch (error) {
        console.error("Performance submission error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Performance recorded successfully!");
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.username}/player-stats`] });
      toast({
        title: "Success",
        description: "Performance recorded successfully!",
      });
      setSubmitting(false);
      handleOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Performance recording failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record performance. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    },
  });

  // Match Form Submit Handler
  const onMatchSubmit = (formData: Omit<CreatePlayerMatchFormData, 'matchDate' | 'userId'> & { matchDate: string }) => {
    if (submitting) return;
    setSubmitting(true);
    
    console.log("Match form submitted:", formData);
    
    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add a match.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Validate and convert date
    let matchDate: Date;
    try {
      matchDate = new Date(formData.matchDate);
      if (isNaN(matchDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (e) {
      toast({
        title: "Invalid Date",
        description: "Please select a valid match date.",
        variant: "destructive",
      });
      matchForm.setError("matchDate", { message: "Invalid date format" });
      setSubmitting(false);
      return;
    }

    // Prepare data for API with string date
    const matchData: CreatePlayerMatchFormData = {
      ...formData,
      matchDate: formData.matchDate, // Keep as string
      userId: user.id,
    };

    console.log("Final match data:", matchData);

    // Final validation before API call
    try {
      const validation = createPlayerMatchSchema.safeParse(matchData);
      if (!validation.success) {
        console.error("Match validation failed:", validation.error);
        const errors = validation.error.flatten();
        
        // Set field errors in the form
        Object.entries(errors.fieldErrors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            matchForm.setError(field as any, { message: messages[0] });
          }
        });
        
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted fields.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Submit data to API
      addMatchMutation.mutate(validation.data);
    } catch (error) {
      console.error("Match submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  // Performance Form Submit Handler
  const onPerformanceSubmit = (formData: CreatePlayerMatchPerformanceFormData) => {
    if (submitting) return;
    setSubmitting(true);
    
    console.log("Performance form submitted:", formData);
    
    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add performance details.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    if (newMatchId === null) {
      toast({
        title: "Error",
        description: "Match ID is missing. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Ensure numeric fields are properly parsed
    const parseNumber = (value: any): number => {
      if (value === null || value === undefined || value === '') return 0;
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Prepare data for API
    const performanceData: CreatePlayerMatchPerformanceFormData = {
      userId: user.id,
      matchId: newMatchId,
      runsScored: Number(formData.runsScored),
      ballsFaced: Number(formData.ballsFaced),
      fours: Number(formData.fours),
      sixes: Number(formData.sixes),
      battingStatus: formData.battingStatus,
      oversBowled: formData.oversBowled?.toString() || "0",
      runsConceded: Number(formData.runsConceded),
      wicketsTaken: Number(formData.wicketsTaken),
      maidens: Number(formData.maidens),
      catches: Number(formData.catches),
      runOuts: Number(formData.runOuts),
      stumpings: Number(formData.stumpings || 0),
      battingPosition: formData.battingPosition ? Number(formData.battingPosition) : undefined,
      bowlingPosition: formData.bowlingPosition ? Number(formData.bowlingPosition) : undefined,
      battingStyle: formData.battingStyle,
      bowlingStyle: formData.bowlingStyle,
      economyRate: formData.economyRate ? Number(formData.economyRate) : undefined,
      strikeRate: formData.strikeRate ? Number(formData.strikeRate) : undefined,
      playerOfMatch: Boolean(formData.playerOfMatch)
    };

    console.log("Final performance data:", performanceData);

    // Final validation before API call
    try {
      const validation = createPlayerMatchPerformanceSchema.safeParse(performanceData);
      if (!validation.success) {
        console.error("Performance validation failed:", validation.error);
        const errors = validation.error.flatten();
        
        // Set field errors in the form
        Object.entries(errors.fieldErrors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            performanceForm.setError(field as any, { message: messages[0] });
          }
        });
        
        toast({
          title: "Validation Error",
          description: "Please fix the highlighted fields.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Submit data to API
      addPerformanceMutation.mutate(validation.data);
    } catch (error) {
      console.error("Performance submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  // Handle manual dialog open
  const openDialog = () => {
    resetDialogState();
    setOpen(true);
  };

  // Handle back button in performance form
  const handleBackToMatch = () => {
    setCurrentStep('match');
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
            {currentStep === 'match' 
              ? 'Add New Match' 
              : `Add Performance Details ${newMatchId ? `(Match #${newMatchId})` : ''}`}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'match'
              ? 'Enter the details of your cricket match'
              : 'Record your performance in this match'}
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
                <Button 
                  type="submit" 
                  className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
                  disabled={submitting || addMatchMutation.isPending}
                >
                  {submitting || addMatchMutation.isPending ? "Saving..." : "Next: Add Performance"}
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
                          <Input type="number" min="0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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
                          <Input placeholder="e.g. 4.0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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
                          <Input type="number" min="0" {...field} />
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
                  onClick={handleBackToMatch}
                  className="mr-auto"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
                  disabled={submitting || addPerformanceMutation.isPending}
                >
                  {submitting || addPerformanceMutation.isPending ? "Saving..." : "Save Performance"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}