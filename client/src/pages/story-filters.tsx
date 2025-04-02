import React, { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, PlayCircle, Upload, Smile, Sparkles, Trophy, Globe, Users, User, Filter, Download, Share2, Ghost, Brush, Wand2, Flame, Crown, Gamepad2, PlusCircle, Star, CircleEllipsis, Clock, Copy, RotateCcw, Flag, Bell, Video } from "lucide-react";

interface StoryFilter {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  previewUrl: string;
  category: 'team' | 'celebration' | 'stadium' | 'gameplay' | 'stats';
  teamId?: number;
  playerIds?: number[];
  tournamentId?: number;
  settings?: {
    [key: string]: any;
  };
  usageCount: number;
  created: Date;
}

interface StoryEffect {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: 'animation' | 'sound' | 'ar' | 'interactive';
  settings?: {
    [key: string]: any;
  };
  assetUrls: string[];
  usageCount: number;
  created: Date;
}

interface LiveScore {
  id: string;
  matchId: number;
  format: string;
  style: 'minimal' | 'detailed' | 'animated';
  usageCount: number;
}

export default function StoryFilters() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("filters");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<StoryFilter | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<StoryEffect | null>(null);
  const [selectedLiveScore, setSelectedLiveScore] = useState<LiveScore | null>(null);
  const [isPreviewingFilter, setIsPreviewingFilter] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch story filters
  const { data: filters, isLoading: filtersLoading } = useQuery({
    queryKey: ['/api/stories/filters', selectedCategory],
    queryFn: async () => {
      let url = '/api/stories/filters';
      if (selectedCategory) {
        url += `?category=${selectedCategory}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch story filters');
      }
      return response.json();
    },
    enabled: activeTab === "filters"
  });

  // Fetch story effects
  const { data: effects, isLoading: effectsLoading } = useQuery({
    queryKey: ['/api/stories/effects', selectedCategory],
    queryFn: async () => {
      let url = '/api/stories/effects';
      if (selectedCategory) {
        url += `?category=${selectedCategory}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch story effects');
      }
      return response.json();
    },
    enabled: activeTab === "effects"
  });

  // Fetch live score templates
  const { data: liveScores, isLoading: liveScoresLoading } = useQuery({
    queryKey: ['/api/stories/live-scores'],
    queryFn: async () => {
      const response = await fetch('/api/stories/live-scores');
      if (!response.ok) {
        throw new Error('Failed to fetch live score templates');
      }
      return response.json();
    },
    enabled: activeTab === "live-scores"
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      return response.json();
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyFilter = async () => {
    if (!previewImage || !selectedFilter) {
      toast({
        title: "Error",
        description: "Please select an image and a filter",
        variant: "destructive"
      });
      return;
    }

    setIsApplyingFilter(true);

    try {
      // In a real implementation, this would send the image to the server
      // and apply the filter
      
      // Simulate filter application
      setTimeout(() => {
        toast({
          title: "Success",
          description: "Filter applied successfully",
        });
        setIsApplyingFilter(false);
        setIsPreviewingFilter(false);
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply filter",
        variant: "destructive"
      });
      setIsApplyingFilter(false);
    }
  };

  const renderFilters = () => {
    if (filtersLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <p>Loading story filters...</p>
        </div>
      );
    }

    if (!filters || filters.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <Filter className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Filters Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            No cricket-themed filters match your selection
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filters.map((filter: StoryFilter) => (
          <Card 
            key={filter.id} 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedFilter(filter)}
          >
            <div className="h-40 overflow-hidden">
              <img 
                src={filter.imageUrl} 
                alt={filter.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader className="py-3 px-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm">{filter.name}</CardTitle>
                <Badge variant="outline" className="text-xs h-5 px-1">
                  {filter.category}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                {filter.usageCount.toLocaleString()} uses
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  };

  const renderEffects = () => {
    if (effectsLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <p>Loading story effects...</p>
        </div>
      );
    }

    if (!effects || effects.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Effects Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            No cricket-themed effects match your selection
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {effects.map((effect: StoryEffect) => (
          <Card 
            key={effect.id} 
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedEffect(effect)}
          >
            <div className="h-40 overflow-hidden relative">
              <img 
                src={effect.previewUrl} 
                alt={effect.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <PlayCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardHeader className="py-3 px-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm">{effect.name}</CardTitle>
                <Badge 
                  variant={effect.category === 'animation' ? 'default' : 
                           effect.category === 'sound' ? 'secondary' : 
                           effect.category === 'ar' ? 'outline' : 'destructive'} 
                  className="text-xs h-5 px-1"
                >
                  {effect.category}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                {effect.usageCount.toLocaleString()} uses
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  };

  const renderLiveScores = () => {
    if (liveScoresLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <p>Loading live score templates...</p>
        </div>
      );
    }

    if (!liveScores || liveScores.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <Trophy className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Live Score Templates</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            There are no live score templates available
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveScores.map((score: any) => {
          const scoreData = JSON.parse(score.format);
          
          return (
            <Card 
              key={score.id} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedLiveScore(score)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={score.style === 'minimal' ? 'outline' : 
                               score.style === 'detailed' ? 'secondary' : 'default'}>
                    {score.style}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg p-4 ${score.style === 'detailed' ? 'bg-primary/5' : 'bg-muted/10'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{scoreData.team1}</div>
                    <div className="font-bold">{scoreData.team1Score}</div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{scoreData.team2}</div>
                    <div className="font-bold">{scoreData.team2Score}</div>
                  </div>
                  
                  {score.style === 'detailed' && (
                    <>
                      <Separator className="my-2" />
                      <div className="text-sm text-muted-foreground mt-2">
                        {scoreData.result}
                      </div>
                      {scoreData.topBatsman && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Top Batsman: {scoreData.topBatsman}
                        </div>
                      )}
                      {scoreData.topBowler && (
                        <div className="text-xs text-muted-foreground">
                          Top Bowler: {scoreData.topBowler}
                        </div>
                      )}
                    </>
                  )}
                  
                  {score.style === 'minimal' && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {scoreData.result}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="w-full flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Used {score.usageCount} times
                  </span>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderFilterDetails = () => {
    if (!selectedFilter) return null;

    return (
      <Dialog open={!!selectedFilter} onOpenChange={(open) => !open && setSelectedFilter(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedFilter.name}</DialogTitle>
            <DialogDescription>
              {selectedFilter.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-square relative rounded-md overflow-hidden">
              <img 
                src={selectedFilter.previewUrl} 
                alt={selectedFilter.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex justify-between">
              <div>
                <Badge variant="outline" className="mr-2">
                  {selectedFilter.category}
                </Badge>
                <Badge variant="secondary">
                  {selectedFilter.usageCount.toLocaleString()} uses
                </Badge>
              </div>
              <Button 
                variant="default" 
                onClick={() => {
                  setSelectedFilter(null);
                  setIsPreviewingFilter(true);
                }}
              >
                Try it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderEffectDetails = () => {
    if (!selectedEffect) return null;

    return (
      <Dialog open={!!selectedEffect} onOpenChange={(open) => !open && setSelectedEffect(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEffect.name}</DialogTitle>
            <DialogDescription>
              {selectedEffect.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video relative rounded-md overflow-hidden">
              <img 
                src={selectedEffect.previewUrl} 
                alt={selectedEffect.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70">
                  <PlayCircle className="h-6 w-6 text-white" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <h4 className="text-sm font-medium w-full mb-1">Assets included:</h4>
              {selectedEffect.assetUrls.map((url, index) => {
                const fileName = url.split('/').pop() || `asset-${index}`;
                return (
                  <Badge key={index} variant="outline" className="text-xs">
                    {fileName}
                  </Badge>
                );
              })}
            </div>
            
            <div className="flex justify-between">
              <div>
                <Badge 
                  variant={selectedEffect.category === 'animation' ? 'default' : 
                           selectedEffect.category === 'sound' ? 'secondary' : 
                           selectedEffect.category === 'ar' ? 'outline' : 'destructive'} 
                  className="mr-2"
                >
                  {selectedEffect.category}
                </Badge>
                <Badge variant="outline">
                  {selectedEffect.usageCount.toLocaleString()} uses
                </Badge>
              </div>
              <Button 
                variant="default" 
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Effect preview will be available soon"
                  });
                }}
              >
                Try it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderLiveScoreDetails = () => {
    if (!selectedLiveScore) return null;

    const scoreData = JSON.parse(selectedLiveScore.format);

    return (
      <Dialog open={!!selectedLiveScore} onOpenChange={(open) => !open && setSelectedLiveScore(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Live Score Template</DialogTitle>
            <DialogDescription>
              Add this live score to your story
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className={`border rounded-lg p-6 ${selectedLiveScore.style === 'detailed' ? 'bg-primary/5' : 'bg-muted/10'}`}>
              <div className="flex justify-between items-center mb-4">
                <div className="font-medium text-lg">{scoreData.team1}</div>
                <div className="font-bold text-lg">{scoreData.team1Score}</div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="font-medium text-lg">{scoreData.team2}</div>
                <div className="font-bold text-lg">{scoreData.team2Score}</div>
              </div>
              
              {selectedLiveScore.style === 'detailed' && (
                <>
                  <Separator className="my-3" />
                  <div className="text-sm mt-2">
                    {scoreData.result}
                  </div>
                  {scoreData.topBatsman && (
                    <div className="text-sm mt-2">
                      Top Batsman: {scoreData.topBatsman}
                    </div>
                  )}
                  {scoreData.topBowler && (
                    <div className="text-sm mt-1">
                      Top Bowler: {scoreData.topBowler}
                    </div>
                  )}
                </>
              )}
              
              {selectedLiveScore.style === 'minimal' && (
                <div className="text-sm mt-2">
                  {scoreData.result}
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Badge variant="outline">
                {selectedLiveScore.style} style
              </Badge>
              <div>
                <Button variant="outline" className="mr-2">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => {
                    toast({
                      title: "Added to Story",
                      description: "Live score has been added to your story"
                    });
                    setSelectedLiveScore(null);
                  }}
                >
                  Add to Story
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderFilterPreview = () => {
    if (!isPreviewingFilter) return null;

    return (
      <Dialog open={isPreviewingFilter} onOpenChange={setIsPreviewingFilter}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Try Filter</DialogTitle>
            <DialogDescription>
              Upload a photo to try this cricket-themed filter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {!previewImage ? (
              <div 
                className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG or WEBP up to 10MB
                  </p>
                </div>
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <Button variant="outline">Select Image</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-square max-h-[400px] rounded-md overflow-hidden">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* This would show the filter effect overlaid on the image */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Simulated filter effect */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/20 to-transparent h-1/3"></div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="default" className="text-sm">
                        <Trophy className="h-3 w-3 mr-1" />
                        Cricket Fan
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setPreviewImage(null)}
                  >
                    Upload Different Image
                  </Button>
                  <Button 
                    className="w-full"
                    disabled={isApplyingFilter}
                    onClick={handleApplyFilter}
                  >
                    {isApplyingFilter ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Apply Filter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Cricket Story Filters & Effects</h1>
          <p className="text-muted-foreground">Enhance your stories with cricket-themed creative tools</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            New Filters
          </Button>
          <Button className="gap-2">
            <Camera className="h-4 w-4" />
            Create Story
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="live-scores">Live Scores</TabsTrigger>
          </TabsList>
          
          {activeTab === "filters" && (
            <div className="flex gap-2">
              <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="celebration">Celebration</SelectItem>
                  <SelectItem value="stadium">Stadium</SelectItem>
                  <SelectItem value="gameplay">Gameplay</SelectItem>
                  <SelectItem value="stats">Stats</SelectItem>
                </SelectContent>
              </Select>
              
              {teams && (
                <Select value={selectedTeam?.toString() || ""} onValueChange={(value) => setSelectedTeam(value ? parseInt(value, 10) : null)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Teams</SelectItem>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          
          {activeTab === "effects" && (
            <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="animation">Animation</SelectItem>
                <SelectItem value="sound">Sound</SelectItem>
                <SelectItem value="ar">AR</SelectItem>
                <SelectItem value="interactive">Interactive</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <TabsContent value="filters" className="space-y-4">
          {renderFilters()}
        </TabsContent>
        
        <TabsContent value="effects" className="space-y-4">
          {renderEffects()}
        </TabsContent>
        
        <TabsContent value="live-scores" className="space-y-4">
          {renderLiveScores()}
        </TabsContent>
      </Tabs>
      
      {renderFilterDetails()}
      {renderEffectDetails()}
      {renderLiveScoreDetails()}
      {renderFilterPreview()}
    </div>
  );
}