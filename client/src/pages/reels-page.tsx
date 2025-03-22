import { useQuery } from "@tanstack/react-query";
import { Post, User } from "@shared/schema";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Share2, Music, User as UserIcon } from "lucide-react";

type ReelWithUser = Post & { 
  user: User; 
  likeCount: number; 
  commentCount: number; 
  hasLiked: boolean;
};

export default function ReelsPage() {
  const { user } = useAuth() || {};
  const isMobile = useIsMobile();
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const { data: reels, isLoading, error } = useQuery<ReelWithUser[]>({
    queryKey: ["/api/reels"],
    enabled: !!user
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load reels. Please try again later.",
      variant: "destructive",
    });
  }

  const handleVideoEnded = (index: number) => {
    // Play the next video when current one ends
    if (reels && index < reels.length - 1) {
      setCurrentReelIndex(index + 1);
    }
  };

  const handleVideoRef = (element: HTMLVideoElement | null, index: number) => {
    if (element) {
      videoRefs.current[index] = element;
      
      // Auto-play the current reel
      if (index === currentReelIndex) {
        element.play().catch(err => console.error("Error playing video:", err));
      } else {
        element.pause();
        element.currentTime = 0;
      }
    }
  };

  const handleReelChange = (index: number) => {
    // Pause the current video
    if (videoRefs.current[currentReelIndex]) {
      videoRefs.current[currentReelIndex]?.pause();
    }
    
    setCurrentReelIndex(index);
    
    // Play the new video
    if (videoRefs.current[index]) {
      videoRefs.current[index]?.play().catch(err => console.error("Error playing video:", err));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view reels</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="w-full max-w-md mb-4 h-[80vh] relative overflow-hidden">
              <Skeleton className="h-full w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!reels || reels.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <p className="text-lg text-center">No reels available.</p>
          <p className="text-sm text-center text-muted-foreground mt-2">
            Follow more users to see their reels in your feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center">
        {reels.map((reel, index) => (
          <Card 
            key={reel.id} 
            className={`w-full max-w-md mb-4 ${isMobile ? "h-[80vh]" : "h-[85vh]"} relative overflow-hidden`}
            onClick={() => handleReelChange(index)}
          >
            <div className="absolute inset-0">
              <video
                ref={(el) => handleVideoRef(el, index)}
                src={reel.videoUrl || undefined}
                poster={reel.thumbnailUrl || undefined}
                className="h-full w-full object-cover"
                loop
                playsInline
                onEnded={() => handleVideoEnded(index)}
              />
              
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              
              {/* User info and caption */}
              <div className="absolute bottom-20 left-4 right-4 text-white z-10">
                <div className="flex items-center mb-2">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={reel.user.profileImage || ""} alt={reel.user.username} />
                    <AvatarFallback>{reel.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2">
                    <p className="font-bold">{reel.user.username}</p>
                    <p className="text-xs opacity-80">{reel.user.fullName}</p>
                  </div>
                </div>
                <p className="text-sm">{reel.content}</p>
                
                {reel.category === "reel" && reel.matchId && (
                  <div className="mt-2 flex items-center">
                    <span className="bg-primary/20 text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Match highlight
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-6 text-white z-10">
                <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="text-white rounded-full">
                    <Heart className={reel.hasLiked ? "fill-red-500 text-red-500" : ""} />
                  </Button>
                  <span className="text-xs">{reel.likeCount}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="text-white rounded-full">
                    <MessageCircle />
                  </Button>
                  <span className="text-xs">{reel.commentCount}</span>
                </div>
                
                <Button variant="ghost" size="icon" className="text-white rounded-full">
                  <Share2 />
                </Button>
              </div>
              
              {/* Music info */}
              <div className="absolute bottom-4 left-4 right-12 flex items-center text-white z-10">
                <Music className="h-4 w-4 mr-2" />
                <p className="text-xs truncate">
                  Original audio
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}