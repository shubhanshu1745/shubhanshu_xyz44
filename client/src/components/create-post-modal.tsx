import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Upload, MapPin, Tag, ChevronRight, X, User, Users, Trophy, Film, Image } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreatePostFormData } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [matchId, setMatchId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [showCricketDetails, setShowCricketDetails] = useState(false);
  const [step, setStep] = useState<"upload" | "details">("upload");
  const [postType, setPostType] = useState<"image" | "reel">("image");
  const [duration, setDuration] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle file upload for images
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPEG, PNG, GIF, or WEBP).",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 8 * 1024 * 1024; // 8MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Image size should be less than 8MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFile(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/post', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      // Ensure we get the URL from the response
      const uploadedUrl = data.url || data.filename || data.path;
      if (!uploadedUrl) {
        throw new Error('No URL returned from upload');
      }
      setImageUrl(uploadedUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image. Please try again.",
        variant: "destructive",
      });
      console.error('Upload error:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle file upload for videos
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid video file (MP4, WebM, or QuickTime).",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Video size should be less than 100MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFile(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/reel', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setVideoUrl(data.url);
      
      // If thumbnail URL is provided in the response
      if (data.thumbnailUrl) {
        setThumbnailUrl(data.thumbnailUrl);
      }

      // If duration is provided in the response
      if (data.duration) {
        setDuration(data.duration);
      }
      
      toast({
        title: "Video uploaded",
        description: "Your video has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your video. Please try again.",
        variant: "destructive",
      });
      console.error('Upload error:', error);
    } finally {
      setUploadingFile(false);
    }
  };
  
  // Handle thumbnail upload for reels
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file for the thumbnail (JPEG, PNG, GIF, or WEBP).",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Thumbnail size should be less than 4MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingFile(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setThumbnailUrl(data.url);
      
      toast({
        title: "Thumbnail uploaded",
        description: "Your thumbnail has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your thumbnail. Please try again.",
        variant: "destructive",
      });
      console.error('Upload error:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostFormData) => {
      return await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (postType === "reel") {
        queryClient.invalidateQueries({ queryKey: ["/api/reels"] });
      }
      toast({
        title: postType === "image" ? "Post created" : "Reel uploaded",
        description: postType === "image" 
          ? "Your post has been published successfully" 
          : "Your reel has been uploaded successfully",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: `Error creating ${postType === "image" ? "post" : "reel"}`,
        description: `There was a problem with your ${postType === "image" ? "post" : "reel"}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setImageUrl("");
    setVideoUrl("");
    setThumbnailUrl("");
    setContent("");
    setLocation("");
    setCategory("");
    setMatchId("");
    setTeamId("");
    setPlayerId("");
    setDuration(0);
    setShowCricketDetails(false);
    setStep("upload");
    setPostType("image");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (postType === "image") {
      // Validate that imageUrl is provided for image posts
      if (!imageUrl || imageUrl.trim() === "") {
        toast({
          title: "Image required",
          description: "Please upload an image or provide an image URL before creating a post.",
          variant: "destructive",
        });
        return;
      }
      
      createPostMutation.mutate({
        content,
        imageUrl: imageUrl.trim(), // Ensure no whitespace and always send if provided
        location: location?.trim() || undefined,
        category: category || undefined as any,
        matchId: matchId?.trim() || undefined,
        teamId: teamId?.trim() || undefined,
        playerId: playerId?.trim() || undefined,
      });
    } else {
      // For reels
      createPostMutation.mutate({
        content,
        videoUrl: videoUrl || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        location: location || undefined,
        category: "reel", // Force category to reel for video posts
        matchId: matchId || undefined,
        teamId: teamId || undefined,
        playerId: playerId || undefined,
        duration: duration || 30, // Default duration if not specified
      });
    }
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
          {step === "upload" && (imageUrl || videoUrl) ? (
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
            <div className="w-full md:w-full h-auto bg-black flex flex-col items-center justify-center">
              {/* Tabs for post type selection */}
              <div className="w-full border-b border-neutral-700">
                <Tabs defaultValue="image" value={postType} onValueChange={(value) => setPostType(value as "image" | "reel")} className="w-full">
                  <TabsList className="w-full bg-black text-white">
                    <TabsTrigger value="image" className="w-1/2 data-[state=active]:bg-neutral-800">
                      <Image className="mr-2 h-4 w-4" />
                      Image Post
                    </TabsTrigger>
                    <TabsTrigger value="reel" className="w-1/2 data-[state=active]:bg-neutral-800">
                      <Film className="mr-2 h-4 w-4" />
                      Reel
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Image Upload Section */}
              {postType === "image" && (
                <div className="h-80 md:h-96 w-full flex items-center justify-center">
                  {imageUrl ? (
                    <div className="w-full h-full p-2">
                      <img 
                        src={imageUrl} 
                        alt="Post preview" 
                        className="w-full h-full object-contain" 
                      />
                      <Button
                        variant="destructive" 
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => setImageUrl("")}
                      >
                        <X className="h-4 w-4 mr-1" /> Clear
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="h-16 w-16 text-white mb-4 mx-auto" />
                      <p className="text-white text-sm mb-4">Drag photos here</p>
                      <Input
                        type="text"
                        placeholder="Or enter image URL here"
                        className="bg-white mb-4 mx-auto max-w-xs"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <div className="flex flex-col mb-4 gap-2">
                        <Button 
                          variant="outline"
                          disabled={uploadingFile}
                          onClick={() => document.getElementById("post-image-upload")?.click()}
                        >
                          {uploadingFile ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span> Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={handleNext}
                          disabled={!imageUrl.trim() || uploadingFile}
                        >
                          Next
                        </Button>
                      </div>
                      <input
                        id="post-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <p className="text-neutral-400 text-xs">
                        Upload an image or paste a direct image URL
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reel Upload Section */}
              {postType === "reel" && (
                <div className="h-80 md:h-96 w-full flex items-center justify-center">
                  {videoUrl ? (
                    <div className="w-full h-full relative p-2">
                      <video 
                        src={videoUrl} 
                        className="w-full h-full object-contain" 
                        controls
                        poster={thumbnailUrl || undefined}
                      />
                      <div className="absolute bottom-2 right-2 flex space-x-2">
                        {thumbnailUrl && (
                          <Button
                            variant="secondary" 
                            size="sm"
                            onClick={() => setThumbnailUrl("")}
                          >
                            <X className="h-4 w-4 mr-1" /> Clear Thumbnail
                          </Button>
                        )}
                        <Button
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setVideoUrl("");
                            setThumbnailUrl("");
                          }}
                        >
                          <X className="h-4 w-4 mr-1" /> Clear Video
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <Film className="h-16 w-16 text-white mb-4 mx-auto" />
                      <p className="text-white text-sm mb-4">Create a new reel</p>
                      
                      <div className="mb-4">
                        <Label htmlFor="videoUrl" className="text-white text-xs mb-2 block">Video URL</Label>
                        <Input
                          id="videoUrl"
                          type="text"
                          placeholder="Enter video URL here"
                          className="bg-white mb-2 mx-auto max-w-xs"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <Label htmlFor="thumbnailUrl" className="text-white text-xs mb-2 block">Thumbnail (optional)</Label>
                        <Input
                          id="thumbnailUrl"
                          type="text"
                          placeholder="Enter thumbnail URL here"
                          className="bg-white mb-2 mx-auto max-w-xs"
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                        />
                        
                        {thumbnailUrl ? (
                          <div className="relative max-w-xs mx-auto mt-2 mb-2 border border-white rounded overflow-hidden">
                            <img 
                              src={thumbnailUrl} 
                              alt="Thumbnail preview" 
                              className="w-full h-24 object-cover" 
                            />
                            <Button
                              variant="destructive" 
                              size="sm"
                              className="absolute bottom-1 right-1"
                              onClick={() => setThumbnailUrl("")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full max-w-xs"
                            disabled={uploadingFile}
                            onClick={() => document.getElementById("post-thumbnail-upload")?.click()}
                          >
                            {uploadingFile ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span> Uploading...
                              </>
                            ) : (
                              <>
                                <Image className="mr-2 h-4 w-4" />
                                Upload Thumbnail Image
                              </>
                            )}
                          </Button>
                        )}
                        <input
                          id="post-thumbnail-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbnailUpload}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <Label htmlFor="duration" className="text-white text-xs mb-2 block">Duration (seconds)</Label>
                        <Input
                          id="duration"
                          type="number"
                          placeholder="Duration in seconds"
                          className="bg-white mb-4 mx-auto max-w-xs"
                          value={duration || ""}
                          onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                          min={1}
                        />
                      </div>
                      
                      <div className="flex flex-col mb-4 gap-2">
                        <Button 
                          variant="outline"
                          disabled={uploadingFile}
                          onClick={() => document.getElementById("post-video-upload")?.click()}
                        >
                          {uploadingFile ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span> Uploading...
                            </>
                          ) : (
                            <>
                              <Film className="mr-2 h-4 w-4" />
                              Upload Video
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={handleNext}
                          disabled={!videoUrl.trim() || uploadingFile}
                        >
                          Next
                        </Button>
                      </div>
                      <input
                        id="post-video-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                      />
                      <p className="text-neutral-400 text-xs">
                        Upload a video or paste a direct video URL
                      </p>
                    </div>
                  )}
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
              
              {/* Preview - Image */}
              {postType === "image" && imageUrl && (
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
              
              {/* Preview - Video */}
              {postType === "reel" && videoUrl && (
                <div className="px-3 pb-3">
                  <div className="border border-neutral-200 rounded-md overflow-hidden h-48">
                    <video
                      src={videoUrl}
                      poster={thumbnailUrl || undefined}
                      className="w-full h-full object-contain bg-neutral-100"
                      controls
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
