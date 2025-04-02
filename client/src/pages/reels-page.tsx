import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Post, User } from "@shared/schema";
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Music, 
  MoreVertical, 
  Bookmark, 
  Share, 
  MoreHorizontal,
  Facebook,
  Twitter,
  Mail,
  Link,
  Users,
  Trophy,
  Loader2,
  Circle,
  Smile,
  Users2,
  Globe,
  Volume2,
  Zap
} from "lucide-react";

type ReelWithUser = Post & { 
  user: User; 
  likeCount: number; 
  commentCount: number; 
  hasLiked: boolean;
};

export default function ReelsPage() {
  const { user } = useAuth() || {};
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeReel, setActiveReel] = useState<ReelWithUser | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
  
  const handleLike = (reel: ReelWithUser, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent video play/pause
    
    if (!reels) return;
    
    // Optimistic update
    const updatedReels = reels.map(r => 
      r.id === reel.id ? { 
        ...r, 
        hasLiked: !r.hasLiked, 
        likeCount: r.hasLiked ? r.likeCount - 1 : r.likeCount + 1 
      } : r
    );
    
    queryClient.setQueryData(["/api/reels"], updatedReels);
    
    // Make API request
    apiRequest(
      reel.hasLiked ? "DELETE" : "POST", 
      `/api/posts/${reel.id}/like`
    ).catch(() => {
      // Revert on error
      queryClient.setQueryData(["/api/reels"], reels);
      toast({
        title: "Error",
        description: "Could not update like. Please try again.",
        variant: "destructive"
      });
    });
  };
  
  const handleComment = (reel: ReelWithUser, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent video play/pause
    setActiveReel(reel);
    setIsCommentOpen(true);
  };
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || !activeReel || !reels) return;
    
    setIsSavingComment(true);
    
    try {
      // Save comment to server
      await apiRequest("POST", `/api/posts/${activeReel.id}/comments`, {
        content: commentText
      });
      
      // Optimistically update comment count
      const updatedReels = reels.map(r => 
        r.id === activeReel.id ? { 
          ...r, 
          commentCount: r.commentCount + 1 
        } : r
      );
      
      queryClient.setQueryData(["/api/reels"], updatedReels);
      
      // Clear form
      setCommentText("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      
      // Close comment dialog
      setIsCommentOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingComment(false);
    }
  };
  
  const handleShare = (reel: ReelWithUser, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent video play/pause
    setActiveReel(reel);
    setIsShareOpen(true);
  };
  
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
    
    // Apply mute status to all videos
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
    
    // Show indicator
    const indicator = document.getElementById('sound-indicator');
    if (indicator) {
      indicator.classList.add('opacity-100');
      setTimeout(() => {
        indicator.classList.remove('opacity-100');
      }, 1000);
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
                muted={isMuted}
                onEnded={() => handleVideoEnded(index)}
              />
              
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              
              {/* Instagram-like mute/unmute indicator */}
              <div 
                id="sound-indicator" 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            bg-black/50 rounded-full p-6 opacity-0 transition-opacity duration-300 z-30"
              >
                <Volume2 className="h-8 w-8 text-white" />
              </div>
              
              {/* Instagram-style top bar with progress */}
              <div className="absolute top-2 left-0 right-0 px-2 z-20">
                <div className="flex w-full gap-1">
                  {reels.map((_, i) => (
                    <div key={i} className="h-1 bg-white/30 rounded-full flex-1">
                      <div 
                        className={`h-full bg-white rounded-full ${i < index ? 'w-full' : i === index ? 'animate-[progress_15s_linear_forwards]' : 'w-0'}`} 
                        style={{
                          animationPlayState: i === index ? 'running' : 'paused',
                          width: i < index ? '100%' : i > index ? '0%' : undefined
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Volume control button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-white rounded-full z-20 opacity-70 hover:opacity-100"
                onClick={toggleMute}
              >
                {isMuted ? <Volume2 className="h-5 w-5 text-white opacity-50" /> : <Volume2 className="h-5 w-5 text-white" />}
              </Button>
              
              {/* User info and caption */}
              <div className="absolute bottom-20 left-4 right-14 text-white z-10">
                <div className="flex items-center mb-2">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={reel.user.profileImage || ""} alt={reel.user.username} />
                    <AvatarFallback>{reel.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2">
                    <p className="font-bold">{reel.user.username}</p>
                    <p className="text-xs opacity-80">{reel.user.fullName}</p>
                  </div>
                  {/* Instagram-style follow button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto text-xs h-7 border-white text-white hover:bg-white/20 hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Follow
                  </Button>
                </div>
                
                {/* Caption with hashtags highlighted */}
                <p className="text-sm">
                  {reel.content.split(' ').map((word, i) => 
                    word.startsWith('#') ? 
                      <span key={i} className="text-blue-300">{word} </span> : 
                      <span key={i}>{word} </span>
                  )}
                </p>
                
                {reel.category === "reel" && reel.matchId && (
                  <div className="mt-2 flex items-center">
                    <span className="bg-primary/20 text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Match highlight
                    </span>
                  </div>
                )}
                
                {/* Music track (Instagram-style) */}
                <div className="mt-2 flex items-center">
                  <Music className="h-3 w-3 mr-1" />
                  <p className="text-xs">
                    <span className="font-medium">Cricket sounds</span> • Original audio
                  </p>
                </div>
              </div>
              
              {/* Action buttons (Instagram style) */}
              <div className="absolute right-2 bottom-24 flex flex-col items-center space-y-5 text-white z-10">
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white rounded-full h-12 w-12 hover:bg-black/20"
                    onClick={(e) => handleLike(reel, e)}
                  >
                    <Heart className={`h-7 w-7 ${reel.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <span className="text-xs font-medium mt-1">{reel.likeCount}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white rounded-full h-12 w-12 hover:bg-black/20"
                    onClick={(e) => handleComment(reel, e)}
                  >
                    <MessageCircle className="h-7 w-7" />
                  </Button>
                  <span className="text-xs font-medium mt-1">{reel.commentCount}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white rounded-full h-12 w-12 hover:bg-black/20"
                    onClick={(e) => handleShare(reel, e)}
                  >
                    <Send className="h-7 w-7" />
                  </Button>
                  <span className="text-xs font-medium mt-1">Share</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white rounded-full h-12 w-12 hover:bg-black/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Bookmark className="h-7 w-7" />
                  </Button>
                  <span className="text-xs font-medium mt-1">Save</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white rounded-full h-12 w-12 hover:bg-black/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-7 w-7" />
                  </Button>
                  <span className="text-xs font-medium mt-1">More</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Instagram-style comments dialog */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-4 my-4">
            <div className="space-y-4">
              {/* We would fetch comments here in a real implementation */}
              <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeReel?.user.profileImage} />
                  <AvatarFallback>{activeReel?.user.username.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium text-sm">{activeReel?.user.username}</p>
                    <p className="text-sm">{activeReel?.content}</p>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>2d</span>
                    <span>Like</span>
                    <span>Reply</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium text-sm">cricket_fan_2023</p>
                    <p className="text-sm">Great reel! Love the batting technique 🏏</p>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>1d</span>
                    <span>Like</span>
                    <span>Reply</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium text-sm">cricket_legend</p>
                    <p className="text-sm">Keep up the good work! 👍</p>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>12h</span>
                    <span>Like</span>
                    <span>Reply</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comment input - Instagram style */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImage} />
              <AvatarFallback>{user?.username?.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Input
              className="flex-1"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button 
              type="submit" 
              variant="ghost" 
              size="sm"
              disabled={!commentText.trim() || isSavingComment}
              className="text-primary font-semibold"
            >
              {isSavingComment ? 
                <Loader2 className="h-4 w-4 animate-spin" /> : 
                'Post'
              }
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Instagram-style share dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share to</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">DM</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <Facebook className="h-6 w-6" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <Twitter className="h-6 w-6" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <Link className="h-6 w-6" />
              <span className="text-xs">Copy Link</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <Users className="h-6 w-6" />
              <span className="text-xs">Group</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <Trophy className="h-6 w-6" />
              <span className="text-xs">Team</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <Mail className="h-6 w-6" />
              <span className="text-xs">Email</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-3 gap-2">
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-xs">More</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}