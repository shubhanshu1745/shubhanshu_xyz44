import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Send, Share2, Bookmark, Music, Volume2, VolumeX, MoreHorizontal, Play, Pause, ArrowUp, ArrowDown, Trophy, Users, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Post, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { VerificationBadge } from "@/components/verification-badge";

interface ReelCardProps {
  reel: Post & { 
    user: User;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    isSaved: boolean;
  };
  isActive: boolean;
  onVideoRef: (ref: HTMLVideoElement | null) => void;
}

export function ReelCard({ reel, isActive, onVideoRef }: ReelCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [likeCount, setLikeCount] = useState(reel.likeCount);
  const [isSaved, setIsSaved] = useState(reel.isSaved);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDoubleTapActive, setIsDoubleTapActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mutations
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/posts/${reel.id}/like`);
        return false;
      } else {
        await apiRequest("POST", `/api/posts/${reel.id}/like`);
        return true;
      }
    },
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest("DELETE", `/api/posts/${reel.id}/save`);
        return false;
      } else {
        await apiRequest("POST", `/api/posts/${reel.id}/save`);
        return true;
      }
    },
    onMutate: () => {
      setIsSaved(!isSaved);
    },
    onError: () => {
      setIsSaved(isSaved);
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${reel.id}/comments`, { content });
    },
    onSuccess: () => {
      setComment("");
      setShowComments(false);
      queryClient.invalidateQueries({ queryKey: ["/api/posts", reel.id, "comments"] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted"
      });
    }
  });

  // Video controls
  useEffect(() => {
    if (videoRef.current) {
      onVideoRef(videoRef.current);
      
      if (isActive) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, onVideoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      setIsDoubleTapActive(true);
      likeMutation.mutate();
      setTimeout(() => setIsDoubleTapActive(false), 1000);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${reel.user.username}'s cricket reel`,
      text: reel.content || 'Check out this cricket reel!',
      url: `${window.location.origin}/reels/${reel.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback to copy
        navigator.clipboard.writeText(shareData.url);
        toast({ title: "Link copied to clipboard" });
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate(comment.trim());
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleClick}
      >
        <source src={reel.videoUrl || reel.imageUrl || ''} type="video/mp4" />
      </video>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Double-tap heart animation */}
      {isDoubleTapActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="h-20 w-20 text-red-500 fill-red-500 animate-ping" />
        </div>
      )}

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-4">
            <Play className="h-12 w-12 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Left side - User info and caption */}
      <div className="absolute bottom-6 left-4 right-20 text-white">
        {/* User info */}
        <div className="flex items-center space-x-3 mb-3">
          <Link href={`/profile/${reel.user.username}`}>
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={reel.user.profileImage || ""} alt={reel.user.username} />
              <AvatarFallback>{reel.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex items-center space-x-2">
            <Link href={`/profile/${reel.user.username}`}>
              <span className="font-semibold text-white">{reel.user.username}</span>
            </Link>
            {reel.user.verificationBadge && <VerificationBadge type="verified" size="sm" />}
            {reel.user.isPlayer && <VerificationBadge type="professional" size="sm" />}
            <span className="text-white/60">•</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white border border-white/60 hover:bg-white/20 h-7 px-3"
            >
              Follow
            </Button>
          </div>
        </div>

        {/* Caption */}
        {reel.content && (
          <p className="text-white mb-2 text-sm leading-relaxed">
            {reel.content}
          </p>
        )}

        {/* Cricket badges */}
        {(reel.category || reel.matchId || reel.teamId) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {reel.category && (
              <Badge className="bg-orange-500/80 text-white border-0 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {reel.category.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
            {reel.matchId && (
              <Badge className="bg-blue-500/80 text-white border-0 text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                Match {reel.matchId}
              </Badge>
            )}
            {reel.teamId && (
              <Badge className="bg-green-500/80 text-white border-0 text-xs">
                <Users className="h-3 w-3 mr-1" />
                Team {reel.teamId}
              </Badge>
            )}
          </div>
        )}

        {/* Music info */}
        <div className="flex items-center text-white/80 text-sm">
          <Music className="h-4 w-4 mr-2" />
          <span>Original audio • {reel.user.username}</span>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="absolute bottom-6 right-4 flex flex-col items-center space-y-6">
        {/* Like */}
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-12 p-0 hover:bg-white/20 rounded-full"
            onClick={() => likeMutation.mutate()}
          >
            <Heart className={`h-7 w-7 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </Button>
          {likeCount > 0 && (
            <span className="text-white text-xs font-semibold mt-1">
              {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
            </span>
          )}
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-12 p-0 hover:bg-white/20 rounded-full"
            onClick={() => setShowComments(true)}
          >
            <MessageCircle className="h-7 w-7 text-white" />
          </Button>
          {reel.commentCount > 0 && (
            <span className="text-white text-xs font-semibold mt-1">
              {reel.commentCount > 999 ? `${(reel.commentCount / 1000).toFixed(1)}K` : reel.commentCount}
            </span>
          )}
        </div>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          className="h-12 w-12 p-0 hover:bg-white/20 rounded-full"
          onClick={handleShare}
        >
          <Send className="h-7 w-7 text-white" />
        </Button>

        {/* Save */}
        <Button
          variant="ghost"
          size="sm"
          className="h-12 w-12 p-0 hover:bg-white/20 rounded-full"
          onClick={() => saveMutation.mutate()}
        >
          <Bookmark className={`h-7 w-7 ${isSaved ? 'text-white fill-white' : 'text-white'}`} />
        </Button>

        {/* More options */}
        <Button
          variant="ghost"
          size="sm"
          className="h-12 w-12 p-0 hover:bg-white/20 rounded-full"
        >
          <MoreHorizontal className="h-7 w-7 text-white" />
        </Button>

        {/* Mute toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:bg-white/20 rounded-full"
          onClick={handleMuteToggle}
        >
          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </Button>
      </div>

      {/* Comments overlay */}
      {showComments && (
        <div className="absolute inset-0 bg-black/50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-2/3 overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Comments</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(false)}
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {/* Comments would be loaded here */}
              <p className="text-gray-500 text-center py-8">No comments yet</p>
            </div>

            {/* Add comment */}
            {user && (
              <div className="p-4 border-t bg-gray-50">
                <form onSubmit={handleComment} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage || ""} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Input
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1"
                  />
                  {comment.trim() && (
                    <Button type="submit" size="sm">Post</Button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ReelsViewerProps {
  className?: string;
}

export function ReelsViewer({ className = "" }: ReelsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoRefs, setVideoRefs] = useState<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: reels, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["/api/reels"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/posts?type=reel&page=${pageParam}&limit=10`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch reels");
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 10 ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allReels = reels?.pages.flat() || [];

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < allReels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Fetch more when near the end
      if (currentIndex >= allReels.length - 3 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, allReels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleVideoRef = useCallback((index: number) => (ref: HTMLVideoElement | null) => {
    setVideoRefs(prev => {
      const newRefs = [...prev];
      newRefs[index] = ref;
      return newRefs;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleScroll('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleScroll('down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll]);

  // Touch/wheel navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let threshold = 50;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          handleScroll('down');
        } else {
          handleScroll('up');
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        handleScroll('down');
      } else {
        handleScroll('up');
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleScroll]);

  if (!allReels.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No reels available</p>
          <p className="text-gray-400">Check back later for cricket reels!</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`h-screen overflow-hidden ${className}`}>
      <div 
        className="transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateY(-${currentIndex * 100}vh)`,
          height: `${allReels.length * 100}vh`
        }}
      >
        {allReels.map((reel, index) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            isActive={index === currentIndex}
            onVideoRef={handleVideoRef(index)}
          />
        ))}
      </div>

      {/* Navigation indicators */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-black/30 text-white hover:bg-black/50 rounded-full"
          onClick={() => handleScroll('up')}
          disabled={currentIndex === 0}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-black/30 text-white hover:bg-black/50 rounded-full"
          onClick={() => handleScroll('down')}
          disabled={currentIndex === allReels.length - 1}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
        <div className="flex flex-col space-y-1">
          {allReels.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-6 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}