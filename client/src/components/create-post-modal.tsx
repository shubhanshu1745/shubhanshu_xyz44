import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Upload, MapPin, Tag, ChevronRight, X, User, Users, Trophy, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreatePostFormData } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [matchId, setMatchId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [showCricketDetails, setShowCricketDetails] = useState(false);
  const [step, setStep] = useState<"upload" | "details">("upload");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostFormData) => {
      return await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: "There was a problem creating your post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setImageUrl("");
    setContent("");
    setLocation("");
    setCategory("");
    setMatchId("");
    setTeamId("");
    setPlayerId("");
    setShowCricketDetails(false);
    setStep("upload");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPostMutation.mutate({
      content,
      imageUrl: imageUrl || undefined,
      location: location || undefined,
      category: category || undefined as any,
      matchId: matchId || undefined,
      teamId: teamId || undefined,
      playerId: playerId || undefined,
    });
  };

  const handleNext = () => {
    if (step === "upload") {
      setStep("details");
    }
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("upload");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="border-b border-neutral-200 px-4 py-3 flex flex-row items-center justify-between">
          {step === "details" && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <X className="h-5 w-5" />
            </Button>
          )}
          <DialogTitle className="text-center flex-grow">Create New Post</DialogTitle>
          {step === "upload" && imageUrl ? (
            <Button variant="ghost" onClick={handleNext}>Next</Button>
          ) : step === "details" ? (
            <Button 
              variant="ghost" 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending}
            >
              Share
            </Button>
          ) : (
            <div className="w-16"></div> // Empty div for spacing
          )}
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row">
          {step === "upload" && (
            <div className="w-full md:w-full h-80 md:h-96 bg-black flex items-center justify-center">
              {imageUrl ? (
                <div className="w-full h-full">
                  <img 
                    src={imageUrl} 
                    alt="Post preview" 
                    className="w-full h-full object-contain" 
                  />
                </div>
              ) : (
                <div className="text-center p-4">
                  <Upload className="h-16 w-16 text-white mb-4 mx-auto" />
                  <p className="text-white text-sm mb-4">Drag photos and videos here</p>
                  <Input
                    type="text"
                    placeholder="Or enter image URL here"
                    className="bg-white mb-4 mx-auto max-w-xs"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <p className="text-neutral-400 text-xs mb-4">
                    For demo purposes, please paste a direct image URL
                  </p>
                </div>
              )}
            </div>
          )}
          
          {step === "details" && (
            <div className="w-full">
              {/* User Info */}
              <div className="p-3 flex items-center border-b border-neutral-200">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarImage 
                    src={user?.profileImage || "https://github.com/shadcn.png"} 
                    alt={user?.username || "User"} 
                  />
                  <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{user?.username}</span>
              </div>
              
              {/* Caption */}
              <div className="p-3">
                <Textarea 
                  placeholder="Write a caption..." 
                  className="w-full h-24 text-sm resize-none border-0 focus-visible:ring-0 p-0"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              
              {/* Preview */}
              {imageUrl && (
                <div className="px-3 pb-3">
                  <div className="border border-neutral-200 rounded-md overflow-hidden h-48">
                    <img 
                      src={imageUrl} 
                      alt="Post preview" 
                      className="w-full h-full object-contain bg-neutral-100" 
                    />
                  </div>
                </div>
              )}
              
              {/* Options */}
              <div className="border-t border-neutral-200">
                <div className="p-3 flex items-center justify-between border-b border-neutral-200">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-neutral-500 mr-2" />
                    <Label htmlFor="location" className="text-sm">Add location</Label>
                  </div>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="border-0 text-sm text-right focus-visible:ring-0 w-auto placeholder:text-neutral-400"
                  />
                </div>
                <div 
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setShowCricketDetails(!showCricketDetails)}
                >
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-neutral-500 mr-2" />
                    <span className="text-sm">Add cricket details</span>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-neutral-400 transition-transform ${showCricketDetails ? 'rotate-90' : ''}`} />
                </div>
                
                {showCricketDetails && (
                  <div className="p-4 border-t border-neutral-200">
                    {/* Post Category */}
                    <div className="mb-4">
                      <Label htmlFor="category" className="text-sm font-medium mb-2 block">
                        Post Category
                      </Label>
                      <Select 
                        value={category} 
                        onValueChange={(value: string) => setCategory(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="match_discussion">Match Discussion</SelectItem>
                          <SelectItem value="player_highlight">Player Highlight</SelectItem>
                          <SelectItem value="team_news">Team News</SelectItem>
                          <SelectItem value="opinion">Opinion</SelectItem>
                          <SelectItem value="meme">Meme</SelectItem>
                          <SelectItem value="highlights">Highlights</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Match ID */}
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <Trophy className="h-4 w-4 text-neutral-500 mr-2" />
                        <Label htmlFor="matchId" className="text-sm font-medium">
                          Match Details
                        </Label>
                      </div>
                      <Input
                        id="matchId"
                        placeholder="Enter match details (e.g., IND vs AUS, T20 World Cup 2023)"
                        value={matchId}
                        onChange={(e) => setMatchId(e.target.value)}
                        className="w-full text-sm"
                      />
                    </div>
                    
                    {/* Team ID */}
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <Users className="h-4 w-4 text-neutral-500 mr-2" />
                        <Label htmlFor="teamId" className="text-sm font-medium">
                          Team Details
                        </Label>
                      </div>
                      <Input
                        id="teamId"
                        placeholder="Enter team name (e.g., India, Royal Challengers Bangalore)"
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        className="w-full text-sm"
                      />
                    </div>
                    
                    {/* Player ID */}
                    <div className="mb-1">
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-neutral-500 mr-2" />
                        <Label htmlFor="playerId" className="text-sm font-medium">
                          Player Details
                        </Label>
                      </div>
                      <Input
                        id="playerId"
                        placeholder="Enter player name (e.g., Virat Kohli, Jasprit Bumrah)"
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value)}
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
