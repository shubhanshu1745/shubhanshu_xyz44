import { useState, useRef, useEffect, useCallback } from "react";
import { X, Heart, MessageCircle, Send, Play, Pause, Volume2, VolumeX, MoreHorizontal, ArrowLeft, ArrowRight, Plus, Camera, Type, Smile, Music } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface StoryCircleProps {
  user: User & { hasStory: boolean; isViewed?: boolean };
  onClick: () => void;
  isOwn?: boolean;
}

export function StoryCircle({ user, onClick, isOwn = false }: StoryCircleProps) {
  const gradientClass = user.hasStory && !user.isViewed 
    ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500" 
    : user.isViewed 
    ? "bg-gray-300" 
    : "bg-gray-200";

  return (
    <div className="flex flex-col items-center space-y-1 cursor-pointer" onClick={onClick}>
      <div className={`p-0.5 rounded-full ${gradientClass}`}>
        <div className="bg-white p-0.5 rounded-full">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.profileImage || ""} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        {isOwn && (
          <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
            <Plus className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      <span className="text-xs text-gray-600 text-center max-w-[60px] truncate">
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
  const storyDuration = 5000; // 5 seconds per story

  // Story reactions
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
    if (currentStory) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        viewMutation.mutate();
      }, 0);
    }
  }, [currentIndex]);

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
      <DialogContent className="max-w-md mx-auto h-full max-h-screen p-0 bg-black">
        <div className="relative h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-10 flex space-x-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded">
                <div 
                  className="h-full bg-white rounded transition-all duration-100"
                  style={{ 
                    width: index < currentIndex ? '100%' : 
                           index === currentIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pt-6">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={currentStory.user.profileImage || ""} />
                <AvatarFallback>{currentStory.user.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-semibold">{currentStory.user.username}</p>
                <p className="text-white/80 text-xs">
                  {formatDistanceToNow(new Date(currentStory.createdAt!), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
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
              <div className="absolute inset-x-4 bottom-24 bg-black/50 rounded-lg p-3">
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
              <div className="absolute bottom-4 right-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-black/50 border-0 text-white"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          {user && currentStory.userId !== user.id && (
            <div className="absolute bottom-4 left-4 right-4 z-10">
              {/* Quick reactions */}
              {showReactions && (
                <div className="bg-black/70 rounded-full p-2 mb-3 flex justify-center space-x-2">
                  {reactions.map(reaction => (
                    <button
                      key={reaction}
                      className="text-2xl hover:scale-110 transition-transform"
                      onClick={() => handleReaction(reaction)}
                    >
                      {reaction}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-3">
                <form onSubmit={handleReply} className="flex-1 flex items-center space-x-2">
                  <Input
                    placeholder="Send message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-transparent border border-white/30 text-white placeholder-white/60 rounded-full px-4"
                  />
                </form>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={() => setShowReactions(!showReactions)}
                >
                  <Heart className="h-5 w-5" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <Send className="h-5 w-5" />
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

export function StoriesContainer({ className = "" }: StoriesContainerProps) {
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  
  const { data: storyUsers, isLoading } = useQuery({
    queryKey: ["/api/stories/users"],
    queryFn: getQueryFn(),
  });

  const { data: currentUserStories } = useQuery({
    queryKey: ["/api/stories", currentUserIndex],
    enabled: viewerOpen && storyUsers && currentUserIndex < storyUsers.length && storyUsers[currentUserIndex]
  });

  const handleStoryClick = (userIndex: number) => {
    setCurrentUserIndex(userIndex);
    setCurrentStoryIndex(0);
    setViewerOpen(true);
  };

  const handleNext = useCallback(() => {
    if (!currentUserStories) return;
    
    if (currentStoryIndex < currentUserStories.length - 1) {
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
      <div className={`flex space-x-4 p-4 ${className}`}>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-1">
            <div className="h-14 w-14 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`flex space-x-4 p-4 overflow-x-auto ${className}`}>
        {/* Own story */}
        {user && (
          <StoryCircle
            user={{ ...user, hasStory: true }}
            onClick={() => handleStoryClick(0)}
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
      </div>

      {/* Story Viewer */}
      {viewerOpen && currentUserStories && (
        <StoryViewer
          stories={currentUserStories}
          currentIndex={currentStoryIndex}
          onClose={() => setViewerOpen(false)}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}
    </>
  );
}