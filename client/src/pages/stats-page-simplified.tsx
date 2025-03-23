import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card, CardTitle, CardDescription,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Avatar, AvatarFallback, AvatarImage,
  Checkbox,
  useToast
} from "@/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, ChevronLeft, Award, Calendar, Clock, Flag, MapPin } from "lucide-react";
import { createPlayerMatchSchema, createPlayerMatchPerformanceSchema } from '@shared/schema';
import type { CreatePlayerMatchFormData, CreatePlayerMatchPerformanceFormData } from '@shared/schema';
import { useState } from "react";


export default function StatsPage() {
  const { user } = useAuth();
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'match' | 'performance'>('match');
  const [newMatchId, setNewMatchId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const response = await fetch('/api/matches');
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    }
  });

  const addMatchMutation = useMutation({
    mutationFn: async (data: CreatePlayerMatchFormData) => {
      const response = await fetch('/api/matches', {
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
      queryClient.invalidateQueries({ queryKey: ['matches'] });
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
      const response = await fetch(`/api/matches/${newMatchId}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add performance');
      return response.json();
    },
    onSuccess: () => {
      setIsAddMatchDialogOpen(false);
      setCurrentStep('match');
      setNewMatchId(null);
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add performance. Please try again.",
        variant: "destructive",
      });
    }
  });

  const matchForm = useForm<CreatePlayerMatchFormData>({
    resolver: zodResolver(createPlayerMatchSchema),
    defaultValues: {
      matchName: '',
      matchDate: format(new Date(), 'yyyy-MM-dd'),
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

  const onMatchSubmit = (data: CreatePlayerMatchFormData) => {
    addMatchMutation.mutate(data);
  };

  const onPerformanceSubmit = (data: CreatePlayerMatchPerformanceFormData) => {
    if (newMatchId) {
      addPerformanceMutation.mutate({ ...data, matchId: newMatchId });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p>Please login to view stats</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col md:flex-row items-center">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-[#1F3A8A] mb-4 md:mb-0 md:mr-6">
            <AvatarImage
              src={user.profileImage || "https://github.com/shadcn.png"}
              alt={user.username}
            />
            <AvatarFallback className="bg-[#1F3A8A] text-white text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold cricket-primary mb-1">{user.fullName || user.username}</h1>
            <p className="text-[#1F3A8A] font-medium mb-3">@{user.username}</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddMatchDialogOpen(true)}
          className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
        >
          Add New Match
        </Button>
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="matches">Match History</TabsTrigger>
          <TabsTrigger value="performance-trends">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          {matchesLoading ? (
            <div className="text-center py-10">Loading matches...</div>
          ) : matches?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match: any) => (
                <Card key={match.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{match.matchName}</h3>
                      <span className="text-sm text-[#2E8B57]">{match.matchType}</span>
                    </div>

                    <div className="text-sm space-y-2">
                      <p>
                        <span className="text-neutral-500">Date:</span>{' '}
                        {format(new Date(match.matchDate), 'PPP')}
                      </p>
                      <p>
                        <span className="text-neutral-500">Venue:</span>{' '}
                        {match.venue}
                      </p>
                      <p>
                        <span className="text-neutral-500">Opponent:</span>{' '}
                        {match.opponent}
                      </p>
                    </div>

                    {match.performance && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2 cricket-primary">Your Performance</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium mb-1">Batting</h5>
                            <p className="text-sm">
                              <span className="text-neutral-500">Runs:</span>{' '}
                              {match.performance.runsScored} ({match.performance.ballsFaced} balls)
                            </p>
                            <p className="text-sm">
                              <span className="text-neutral-500">4s/6s:</span>{' '}
                              {match.performance.fours}/{match.performance.sixes}
                            </p>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium mb-1">Bowling</h5>
                            <p className="text-sm">
                              <span className="text-neutral-500">Figures:</span>{' '}
                              {match.performance.wicketsTaken}/{match.performance.runsConceded}
                            </p>
                            <p className="text-sm">
                              <span className="text-neutral-500">Overs:</span>{' '}
                              {match.performance.oversBowled}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">No match data available</h3>
              <p className="text-neutral-500 mb-4">Add your match details to start tracking your cricket performance</p>
              <Button
                onClick={() => setIsAddMatchDialogOpen(true)}
                className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
              >
                Add Your First Match
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance-trends">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <CardTitle className="text-lg mb-4">Batting Performance</CardTitle>
              <CardDescription className="mb-4">
                Your batting performance across all matches
              </CardDescription>
              {matches?.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">Total Runs</p>
                      <p className="text-2xl font-semibold">
                        {matches.reduce((sum: number, match: any) =>
                          sum + (match.performance?.runsScored || 0), 0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Average</p>
                      <p className="text-2xl font-semibold">
                        {(matches.reduce((sum: number, match: any) =>
                          sum + (match.performance?.runsScored || 0), 0
                        ) / matches.length).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-neutral-500">
                  Add matches to see your batting statistics
                </div>
              )}
            </Card>

            <Card className="p-4">
              <CardTitle className="text-lg mb-4">Bowling Performance</CardTitle>
              <CardDescription className="mb-4">
                Your bowling statistics across matches
              </CardDescription>
              {matches?.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">Total Wickets</p>
                      <p className="text-2xl font-semibold">
                        {matches.reduce((sum: number, match: any) =>
                          sum + (match.performance?.wicketsTaken || 0), 0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Economy Rate</p>
                      <p className="text-2xl font-semibold">
                        {(matches.reduce((sum: number, match: any) =>
                          sum + (match.performance?.runsConceded || 0), 0
                        ) / matches.reduce((sum: number, match: any) =>
                          sum + (Number(match.performance?.oversBowled) || 0), 0
                        )).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-neutral-500">
                  Add matches to see your bowling statistics
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddMatchDialogOpen} onOpenChange={setIsAddMatchDialogOpen}>
        <DialogContent>
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
                        <Input {...field} />
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
                      <FormLabel>Date</FormLabel>
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
                        <Input {...field} />
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
                        <Input {...field} />
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
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddMatchDialogOpen(false)}>
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
                            <Input {...field} placeholder="0.0" />
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
                  <Button type="button" variant="outline" onClick={() => setCurrentStep('match')}>
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
    </div>
  );
}