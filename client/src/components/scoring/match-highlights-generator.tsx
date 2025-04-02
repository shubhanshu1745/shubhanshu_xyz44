import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Film, PlayCircle, Scissors, Sparkles, Video, Wand2, X, Check, DownloadCloud, Share2, FilterX, Bookmark, BookmarkPlus } from "lucide-react";

interface HighlightEvent {
  id: string;
  type: "boundary" | "wicket" | "milestone" | "partnership" | "catch" | "runout" | "customEvent";
  description: string;
  timestamp: string;
  ballId?: number;
  overNumber: number;
  ballNumber: number;
  bowler: string;
  batsman: string;
  runs?: number;
  importance: number; // 1-10 scale
  videoUrl?: string;
  thumbnailUrl?: string;
  isSelected: boolean;
}

interface MatchHighlightsGeneratorProps {
  matchId: number;
  matchTitle: string;
  team1Name: string;
  team2Name: string;
  onSave?: (highlightIds: string[]) => void;
}

export default function MatchHighlightsGenerator({
  matchId,
  matchTitle,
  team1Name,
  team2Name,
  onSave
}: MatchHighlightsGeneratorProps) {
  const [highlightEvents, setHighlightEvents] = useState<HighlightEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<HighlightEvent[]>([]);
  const [generationSettings, setGenerationSettings] = useState({
    duration: 120, // in seconds
    includeWickets: true,
    includeBoundaries: true,
    includeMilestones: true,
    includeFielding: true,
    maxEvents: 10,
    importance: 5, // minimum importance to include (1-10)
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState("");
  const [showGeneratedVideo, setShowGeneratedVideo] = useState(false);
  const [showSavedHighlights, setShowSavedHighlights] = useState(false);
  
  const { toast } = useToast();

  // Query to fetch all potential highlight events from the match
  const { data: matchEvents, isLoading } = useQuery({
    queryKey: [`/api/matches/${matchId}/events`],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      // For this demo, we generate sample data
      const sampleEvents: HighlightEvent[] = [
        {
          id: "1",
          type: "boundary",
          description: "FOUR! Excellent cover drive by Smith",
          timestamp: "14:30:22",
          overNumber: 2,
          ballNumber: 3,
          bowler: "Johnson",
          batsman: "Smith",
          runs: 4,
          importance: 6,
          isSelected: false
        },
        {
          id: "2",
          type: "boundary",
          description: "SIX! Massive hit over long-on by Smith",
          timestamp: "14:32:15",
          overNumber: 2,
          ballNumber: 5,
          bowler: "Johnson",
          batsman: "Smith",
          runs: 6,
          importance: 8,
          isSelected: false
        },
        {
          id: "3",
          type: "wicket",
          description: "OUT! Jones bowled by Anderson",
          timestamp: "14:40:05",
          overNumber: 5,
          ballNumber: 2,
          bowler: "Anderson",
          batsman: "Jones",
          importance: 9,
          isSelected: false
        },
        {
          id: "4",
          type: "catch",
          description: "Great catch by Wilson at point!",
          timestamp: "14:48:30",
          overNumber: 8,
          ballNumber: 1,
          bowler: "Roberts",
          batsman: "Taylor",
          importance: 7,
          isSelected: false
        },
        {
          id: "5",
          type: "milestone",
          description: "Fifty for Smith! A well-deserved half-century",
          timestamp: "15:10:42",
          overNumber: 12,
          ballNumber: 4,
          bowler: "Williams",
          batsman: "Smith",
          runs: 2,
          importance: 8,
          isSelected: false
        },
        {
          id: "6",
          type: "boundary",
          description: "FOUR! Beautiful late cut by Taylor",
          timestamp: "15:15:22",
          overNumber: 14,
          ballNumber: 2,
          bowler: "Davis",
          batsman: "Taylor",
          runs: 4,
          importance: 6,
          isSelected: false
        },
        {
          id: "7",
          type: "partnership",
          description: "100-run partnership between Smith and Taylor",
          timestamp: "15:22:05",
          overNumber: 16,
          ballNumber: 3,
          bowler: "Roberts",
          batsman: "Taylor",
          runs: 1,
          importance: 7,
          isSelected: false
        },
        {
          id: "8",
          type: "runout",
          description: "Brilliant run out by Brown! Taylor has to go",
          timestamp: "15:30:18",
          overNumber: 18,
          ballNumber: 5,
          bowler: "Johnson",
          batsman: "Taylor",
          importance: 9,
          isSelected: false
        },
        {
          id: "9",
          type: "boundary",
          description: "SIX! Smith finishes with a huge hit",
          timestamp: "15:35:42",
          overNumber: 19,
          ballNumber: 6,
          bowler: "Anderson",
          batsman: "Smith",
          runs: 6,
          importance: 8,
          isSelected: false
        },
        {
          id: "10",
          type: "milestone",
          description: "Century for Smith! What an innings!",
          timestamp: "15:42:30",
          overNumber: 22,
          ballNumber: 1,
          bowler: "Williams",
          batsman: "Smith",
          runs: 2,
          importance: 10,
          isSelected: false
        }
      ];
      
      return sampleEvents;
    }
  });

  // Query to fetch saved highlights
  const { data: savedHighlights, refetch: refetchSavedHighlights } = useQuery({
    queryKey: [`/api/matches/${matchId}/highlights`],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      return [];
    }
  });

  // Mutation to generate highlights
  const generateHighlightsMutation = useMutation({
    mutationFn: async (settings: typeof generationSettings) => {
      setIsGenerating(true);
      
      // In a real app, this would call an API to generate highlights
      // For demo purposes, we'll simulate a delay and return a subset of events
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Filter events based on settings
      const filteredEvents = matchEvents?.filter(event => {
        if (!settings.includeWickets && event.type === "wicket") return false;
        if (!settings.includeBoundaries && (event.type === "boundary")) return false;
        if (!settings.includeMilestones && (event.type === "milestone" || event.type === "partnership")) return false;
        if (!settings.includeFielding && (event.type === "catch" || event.type === "runout")) return false;
        
        return event.importance >= settings.importance;
      }) || [];
      
      // Sort by importance and limit
      const sortedEvents = [...filteredEvents].sort((a, b) => b.importance - a.importance);
      const selected = sortedEvents.slice(0, settings.maxEvents);
      
      return {
        events: selected.map(e => ({ ...e, isSelected: true })),
        videoUrl: "https://example.com/highlights.mp4" // Mock URL
      };
    },
    onSuccess: (data) => {
      setSelectedEvents(data.events);
      setGeneratedVideo(data.videoUrl);
      setIsGenerating(false);
      toast({
        title: "Highlights Generated",
        description: `Generated ${data.events.length} highlight clips for the match`
      });
    },
    onError: () => {
      setIsGenerating(false);
      toast({
        title: "Failed to Generate Highlights",
        description: "There was an error generating the highlights. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to save highlights
  const saveHighlightsMutation = useMutation({
    mutationFn: async (eventIds: string[]) => {
      // In a real app, this would call an API to save highlights
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      refetchSavedHighlights();
      toast({
        title: "Highlights Saved",
        description: "The highlights have been saved successfully"
      });
      if (onSave) {
        onSave(selectedEvents.map(e => e.id));
      }
    },
    onError: () => {
      toast({
        title: "Failed to Save Highlights",
        description: "There was an error saving the highlights. Please try again.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (matchEvents) {
      setHighlightEvents(matchEvents);
    }
  }, [matchEvents]);

  const handleEventToggle = (eventId: string) => {
    setHighlightEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, isSelected: !event.isSelected } 
          : event
      )
    );
    
    // Update selected events
    const event = highlightEvents.find(e => e.id === eventId);
    if (event) {
      if (event.isSelected) {
        setSelectedEvents(prev => prev.filter(e => e.id !== eventId));
      } else {
        setSelectedEvents(prev => [...prev, { ...event, isSelected: true }]);
      }
    }
  };

  const handleGenerateHighlights = () => {
    generateHighlightsMutation.mutate(generationSettings);
  };

  const handleSaveHighlights = () => {
    const eventIds = selectedEvents.map(e => e.id);
    saveHighlightsMutation.mutate(eventIds);
  };

  const getEventBadgeColor = (type: HighlightEvent['type']) => {
    switch (type) {
      case "wicket":
        return "bg-red-500 text-white";
      case "boundary":
        return "bg-blue-500 text-white";
      case "milestone":
        return "bg-yellow-500 text-black";
      case "partnership":
        return "bg-purple-500 text-white";
      case "catch":
        return "bg-green-500 text-white";
      case "runout":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const renderEventIcon = (type: HighlightEvent['type']) => {
    switch (type) {
      case "boundary":
        return "🏏";
      case "wicket":
        return "🎯";
      case "milestone":
        return "🏆";
      case "partnership":
        return "🤝";
      case "catch":
        return "👐";
      case "runout":
        return "🏃";
      default:
        return "📌";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          Match Highlights Generator
        </CardTitle>
        <CardDescription>
          Automatically generate highlight clips for {matchTitle} ({team1Name} vs {team2Name})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate Highlights</TabsTrigger>
            <TabsTrigger value="manual">Manual Selection</TabsTrigger>
            <TabsTrigger value="saved" onClick={() => setShowSavedHighlights(true)}>
              Saved Highlights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mb-4 w-full">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Configure Highlight Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Highlight Generation Settings</DialogTitle>
                  <DialogDescription>
                    Customize how the highlight package is generated
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Maximum Duration (seconds)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[generationSettings.duration]}
                        min={30}
                        max={300}
                        step={30}
                        onValueChange={(value) => setGenerationSettings({
                          ...generationSettings,
                          duration: value[0]
                        })}
                      />
                      <span className="w-12 text-center">{generationSettings.duration}s</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Minimum Event Importance</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[generationSettings.importance]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(value) => setGenerationSettings({
                          ...generationSettings,
                          importance: value[0]
                        })}
                      />
                      <span className="w-12 text-center">{generationSettings.importance}/10</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Maximum Events</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[generationSettings.maxEvents]}
                        min={5}
                        max={20}
                        step={1}
                        onValueChange={(value) => setGenerationSettings({
                          ...generationSettings,
                          maxEvents: value[0]
                        })}
                      />
                      <span className="w-12 text-center">{generationSettings.maxEvents}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Include Event Types</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="wickets"
                          checked={generationSettings.includeWickets}
                          onCheckedChange={(checked) => setGenerationSettings({
                            ...generationSettings,
                            includeWickets: checked as boolean
                          })}
                        />
                        <label htmlFor="wickets" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Wickets
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="boundaries"
                          checked={generationSettings.includeBoundaries}
                          onCheckedChange={(checked) => setGenerationSettings({
                            ...generationSettings,
                            includeBoundaries: checked as boolean
                          })}
                        />
                        <label htmlFor="boundaries" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Boundaries (4s & 6s)
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="milestones"
                          checked={generationSettings.includeMilestones}
                          onCheckedChange={(checked) => setGenerationSettings({
                            ...generationSettings,
                            includeMilestones: checked as boolean
                          })}
                        />
                        <label htmlFor="milestones" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Milestones & Partnerships
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="fielding"
                          checked={generationSettings.includeFielding}
                          onCheckedChange={(checked) => setGenerationSettings({
                            ...generationSettings,
                            includeFielding: checked as boolean
                          })}
                        />
                        <label htmlFor="fielding" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Fielding (Catches & Run Outs)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={() => setShowSettings(false)}>
                    Save Settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <div className="rounded-lg border bg-card p-6 text-center space-y-4">
              <Sparkles className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-xl font-semibold">Auto-Generate Highlights</h3>
              <p className="text-muted-foreground">
                Our AI will analyze the match and create a highlight package with the most exciting moments.
              </p>
              <Button 
                onClick={handleGenerateHighlights} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>Generating Highlights...</>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Highlights
                  </>
                )}
              </Button>
            </div>
            
            {selectedEvents.length > 0 && (
              <>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Generated Highlights</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {selectedEvents.length} events selected for the highlight package
                  </p>
                  
                  <ScrollArea className="h-[300px] rounded-md border">
                    <div className="p-4 space-y-2">
                      {selectedEvents.map(event => (
                        <div 
                          key={event.id}
                          className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent"
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-xl">{renderEventIcon(event.type)}</div>
                            <Badge className={getEventBadgeColor(event.type)}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </Badge>
                            <div>
                              <div className="font-medium">{event.description}</div>
                              <div className="text-xs text-muted-foreground">
                                Over {event.overNumber}.{event.ballNumber} | {event.timestamp}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEventToggle(event.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowGeneratedVideo(true)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={handleSaveHighlights}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Highlights
                  </Button>
                </div>
                
                <Dialog open={showGeneratedVideo} onOpenChange={setShowGeneratedVideo}>
                  <DialogContent className="sm:max-w-[720px]">
                    <DialogHeader>
                      <DialogTitle>Highlight Preview</DialogTitle>
                      <DialogDescription>
                        {matchTitle} - {team1Name} vs {team2Name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="aspect-video bg-black rounded-md flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="h-12 w-12 mx-auto mb-2" />
                        <p>
                          In a real implementation, the video would play here.
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Video duration: {Math.min(generationSettings.duration, selectedEvents.length * 12)} seconds
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button onClick={() => setShowGeneratedVideo(false)}>
                          Close
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">All Match Events</h3>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="wicket">Wickets</SelectItem>
                    <SelectItem value="boundary">Boundaries</SelectItem>
                    <SelectItem value="milestone">Milestones</SelectItem>
                    <SelectItem value="partnership">Partnerships</SelectItem>
                    <SelectItem value="catch">Catches</SelectItem>
                    <SelectItem value="runout">Run Outs</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon">
                  <FilterX className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                Loading match events...
              </div>
            ) : (
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-2">
                  {highlightEvents.map(event => (
                    <div 
                      key={event.id}
                      className={`flex items-center justify-between p-2 rounded-lg border hover:bg-accent ${
                        event.isSelected ? "bg-primary/10 border-primary/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={event.isSelected}
                          onCheckedChange={() => handleEventToggle(event.id)}
                        />
                        <div className="text-xl">{renderEventIcon(event.type)}</div>
                        <Badge className={getEventBadgeColor(event.type)}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                        <div>
                          <div className="font-medium">{event.description}</div>
                          <div className="text-xs text-muted-foreground">
                            Over {event.overNumber}.{event.ballNumber} | {event.timestamp}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Importance: {event.importance}/10
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {highlightEvents.some(e => e.isSelected) && (
              <div className="flex justify-between items-center mt-4">
                <div>
                  <span className="font-medium">{highlightEvents.filter(e => e.isSelected).length}</span> events selected
                </div>
                <Button onClick={handleSaveHighlights}>
                  <Check className="h-4 w-4 mr-2" />
                  Save Selected Highlights
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="saved" className="space-y-4">
            {savedHighlights && savedHighlights.length > 0 ? (
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-2">
                  {savedHighlights.map((highlight: any) => (
                    <div 
                      key={highlight.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-xl">{renderEventIcon(highlight.type)}</div>
                        <div>
                          <div className="font-medium">{highlight.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Created on {new Date(highlight.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <DownloadCloud className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 space-y-4">
                <BookmarkPlus className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Saved Highlights</h3>
                <p className="text-muted-foreground">
                  Generate and save highlights to access them here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}