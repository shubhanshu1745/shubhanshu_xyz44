import React, { useState } from "react";
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
import { Film, Play, Upload, Clock, Heart, Eye, Download, Share2, Scissors, Video, Tag, MessageSquare, ThumbsUp, Filter, FilmIcon, Trophy, Flag, Users, User, PlayCircle, ChevronRight, ChevronLeft, RotateCcw, PlaySquare, Bookmark, AlertCircle } from "lucide-react";

interface HighlightClip {
  id: string;
  matchId: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  startTime: number;
  endTime: number;
  tags: string[];
  created: Date;
  clipType: 'boundary' | 'wicket' | 'milestone' | 'catch' | 'other';
  views: number;
  likes: number;
  playerId?: number;
}

interface HighlightPackage {
  id: string;
  matchId: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  created: Date;
  clips: HighlightClip[];
  status: 'generating' | 'ready' | 'failed';
  views: number;
}

interface Match {
  id: number;
  title: string;
  date: string;
  venue: string;
  result: string;
  team1: {
    id: number;
    name: string;
    score: string;
  };
  team2: {
    id: number;
    name: string;
    score: string;
  };
  winnerId: number;
}

export default function MatchHighlights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [selectedClipType, setSelectedClipType] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<HighlightClip | null>(null);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [isUploadingClip, setIsUploadingClip] = useState(false);
  const [newPackageTitle, setNewPackageTitle] = useState("");
  const [newPackageDescription, setNewPackageDescription] = useState("");

  // Fetch available matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/cricket/matches'],
    queryFn: async () => {
      const response = await fetch('/api/cricket/matches');
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      return response.json();
    }
  });

  // Fetch match highlights
  const { data: highlights, isLoading: highlightsLoading } = useQuery({
    queryKey: ['/api/highlights/match', selectedMatch],
    queryFn: async () => {
      if (!selectedMatch) return null;
      const response = await fetch(`/api/highlights/match/${selectedMatch}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch match highlights');
      }
      return response.json();
    },
    enabled: !!selectedMatch
  });

  // Fetch highlight clips
  const { data: clips, isLoading: clipsLoading } = useQuery({
    queryKey: ['/api/highlights/clips', selectedMatch, selectedClipType],
    queryFn: async () => {
      if (!selectedMatch) return [];
      let url = `/api/highlights/clips/${selectedMatch}`;
      if (selectedClipType) {
        url += `?clipType=${selectedClipType}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch highlight clips');
      }
      return response.json();
    },
    enabled: !!selectedMatch
  });

  const handleCreatePackage = async () => {
    if (!selectedMatch) {
      toast({
        title: "Error",
        description: "Please select a match",
        variant: "destructive"
      });
      return;
    }

    if (!newPackageTitle || !newPackageDescription) {
      toast({
        title: "Error",
        description: "Please enter a title and description",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingPackage(true);

    try {
      const response = await fetch(`/api/highlights/generate/${selectedMatch}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newPackageTitle,
          description: newPackageDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create highlight package');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: "Highlight package is being generated",
      });

      setNewPackageTitle("");
      setNewPackageDescription("");
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create highlight package",
        variant: "destructive"
      });
    } finally {
      setIsCreatingPackage(false);
    }
  };

  const handleLikeClip = async (clipId: string) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to like clips",
        variant: "default"
      });
      return;
    }

    try {
      // Add code to like the clip
      toast({
        title: "Success",
        description: "Clip liked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like clip",
        variant: "destructive"
      });
    }
  };

  const renderMatchSelector = () => {
    if (matchesLoading) {
      return (
        <div className="flex justify-center items-center h-20">
          <p>Loading matches...</p>
        </div>
      );
    }

    if (!matches || matches.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-20">
          <p className="text-muted-foreground">No matches found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Label htmlFor="match-selector">Select Match</Label>
        <Select value={selectedMatch?.toString() || ""} onValueChange={(value) => setSelectedMatch(parseInt(value, 10))}>
          <SelectTrigger id="match-selector">
            <SelectValue placeholder="Select a match" />
          </SelectTrigger>
          <SelectContent>
            {matches && Array.isArray(matches) ? 
              matches.map((match: Match) => (
                <SelectItem key={match.id} value={match.id.toString()}>
                  {match.title} - {new Date(match.date).toLocaleDateString()}
                </SelectItem>
              ))
            : <SelectItem value="">No matches available</SelectItem>
            }
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderHighlightPackage = () => {
    if (!selectedMatch) {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <FilmIcon className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a Match</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            Choose a match to view or generate highlights
          </p>
        </div>
      );
    }

    if (highlightsLoading) {
      return (
        <div className="flex justify-center items-center h-60">
          <p>Loading match highlights...</p>
        </div>
      );
    }

    if (!highlights) {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <FilmIcon className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Highlights Package</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            This match doesn't have a generated highlights package yet
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create Highlights</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Highlights Package</DialogTitle>
                <DialogDescription>
                  Generate a new highlights package for this match. This will analyze key moments and create a compilation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="package-title">Title</Label>
                  <Input 
                    id="package-title" 
                    placeholder="Enter a title for the highlights package" 
                    value={newPackageTitle}
                    onChange={(e) => setNewPackageTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package-description">Description</Label>
                  <Textarea 
                    id="package-description" 
                    placeholder="Enter a description for the highlights package" 
                    value={newPackageDescription}
                    onChange={(e) => setNewPackageDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreatePackage}
                  disabled={isCreatingPackage}
                >
                  {isCreatingPackage ? "Creating..." : "Create Highlights"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    if (highlights.status === 'generating') {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw className="h-6 w-6 text-primary animate-spin" />
            <h3 className="text-lg font-medium">Generating Highlights</h3>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            We're generating highlights for this match. This can take a few minutes.
          </p>
          <Progress value={45} className="w-full max-w-md" />
          <p className="text-xs text-muted-foreground mt-2">This is an AI-powered process</p>
        </div>
      );
    }

    if (highlights.status === 'failed') {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Highlight Generation Failed</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            We encountered an error while generating highlights for this match
          </p>
          <Button>Try Again</Button>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{highlights.title}</CardTitle>
              <CardDescription>
                {new Date(highlights.created).toLocaleDateString()} • {Math.floor(highlights.duration / 60)}:{(highlights.duration % 60).toString().padStart(2, '0')} minutes
              </CardDescription>
            </div>
            <Badge variant="outline">
              <Eye className="h-3 w-3 mr-1" />
              {highlights.views} views
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded-md overflow-hidden">
            {highlights.videoUrl ? (
              <video 
                src={highlights.videoUrl} 
                poster={highlights.thumbnailUrl}
                controls 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PlayCircle className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <p className="text-sm">
            {highlights.description}
          </p>
          
          <div className="pt-2">
            <h4 className="text-sm font-medium mb-2">Included Clips</h4>
            <ScrollArea className="h-60 rounded-md border">
              <div className="p-4 space-y-3">
                {highlights.clips.map((clip) => (
                  <div 
                    key={clip.id} 
                    className="flex gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedClip(clip)}
                  >
                    <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={clip.thumbnailUrl} 
                        alt={clip.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">{clip.title}</h5>
                      <p className="text-xs text-muted-foreground truncate">{clip.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {clip.clipType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor((clip.endTime - clip.startTime) / 60)}:{Math.floor((clip.endTime - clip.startTime) % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <Button variant="default" size="sm">
            <PlaySquare className="h-4 w-4 mr-2" />
            Full Match
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderClips = () => {
    if (!selectedMatch) {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <Video className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a Match</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            Choose a match to view individual highlight clips
          </p>
        </div>
      );
    }

    if (clipsLoading) {
      return (
        <div className="flex justify-center items-center h-60">
          <p>Loading highlight clips...</p>
        </div>
      );
    }

    if (!clips || clips.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg p-6 bg-muted/10">
          <Scissors className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Clips Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            This match doesn't have any individual highlight clips yet
          </p>
          <Button>Upload Clip</Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Select value={selectedClipType || ""} onValueChange={setSelectedClipType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Clips" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Clips</SelectItem>
                <SelectItem value="boundary">Boundaries</SelectItem>
                <SelectItem value="wicket">Wickets</SelectItem>
                <SelectItem value="milestone">Milestones</SelectItem>
                <SelectItem value="catch">Catches</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Clip
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <Card key={clip.id} className="overflow-hidden">
              <div 
                className="relative h-40 cursor-pointer"
                onClick={() => setSelectedClip(clip)}
              >
                <img 
                  src={clip.thumbnailUrl} 
                  alt={clip.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
                <Badge 
                  className="absolute top-2 right-2"
                  variant={clip.clipType === 'boundary' ? "default" : 
                           clip.clipType === 'wicket' ? "destructive" : 
                           clip.clipType === 'milestone' ? "secondary" : "outline"}
                >
                  {clip.clipType}
                </Badge>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {Math.floor((clip.endTime - clip.startTime) / 60)}:{Math.floor((clip.endTime - clip.startTime) % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{clip.title}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {clip.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t pt-3 flex justify-between">
                <div className="flex gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleLikeClip(clip.id)}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {clip.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                    <Eye className="h-4 w-4 mr-1" />
                    {clip.views}
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Share2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderClipDetails = () => {
    if (!selectedClip) return null;

    return (
      <Dialog open={!!selectedClip} onOpenChange={(open) => !open && setSelectedClip(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedClip.title}</DialogTitle>
            <DialogDescription>
              From match on {new Date(selectedClip.created).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-md overflow-hidden">
              <video 
                src={selectedClip.videoUrl} 
                poster={selectedClip.thumbnailUrl}
                controls 
                autoPlay
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{selectedClip.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedClip.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  {selectedClip.views}
                </Badge>
                <Badge variant="outline">
                  <Heart className="h-3 w-3 mr-1 fill-current" />
                  {selectedClip.likes}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedClip.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-1">
                <ThumbsUp className="h-4 w-4" />
                Like
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Bookmark className="h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Match Highlights</h1>
          <p className="text-muted-foreground">Watch and share the best moments from cricket matches</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="gap-2">
            <Film className="h-4 w-4" />
            Create Highlights
          </Button>
        </div>
      </div>
      
      {renderMatchSelector()}
      
      <Tabs defaultValue="package" className="space-y-4">
        <TabsList>
          <TabsTrigger value="package">Highlight Package</TabsTrigger>
          <TabsTrigger value="clips">Individual Clips</TabsTrigger>
        </TabsList>
        
        <TabsContent value="package" className="space-y-4">
          {renderHighlightPackage()}
        </TabsContent>
        
        <TabsContent value="clips" className="space-y-4">
          {renderClips()}
        </TabsContent>
      </Tabs>
      
      {renderClipDetails()}
    </div>
  );
}