import { useState, useEffect, useRef, useCallback } from "react";
import { X, Heart, MessageCircle, Send, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Story, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type StoryWithUser = Story & { user: User };

interface InstagramStoryViewerProps {
  open: boolean;
  onClose: () => void;
  stories: StoryWithUser[];
  initialStoryIndex?: number;
  initialUserIndex?: number;
  users?: Array<User & { hasStory: boolean; isViewed?: boolean; stories: StoryWithUser[] }>;
}

const STORY_DURATION = 5000; // 5 seconds per story
const PROGRESS_UPDATE_INTERVAL = 50; // Update progress every 50ms

export function InstagramStoryViewer({
  open,
  onClose,
  stories,
  initialStoryIndex = 0,
  initialUserIndex = 0,
  users = []
}: InstagramStoryViewerProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();

  // Get current story based on user index and story index
  const getCurrentStory = useCallback((): StoryWithUser | null => {
    if (users.length > 0) {
      const currentUserStories = users[currentUserIndex]?.stories || [];
      return currentUserStories[currentStoryIndex] || null;
    }
    return stories[currentStoryIndex] || null;
  }, [users, currentUserIndex, currentStoryIndex, stories]);

  const currentStory = getCurrentStory();
  const currentStories = users.length > 0 
    ? (users[currentUserIndex]?.stories || [])
    : stories;

  const reactions = ["❤️", "😂", "😮", "😢", "👏", "🔥", "🏏", "⚡"];

  // View mutation
  const viewMutation = useMutation({
    mutationFn: async (storyId: number) => {
      return await apiRequest("POST", `/api/stories/${storyId}/view`);
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentStory) return;
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
        description: "Your reply has been sent as a message",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  });

  // Reaction mutation
  const reactMutation = useMutation({
    mutationFn: async (reaction: string) => {
      if (!currentStory) return;
      return await apiRequest("POST", `/api/stories/${currentStory.id}/react`, {
        reactionType: reaction
      });
    },
    onSuccess: () => {
      toast({
        title: "Reaction sent",
        description: "Your reaction has been sent",
      });
      setShowReactions(false);
    },
  });

  // Record view when story changes
  useEffect(() => {
    if (currentStory && !hasViewed && open) {
      viewMutation.mutate(currentStory.id);
      setHasViewed(true);
    }
  }, [currentStory?.id, open, hasViewed]);

  // Reset view status when story changes
  useEffect(() => {
    setHasViewed(false);
    setProgress(0);
    setIsPaused(false);
  }, [currentStory?.id]);

  // Progress animation
  useEffect(() => {
    if (!open || isPaused || !currentStory) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const increment = (100 / (STORY_DURATION / PROGRESS_UPDATE_INTERVAL));
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          handleNext();
          return 0;
        }
        return newProgress;
      });
    }, PROGRESS_UPDATE_INTERVAL);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [open, isPaused, currentStory?.id]);

  // Handle video play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          // Auto-play was prevented, user will need to interact
        });
      }
    }
  }, [isPaused, currentStory?.id]);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (users.length > 0 && currentUserIndex < users.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, currentStories.length, currentUserIndex, users.length, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (users.length > 0 && currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevUserStories = users[currentUserIndex - 1]?.stories || [];
      setCurrentStoryIndex(prevUserStories.length - 1);
    }
  }, [currentStoryIndex, currentUserIndex, users]);

  const handlePause = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  };

  const handleResume = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 100);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() && currentStory) {
      replyMutation.mutate(replyText.trim());
    }
  };

  const handleReaction = (reaction: string) => {
    if (currentStory) {
      reactMutation.mutate(reaction);
    }
  };

  const isVideo = currentStory?.videoUrl !== null && currentStory?.videoUrl !== undefined;

  if (!open || !currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-md mx-auto h-[90vh] bg-black border-0 overflow-hidden">
        <div className="relative h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-50 flex gap-1 px-2">
            {currentStories.map((_, index) => (
              <div 
                key={index} 
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div 
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{ 
                    width: index < currentStoryIndex ? '100%' : 
                           index === currentStoryIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-4 right-4 z-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-lg">
                <AvatarImage src={currentStory.user.profileImage || ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {currentStory.user.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-semibold">
                  {currentStory.user.username || "Unknown"}
                </p>
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
                onMouseDown={handlePause}
                onMouseUp={handleResume}
                onTouchStart={handlePause}
                onTouchEnd={handleResume}
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
          <div 
            className="flex-1 relative flex items-center justify-center bg-black"
            onMouseDown={handlePause}
            onMouseUp={handleResume}
            onTouchStart={handlePause}
            onTouchEnd={handleResume}
          >
            {isVideo ? (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                muted={isMuted}
                loop={false}
                playsInline
                onEnded={handleNext}
              >
                <source src={currentStory.videoUrl || ""} type="video/mp4" />
              </video>
            ) : (
              <img
                src={currentStory.imageUrl || ""}
                alt="Story"
                className="w-full h-full object-contain"
              />
            )}

            {/* Caption overlay */}
            {currentStory.caption && (
              <div className="absolute inset-x-4 bottom-24 bg-black/60 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white text-center text-sm">{currentStory.caption}</p>
              </div>
            )}

            {/* Navigation areas */}
            <div 
              className="absolute left-0 top-0 w-1/3 h-full z-40 cursor-pointer"
              onClick={handlePrevious}
            />
            <div 
              className="absolute right-0 top-0 w-1/3 h-full z-40 cursor-pointer"
              onClick={handleNext}
            />

            {/* Navigation arrows */}
            {currentStoryIndex > 0 && (
              <Button
                variant="ghost"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 p-0 text-white hover:bg-white/20 rounded-full z-40"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            {(currentStoryIndex < currentStories.length - 1 || (users.length > 0 && currentUserIndex < users.length - 1)) && (
              <Button
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 p-0 text-white hover:bg-white/20 rounded-full z-40"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Video controls */}
            {isVideo && (
              <div className="absolute bottom-24 right-4 z-40">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-10 w-10 p-0 bg-black/50 border-0 text-white rounded-full hover:bg-black/70"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
            )}
          </div>

          {/* Actions - Only show for other users' stories */}
          {currentUser && currentStory.userId !== currentUser.id && (
            <div className="absolute bottom-4 left-4 right-4 z-50">
              {/* Quick reactions */}
              {showReactions && (
                <div className="bg-black/80 backdrop-blur-sm rounded-full p-3 mb-3 flex justify-center gap-3">
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
                  disabled={!replyText.trim() || replyMutation.isPending}
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

