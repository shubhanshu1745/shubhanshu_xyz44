import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlusCircle, Image, Video } from "lucide-react";
import StoryCard from "@/components/stories/story-card";
import { InstagramStoryViewer } from "@/components/instagram-story-viewer";
import { StoryCircle } from "@/components/story-circle";

export default function StoriesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isHighlight, setIsHighlight] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch stories for feed
  const { data: stories, isLoading, error } = useQuery({
    queryKey: ["/api/stories/feed"],
    queryFn: getQueryFn(),
  });

  // Fetch users with stories
  const { data: storyUsers } = useQuery({
    queryKey: ["/api/stories/users"],
    queryFn: getQueryFn(),
  });

  // Fetch stories for selected user
  const { data: selectedUserStories } = useQuery({
    queryKey: ["/api/stories/user", selectedUserIndex],
    queryFn: async () => {
      if (!storyUsers || selectedUserIndex >= storyUsers.length) return null;
      const userId = storyUsers[selectedUserIndex].id;
      const response = await fetch(`/api/stories/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user stories");
      return response.json();
    },
    enabled: viewerOpen && !!storyUsers && selectedUserIndex < storyUsers.length,
  });

  // Fetch user's own stories
  const { data: userStories, isLoading: isLoadingUserStories } = useQuery({
    queryKey: ["/api/stories/user", user?.id],
    queryFn: async () => {
      if (!user) return { stories: [] };
      const response = await fetch(`/api/stories/user/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user stories");
      return response.json();
    },
    enabled: !!user,
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: any) => {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create story");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/user", user?.id] });
      
      toast({
        title: "Story created",
        description: "Your story has been published successfully",
      });
      
      // Reset form and close dialog
      setCaption("");
      setMediaUrl("");
      setMediaType("image");
      setIsHighlight(false);
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    },
  });
  
  // Upload file to server and get back the URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append("file", file);
      
      // Upload the file
      const response = await fetch("/api/upload/story", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      
      // Ensure we get the URL from the response
      const uploadedUrl = data.url || data.filename || data.path;
      if (!uploadedUrl) {
        throw new Error('No URL returned from upload');
      }
      
      // Set the media URL and type in the state
      setMediaUrl(uploadedUrl);
      if (data.mediaType) {
        setMediaType(data.mediaType);
      } else {
        // Determine type from file
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        setMediaType(fileType);
      }
      
      toast({
        title: "Upload successful",
        description: "Your image was uploaded successfully. Complete the form to create your story.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateStory = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a story",
        variant: "destructive",
      });
      return;
    }
    
    if (!mediaUrl) {
      toast({
        title: "Media required",
        description: "Please upload an image or video for your story",
        variant: "destructive",
      });
      return;
    }
    
    createStoryMutation.mutate({
      caption,
      imageUrl: mediaType === "image" ? mediaUrl : null,
      videoUrl: mediaType === "video" ? mediaUrl : null,
      mediaType,
      isHighlight,
    });
  };
  
  const handleViewStory = async (storyId: number) => {
    if (!user) return;
    
    try {
      await fetch(`/api/stories/${storyId}/view`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/stories/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/user", user.id] });
      
    } catch (error) {
      console.error("Error marking story as viewed:", error);
    }
  };

  const handleStoryCircleClick = (userIndex: number) => {
    setSelectedUserIndex(userIndex);
    setSelectedStoryIndex(0);
    setViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>Failed to load stories. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare users with stories for viewer
  const usersWithStories = storyUsers?.map((storyUser: any, index: number) => ({
    ...storyUser,
    stories: index === selectedUserIndex && selectedUserStories?.stories 
      ? selectedUserStories.stories 
      : []
  })) || [];

  return (
    <div className="container mx-auto p-4">
      {/* Story Circles */}
      <div className="mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {user && (
            <StoryCircle
              user={user}
              hasStory={userStories?.stories && userStories.stories.length > 0}
              onClick={() => {
                if (userStories?.stories && userStories.stories.length > 0) {
                  // Find user index or add to beginning
                  setSelectedUserIndex(-1);
                  setSelectedStoryIndex(0);
                  setViewerOpen(true);
                } else {
                  setCreateDialogOpen(true);
                }
              }}
            />
          )}
          {storyUsers?.map((storyUser: any, index: number) => (
            <StoryCircle
              key={storyUser.id}
              user={storyUser}
              hasStory={storyUser.hasStory}
              onClick={() => handleStoryCircleClick(index)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stories</h1>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Story
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a New Story</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="media-type">Media Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mediaType === "image" ? "default" : "outline"}
                    onClick={() => setMediaType("image")}
                    className="flex-1"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    type="button"
                    variant={mediaType === "video" ? "default" : "outline"}
                    onClick={() => setMediaType("video")}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="media">Upload {mediaType === "image" ? "Image" : "Video"}</Label>
                <Input
                  id="media"
                  type="file"
                  accept={mediaType === "image" ? "image/*" : "video/*"}
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading...
                  </div>
                )}
                {mediaUrl && (
                  <div className="mt-2">
                    {mediaType === "image" ? (
                      <img 
                        src={mediaUrl} 
                        alt="Preview" 
                        className="rounded-md max-h-48 object-cover"
                      />
                    ) : (
                      <video 
                        src={mediaUrl} 
                        controls 
                        className="rounded-md max-h-48 w-full" 
                      />
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Add a caption to your story..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="highlight"
                  checked={isHighlight}
                  onChange={(e) => setIsHighlight(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="highlight" className="text-sm cursor-pointer">
                  Keep as highlight (won't expire after 24 hours)
                </Label>
              </div>
              
              <Button 
                onClick={handleCreateStory} 
                disabled={!mediaUrl || createStoryMutation.isPending}
                className="w-full"
              >
                {createStoryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Story"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="feed">
        <TabsList className="mb-4">
          <TabsTrigger value="feed">All Stories</TabsTrigger>
          {user && <TabsTrigger value="my-stories">My Stories</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="feed">
          {stories?.stories && stories.stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.stories.map((story: any) => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  onViewStory={() => handleViewStory(story.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No stories yet. Be the first to share a story!</p>
            </div>
          )}
        </TabsContent>
        
        {user && (
          <TabsContent value="my-stories">
            {isLoadingUserStories ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : userStories?.stories && userStories.stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userStories.stories.map((story: any) => (
                  <StoryCard 
                    key={story.id} 
                    story={story} 
                    onViewStory={() => handleViewStory(story.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">You haven't created any stories yet.</p>
                <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                  Create Your First Story
                </Button>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Instagram Story Viewer */}
      {viewerOpen && (
        <InstagramStoryViewer
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/stories/users"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stories/feed"] });
          }}
          stories={selectedUserIndex === -1 && userStories?.stories 
            ? userStories.stories.map((s: any) => ({ ...s, user: user! }))
            : []
          }
          initialStoryIndex={selectedStoryIndex}
          initialUserIndex={selectedUserIndex}
          users={usersWithStories}
        />
      )}
    </div>
  );
}