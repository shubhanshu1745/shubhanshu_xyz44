import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Story, User } from "@shared/schema";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type StoryWithUser = Story & { user: User };

interface StoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stories: StoryWithUser[];
  initialStoryIndex?: number;
}

export function StoryViewer({ 
  open, 
  onOpenChange, 
  stories,
  initialStoryIndex = 0 
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentStory = stories[currentStoryIndex];
  
  // Reset progress when changing stories
  useEffect(() => {
    setProgress(0);
  }, [currentStoryIndex]);
  
  // Progress animation
  useEffect(() => {
    if (!open || isPaused || !stories.length) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            return 0;
          } else {
            clearInterval(interval);
            onOpenChange(false);
            setCurrentStoryIndex(0);
            return 100;
          }
        }
        return prev + 1; // Faster progress
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [open, currentStoryIndex, stories.length, isPaused, onOpenChange]);
  
  // Handle story navigation
  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onOpenChange(false);
    }
  };
  
  // Reset index on close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => setCurrentStoryIndex(0), 300);
    }
    onOpenChange(newOpen);
  };
  
  // If no stories, don't render
  if (!stories.length) return null;
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 max-w-md sm:max-w-lg md:max-w-xl h-[80vh] bg-black overflow-hidden">
        {/* Close button */}
        <Button
          className="absolute right-2 top-2 z-50 h-8 w-8 rounded-full bg-black/40 p-0"
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4 text-white" />
        </Button>
        
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-40 flex gap-1">
          {stories.map((_, index) => (
            <div 
              key={index} 
              className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
            >
              {index === currentStoryIndex && (
                <div 
                  className="h-full bg-white"
                  style={{ width: `${progress}%` }}
                />
              )}
              {index < currentStoryIndex && (
                <div className="h-full bg-white w-full" />
              )}
            </div>
          ))}
        </div>
        
        {/* User info */}
        <div className="absolute top-6 left-4 z-40 flex items-center gap-2">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={currentStory?.user?.profileImage || "https://github.com/shadcn.png"} />
            <AvatarFallback className="bg-[#2E8B57] text-white">
              {currentStory?.user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium text-sm">{currentStory?.user?.username}</p>
            <p className="text-white/70 text-xs">
              {currentStory?.createdAt && new Date(currentStory.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
        
        {/* Story content */}
        <div 
          className="relative h-full w-full"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Image */}
          <img
            src={currentStory?.imageUrl || ""}
            alt="Story"
            className="h-full w-full object-contain"
          />
          
          {/* Caption */}
          {currentStory?.caption && (
            <div className="absolute bottom-10 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-center">{currentStory.caption}</p>
            </div>
          )}
          
          {/* Navigation buttons */}
          <Button
            className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1/4 bg-transparent hover:bg-transparent"
            onClick={handlePrevious}
            disabled={currentStoryIndex === 0}
          >
            <ChevronLeft className={`h-8 w-8 text-white opacity-0 ${currentStoryIndex > 0 ? 'group-hover:opacity-100' : ''}`} />
            <span className="sr-only">Previous</span>
          </Button>
          
          <Button
            className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-1/4 bg-transparent hover:bg-transparent"
            onClick={handleNext}
          >
            <ChevronRight className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}