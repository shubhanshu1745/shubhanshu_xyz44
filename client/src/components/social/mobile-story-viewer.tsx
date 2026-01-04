import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreHorizontal, Pause, Play } from "lucide-react";

interface Story {
  id: number;
  imageUrl: string | null;
  videoUrl: string | null;
  caption: string | null;
  createdAt: Date;
  viewCount: number;
}

interface StoryUser {
  id: number;
  username: string;
  profileImage: string | null;
}

interface MobileStoryViewerProps {
  stories: Story[];
  user: StoryUser;
  initialIndex?: number;
  onClose: () => void;
  onReply?: (storyId: number, message: string) => void;
  onReact?: (storyId: number, reaction: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function MobileStoryViewer({
  stories,
  user,
  initialIndex = 0,
  onClose,
  onReply,
  onReact,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}: MobileStoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000; // 5 seconds per story

  const currentStory = stories[currentIndex];

  // Progress bar animation
  useEffect(() => {
    if (isPaused) return;

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPaused]);

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else if (hasNext && onNext) {
      onNext();
    } else {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    } else if (hasPrevious && onPrevious) {
      onPrevious();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    
    // Determine tap location for navigation
    const touchX = e.changedTouches[0].clientX;
    const screenWidth = window.innerWidth;
    
    if (touchX < screenWidth / 3) {
      goToPrevious();
    } else if (touchX > (screenWidth * 2) / 3) {
      goToNext();
    }
  };

  const handleReply = () => {
    if (replyText.trim() && onReply) {
      onReply(currentStory.id, replyText.trim());
      setReplyText("");
    }
  };

  const handleReaction = (reaction: string) => {
    if (onReact) {
      onReact(currentStory.id, reaction);
    }
    setShowReactions(false);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const reactions = ["❤️", "🔥", "👏", "😮", "😢", "🎉"];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 safe-area-inset-top">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex 
                  ? "100%" 
                  : index === currentIndex 
                    ? `${progress}%` 
                    : "0%"
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between p-4 safe-area-inset-top">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white">
            <AvatarImage src={user.profileImage || undefined} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">{user.username}</p>
            <p className="text-white/70 text-xs">{formatTime(currentStory.createdAt)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPaused(!isPaused)}
            className="text-white hover:bg-white/20"
          >
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div
        className="flex-1 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentStory.videoUrl ? (
          <video
            src={currentStory.videoUrl}
            className="max-h-full max-w-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : currentStory.imageUrl ? (
          <img
            src={currentStory.imageUrl}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-white text-center p-8">
            <p className="text-xl">{currentStory.caption}</p>
          </div>
        )}

        {/* Caption overlay */}
        {currentStory.caption && currentStory.imageUrl && (
          <div className="absolute bottom-24 left-0 right-0 p-4">
            <p className="text-white text-center text-shadow">{currentStory.caption}</p>
          </div>
        )}

        {/* Navigation arrows (desktop) */}
        {(hasPrevious || currentIndex > 0) && (
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hidden md:block"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}
        {(hasNext || currentIndex < stories.length - 1) && (
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hidden md:block"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>

      {/* Reactions popup */}
      {showReactions && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 flex gap-3">
          {reactions.map((reaction) => (
            <button
              key={reaction}
              onClick={() => handleReaction(reaction)}
              className="text-2xl hover:scale-125 transition-transform"
            >
              {reaction}
            </button>
          ))}
        </div>
      )}

      {/* Reply input */}
      <div className="absolute bottom-0 left-0 right-0 p-4 safe-area-inset-bottom">
        <div className="flex items-center gap-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to story..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full"
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReactions(!showReactions)}
            className="text-white hover:bg-white/20"
          >
            <Heart className="h-6 w-6" />
          </Button>
          {replyText.trim() && (
            <Button
              size="icon"
              onClick={handleReply}
              className="bg-white text-black hover:bg-white/90 rounded-full"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
