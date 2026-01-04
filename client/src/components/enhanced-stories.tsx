import { useState, useRef, useEffect, useCallback } from "react";
import { X, Heart, MessageCircle, Send, Play, Pause, Volume2, VolumeX, MoreHorizontal, Plus, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Story, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface StoryCircleProps {
  user: User & { hasStory: boolean; isViewed?: boolean };
  onClick: () => void;
  isOwn?: boolean;
}

export function StoryCircle({ user, onClick, isOwn = false }: StoryCircleProps) {
  const hasUnviewedStory = user.hasStory && !user.isViewed;
  
  return (
    <div 
      className="flex flex-col items-center gap-1.5 cursor-pointer group"
      onClick={onClick}
    >
      <div className={`relative p-[3px] rounded-full ${
        hasUnviewedStory 
          ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-500" 
          : user.isViewed 
            ? "bg-slate-300" 
            : "bg-slate-200"
      }`}>
        <div className="bg-white p-[2px] rounded-full">
          <Avatar className="h-16 w-16 border-0 transition-transform group-hover:scale-105">
            <AvatarImage src={user.profileImage || ""} alt={user.username} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        {isOwn && (
          <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 border-2 border-white shadow-md">
            <Plus className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      <span className="text-xs text-slate-600 font-medium text-center max-w-[70px] truncate">
        {isOwn ? "Your story" : user.username}
      </span>
    </div>
  );
}

interface StoryViewerProps {
  stories: (Story & { user: User })[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function StoryViewer({ stories, currentIndex, onClose, onNext, onPrevious }: StoryViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  
  const currentStory = stories[currentIndex];
  const storyDuration = 5000;

  const reactions = ["❤️", "😂", "😮", "😢", "👏", "🔥", "🏏", "⚡"];

  const reactMutation = useMutation({
    mutationFn: async (reaction: string) => {
      return await apiRequest("POST", `/api/stories/${currentStory.id}/react`, {
        reactionType: reaction
      });
    },
    onSuccess: () => {
      toast({
        title: "Reaction sent",
        description: "Your reaction has been sent to the story"
      });
      setShowReactions(false);
    }
  });

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/messages`, {
        recipientId: currentStory.userId,
        content: `Replied to your story: ${content}`,
        storyId: currentStory.id
      });
    },
    onSuccess: () => {
      setReplyText("");
      toast({
        title: "Reply sent",
        description: "Your reply has been sent as a message"
      });
    }
  });

  const viewMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/stories/${currentStory.id}/view`);
    }
  });

  useEffect(() => {
    if (currentStory?.id) {
      viewMutation.mutate();
    }
  }, [currentStory?.id]);

  useEffect(() => {
    if (!isPaused) {
      setProgress(0);
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            onNext();
            return 0;
          }
          return prev + (100 / (storyDuration / 100));
        });
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused, currentIndex, onNext]);

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      replyMutation.mutate(replyText.trim());
    }
  };

  const handleReaction = (reaction: string) => {
    reactMutation.mutate(reaction);
  };

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const isVideo = currentStory?.videoUrl !== null;

  if (!currentStory) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto h-full max-h-screen p-0 bg-black border-0">
        <div className="relative h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ 
                    width: index < currentIndex ? '100%' : 
                           index === currentIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-4 right-4 z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-lg">
                <AvatarImage src={currentStory.user.profileImage || ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {currentStory.user.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-semibold">{currentStory.user.username}</p>
                <p className="text-white/70 text-xs">
                  {formatDistanceToNow(new Date(currentStory.createdAt!), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-white hover:bg-white/20 rounded-full"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-white hover:bg-white/20 rounded-full"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Story Content */}
          <div className="flex-1 relative flex items-center justify-center">
            {isVideo ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                onClick={handleVideoToggle}
              >
                <source src={currentStory.videoUrl || ""} type="video/mp4" />
              </video>
            ) : (
              <img
                src={currentStory.imageUrl || ""}
                alt="Story"
                className="w-full h-full object-cover"
                onClick={() => setIsPaused(!isPaused)}
              />
            )}

            {/* Text overlay */}
            {currentStory.caption && (
              <div className="absolute inset-x-4 bottom-28 bg-black/60 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white text-center">{currentStory.caption}</p>
              </div>
            )}

            {/* Navigation areas */}
            <div 
              className="absolute left-0 top-0 w-1/3 h-full z-10"
              onClick={onPrevious}
            />
            <div 
              className="absolute right-0 top-0 w-1/3 h-full z-10"
              onClick={onNext}
            />

            {/* Video controls */}
            {isVideo && (
              <div className="absolute bottom-28 right-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-10 w-10 p-0 bg-black/50 border-0 text-white rounded-full"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          {user && currentStory.userId !== user.id && (
            <div className="absolute bottom-4 left-4 right-4 z-10">
              {/* Quick reactions */}
              {showReactions && (
                <div className="bg-black/80 backdrop-blur-sm rounded-full p-3 mb-3 flex justify-center gap-2">
                  {reactions.map(reaction => (
                    <button
                      key={reaction}
                      className="text-2xl hover:scale-125 transition-transform active:scale-95"
                      onClick={() => handleReaction(reaction)}
                    >
                      {reaction}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <form onSubmit={handleReply} className="flex-1">
                  <Input
                    placeholder="Send message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/60 rounded-full px-4 h-11 focus:ring-2 focus:ring-white/30"
                  />
                </form>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-11 w-11 p-0 text-white hover:bg-white/20 rounded-full"
                  onClick={() => setShowReactions(!showReactions)}
                >
                  <Heart className="h-6 w-6" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-11 w-11 p-0 text-white hover:bg-white/20 rounded-full"
                  onClick={handleReply}
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StoriesContainerProps {
  className?: string;
}

interface StoriesContainerProps {
  className?: string;
  onCreateStory?: () => void;
}

export function StoriesContainer({ className = "", onCreateStory }: StoriesContainerProps) {
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  
  const { data: storyUsers, isLoading } = useQuery({
    queryKey: ["/api/stories/users"],
    queryFn: getQueryFn(),
  });

  // Get current user's stories
  const { data: currentUserStoriesData } = useQuery({
    queryKey: ["/api/stories/user", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const response = await fetch(`/api/stories/user/${user.id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user,
  });

  const { data: currentUserStories } = useQuery<any[]>({
    queryKey: ["/api/stories", currentUserIndex],
    enabled: viewerOpen && storyUsers && currentUserIndex < storyUsers.length && storyUsers[currentUserIndex]
  });

  const handleStoryClick = (userIndex: number) => {
    setCurrentUserIndex(userIndex);
    setCurrentStoryIndex(0);
    setViewerOpen(true);
  };

  const handleOwnStoryClick = () => {
    // If user has stories, show them, otherwise open create dialog
    if (currentUserStoriesData?.stories && currentUserStoriesData.stories.length > 0) {
      // Show own stories in viewer
      setCurrentUserIndex(-1);
      setCurrentStoryIndex(0);
      setViewerOpen(true);
    } else {
      // Open create story dialog
      if (onCreateStory) {
        onCreateStory();
      }
    }
  };

  const handleNext = useCallback(() => {
    if (!currentUserStories) return;
    
    if (Array.isArray(currentUserStories) && currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (storyUsers && currentUserIndex < storyUsers.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      setViewerOpen(false);
    }
  }, [currentStoryIndex, currentUserIndex, currentUserStories, storyUsers]);

  const handlePrevious = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(0);
    } else {
      setViewerOpen(false);
    }
  }, [currentStoryIndex, currentUserIndex]);

  if (isLoading) {
    return (
      <div className={`flex gap-4 p-4 overflow-x-auto ${className}`}>
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="h-[70px] w-[70px] bg-slate-200 rounded-full animate-pulse" />
            <div className="h-3 w-14 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`flex gap-4 p-4 overflow-x-auto scrollbar-hide ${className}`}>
        {/* Own story */}
        {user && (
          <StoryCircle
            user={user}
            hasStory={currentUserStoriesData?.stories && currentUserStoriesData.stories.length > 0}
            onClick={handleOwnStoryClick}
            isOwn
          />
        )}
        
        {/* Other users' stories */}
        {storyUsers?.map((storyUser: any, index: number) => (
          <StoryCircle
            key={storyUser.id}
            user={storyUser}
            onClick={() => handleStoryClick(index)}
          />
        ))}
        
        {/* Placeholder circles when no stories */}
        {(!storyUsers || storyUsers.length === 0) && (
          <>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 opacity-40">
                <div className="p-[3px] rounded-full bg-slate-200">
                  <div className="bg-white p-[2px] rounded-full">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-slate-300" />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400">No stories</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Story Viewer */}
      {viewerOpen && (
        <StoryViewer
          stories={
            currentUserIndex === -1 && currentUserStoriesData?.stories
              ? currentUserStoriesData.stories.map((s: any) => ({ ...s, user: user! }))
              : Array.isArray(currentUserStories) 
                ? currentUserStories 
                : []
          }
          currentIndex={currentStoryIndex}
          onClose={() => setViewerOpen(false)}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </>
  );
}
