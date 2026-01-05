import { useState, useRef, useEffect, useCallback, memo } from "react";
import { 
  Heart, MessageCircle, Send, Bookmark, Music, Volume2, VolumeX, 
  MoreHorizontal, Play, Pause, Share2, Flag, UserPlus, Eye, 
  Download, Link2, Copy, X, ThumbsUp, Reply, AtSign
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { VerificationBadge } from "@/components/verification-badge";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// Helper function to parse and render @mentions
function parseMentions(text: string): { type: 'text' | 'mention'; content: string }[] {
  const parts: { type: 'text' | 'mention'; content: string }[] = [];
  const mentionRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // Add mention
    parts.push({ type: 'mention', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

// Component to render text with clickable @mentions
function MentionText({ text, className }: { text: string; className?: string }) {
  const parts = parseMentions(text);
  
  return (
    <span className={className}>
      {parts.map((part, index) => 
        part.type === 'mention' ? (
          <Link key={index} href={`/profile/${part.content}`}>
            <span className="text-blue-400 hover:underline cursor-pointer">
              @{part.content}
            </span>
          </Link>
        ) : (
          <span key={index}>{part.content}</span>
        )
      )}
    </span>
  );
}

interface ReelUser {
  id: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  verificationBadge?: boolean;
  isPlayer?: boolean;
}

interface ReelData {
  id: number;
  userId: number;
  content: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  category: string | null;
  matchId: string | null;
  teamId: string | null;
  playerId: string | null;
  createdAt: string;
  user: ReelUser;
  likeCount: number;
  commentCount: number;
  viewsCount?: number;
  isLiked: boolean;
  hasLiked?: boolean;
  isSaved: boolean;
}

interface ReelCardEnhancedProps {
  reel: ReelData;
  isActive: boolean;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
}

export const ReelCardEnhanced = memo(function ReelCardEnhanced({ 
  reel, 
  isActive, 
  onVideoRef 
}: ReelCardEnhancedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [isLiked, setIsLiked] = useState(reel.isLiked || reel.hasLiked || false);
  const [likeCount, setLikeCount] = useState(reel.likeCount || 0);
  const [commentCount, setCommentCount] = useState(reel.commentCount || 0);
  const [isSaved, setIsSaved] = useState(reel.isSaved || false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [comment, setComment] = useState("");
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  const [commentLikes, setCommentLikes] = useState<Record<number, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<number, number>>({});
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);

  const videoSrc = reel.videoUrl || reel.imageUrl || "";

  // Fetch comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["/api/posts", reel.id, "comments"],
    queryFn: getQueryFn(`/api/posts/${reel.id}/comments`),
    enabled: showComments,
  });

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
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLikeCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reels/feed"] });
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
    onMutate: () => setIsSaved(!isSaved),
    onError: () => setIsSaved(isSaved),
    onSuccess: (saved) => {
      toast({ title: saved ? "Saved to collection" : "Removed from collection" });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${reel.id}/comments`, { content });
    },
    onSuccess: () => {
      setComment("");
      setCommentCount(prev => prev + 1);
      refetchComments();
    }
  });

  // Comment like mutation
  const commentLikeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: number; isLiked: boolean }) => {
      if (isLiked) {
        return await apiRequest("DELETE", `/api/reels/${reel.id}/comments/${commentId}/like`);
      } else {
        return await apiRequest("POST", `/api/reels/${reel.id}/comments/${commentId}/like`);
      }
    },
    onMutate: ({ commentId, isLiked }) => {
      setCommentLikes(prev => ({ ...prev, [commentId]: !isLiked }));
      setCommentLikeCounts(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + (isLiked ? -1 : 1)
      }));
    },
    onError: (_, { commentId, isLiked }) => {
      setCommentLikes(prev => ({ ...prev, [commentId]: isLiked }));
      setCommentLikeCounts(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + (isLiked ? 1 : -1)
      }));
    }
  });

  // Reply to comment mutation
  const replyMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      return await apiRequest("POST", `/api/reels/${reel.id}/comments/${commentId}/reply`, { content });
    },
    onSuccess: () => {
      setComment("");
      setReplyingTo(null);
      setCommentCount(prev => prev + 1);
      refetchComments();
      toast({ title: "Reply posted!" });
    },
    onError: () => {
      toast({ title: "Failed to post reply", variant: "destructive" });
    }
  });

  const viewMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/reels/${reel.id}/view`)
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${reel.user?.id}/follow`);
      return true;
    },
    onSuccess: () => {
      setIsFollowing(true);
      toast({ title: `Following @${reel.user?.username}` });
    }
  });

  // Record view when active
  useEffect(() => {
    if (isActive && !viewRecorded) {
      viewMutation.mutate();
      setViewRecorded(true);
    }
  }, [isActive, viewRecorded]);

  // Video playback control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (onVideoRef) onVideoRef(video);
    
    if (isActive) {
      video.currentTime = 0;
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, onVideoRef]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration && !isNaN(video.duration)) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const updateBuffered = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => setVideoError(true);

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("progress", updateBuffered);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("progress", updateBuffered);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
    };
  }, []);

  // Handlers
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    
    // Double tap to like
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        setShowHeartAnimation(true);
        likeMutation.mutate();
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    } else {
      // Single tap to play/pause
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }
    }
    lastTapRef.current = now;
  }, [isLiked, likeMutation]);

  const handleLongPressStart = useCallback(() => {
    longPressRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        video.pause();
      }
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    const video = videoRef.current;
    if (video && video.paused && isActive) {
      video.play();
    }
  }, [isActive]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    video.currentTime = percentage * video.duration;
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/reels?id=${reel.id}`);
    toast({ title: "Link copied!" });
    setShowShareSheet(false);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    if (replyingTo) {
      replyMutation.mutate({ commentId: replyingTo.id, content: comment.trim() });
    } else {
      commentMutation.mutate(comment.trim());
    }
  };

  const handleReply = (commentId: number, username: string) => {
    setReplyingTo({ id: commentId, username });
    setComment(`@${username} `);
  };

  const handleLikeComment = (commentId: number) => {
    const isCurrentlyLiked = commentLikes[commentId] || false;
    commentLikeMutation.mutate({ commentId, isLiked: isCurrentlyLiked });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setComment("");
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden snap-start">
      {/* Video */}
      {videoSrc && !videoError ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          onClick={handleVideoClick}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          poster={reel.thumbnailUrl || undefined}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc} type="video/webm" />
        </video>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
          <p className="text-white mb-2">Video unavailable</p>
        </div>
      )}

      {/* Progress Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10 cursor-pointer"
        onClick={handleSeek}
      >
        <div className="h-full bg-white/30 transition-all" style={{ width: `${buffered}%` }} />
        <div className="h-full bg-white absolute top-0 left-0 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Double-tap Heart Animation */}
      <AnimatePresence>
        {showHeartAnimation && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Heart className="h-32 w-32 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Indicator */}
      <AnimatePresence>
        {!isPlaying && isActive && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-6">
              <Play className="h-16 w-16 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-[5]" />

      {/* Bottom Info */}
      <div className="absolute bottom-20 left-4 right-20 text-white z-10">
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-3">
          <Link href={`/profile/${reel.user?.username || ""}`}>
            <Avatar className="h-12 w-12 border-2 border-white ring-2 ring-pink-500 ring-offset-2 ring-offset-black">
              <AvatarImage src={reel.user?.profileImage || ""} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {(reel.user?.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Link href={`/profile/${reel.user?.username || ""}`}>
                <span className="font-bold hover:underline">{reel.user?.username || "Unknown"}</span>
              </Link>
              {reel.user?.verificationBadge && <VerificationBadge type="verified" size="sm" />}
              {!isFollowing && reel.user?.id !== user?.id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-3 text-xs border-white/50 text-white hover:bg-white/20"
                  onClick={() => followMutation.mutate()}
                >
                  Follow
                </Button>
              )}
            </div>
            <span className="text-white/70 text-xs">
              {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Caption */}
        {reel.content && (
          <div className="mb-3">
            <p 
              className={cn("text-sm", !showCaption && "line-clamp-2")}
              onClick={() => setShowCaption(!showCaption)}
            >
              {reel.content}
            </p>
            {reel.content.length > 100 && (
              <button 
                className="text-white/60 text-xs mt-1"
                onClick={() => setShowCaption(!showCaption)}
              >
                {showCaption ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Category Badge */}
        {reel.category && reel.category !== "reel" && (
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs mb-3">
            {reel.category.replace(/_/g, " ").toUpperCase()}
          </Badge>
        )}

        {/* Music */}
        <div className="flex items-center bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
          <Music className="h-4 w-4 mr-2 animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-sm truncate max-w-[180px]">Original audio</span>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="absolute bottom-20 right-3 flex flex-col items-center space-y-5 z-10">
        {/* Like */}
        <motion.div className="flex flex-col items-center" whileTap={{ scale: 0.9 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
            onClick={() => likeMutation.mutate()}
          >
            <Heart className={cn("h-7 w-7 transition-all", isLiked ? "text-red-500 fill-red-500 scale-110" : "text-white")} />
          </Button>
          <span className="text-white text-xs mt-1 font-medium">{formatCount(likeCount)}</span>
        </motion.div>

        {/* Comment */}
        <motion.div className="flex flex-col items-center" whileTap={{ scale: 0.9 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
            onClick={() => setShowComments(true)}
          >
            <MessageCircle className="h-7 w-7 text-white" />
          </Button>
          <span className="text-white text-xs mt-1 font-medium">{formatCount(commentCount)}</span>
        </motion.div>

        {/* Share */}
        <motion.div className="flex flex-col items-center" whileTap={{ scale: 0.9 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
            onClick={() => setShowShareSheet(true)}
          >
            <Send className="h-7 w-7 text-white" />
          </Button>
          <span className="text-white text-xs mt-1">Share</span>
        </motion.div>

        {/* Save */}
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50"
            onClick={() => saveMutation.mutate()}
          >
            <Bookmark className={cn("h-7 w-7 transition-all", isSaved ? "text-yellow-400 fill-yellow-400" : "text-white")} />
          </Button>
        </motion.div>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50">
              <MoreHorizontal className="h-7 w-7 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={copyLink}>
              <Link2 className="h-4 w-4 mr-2" /> Copy link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" /> Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Flag className="h-4 w-4 mr-2" /> Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mute Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
          onClick={handleMuteToggle}
        >
          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </Button>
      </div>

      {/* View Count */}
      <div className="absolute top-16 right-4 flex items-center text-white/80 text-sm bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
        <Eye className="h-4 w-4 mr-1.5" />
        {formatCount(reel.viewsCount || 0)} views
      </div>

      {/* Comments Sheet */}
      <Sheet open={showComments} onOpenChange={(open) => {
        setShowComments(open);
        if (!open) {
          setReplyingTo(null);
          setComment("");
        }
      }}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-center">Comments ({commentCount})</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-140px)] py-4">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-500">
                <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4 px-4">
                {comments.map((c: any) => {
                  const isCommentLiked = commentLikes[c.id] || false;
                  const likeCount = commentLikeCounts[c.id] ?? (c.likeCount || 0);
                  
                  return (
                    <div key={c.id} className="flex space-x-3">
                      <Link href={`/profile/${c.user?.username || ""}`}>
                        <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all">
                          <AvatarImage src={c.user?.profileImage || ""} />
                          <AvatarFallback>{(c.user?.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Link href={`/profile/${c.user?.username || ""}`}>
                            <span className="font-semibold text-sm hover:underline cursor-pointer">
                              {c.user?.username}
                            </span>
                          </Link>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {/* Comment content with @mention support */}
                        <MentionText text={c.content} className="text-sm mt-1 block" />
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <button 
                            className={cn(
                              "flex items-center space-x-1 hover:text-gray-700 transition-colors",
                              isCommentLiked && "text-red-500 hover:text-red-600"
                            )}
                            onClick={() => handleLikeComment(c.id)}
                          >
                            <Heart className={cn("h-3.5 w-3.5", isCommentLiked && "fill-current")} />
                            <span>{likeCount > 0 ? likeCount : "Like"}</span>
                          </button>
                          <button 
                            className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                            onClick={() => handleReply(c.id, c.user?.username || "")}
                          >
                            <Reply className="h-3.5 w-3.5" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          {user && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
              {/* Reply indicator */}
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Replying to <span className="text-blue-500">@{replyingTo.username}</span>
                  </span>
                  <button onClick={cancelReply} className="text-gray-500 hover:text-gray-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <form onSubmit={handleComment} className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.profileImage || ""} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Input 
                    placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."} 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    className="pr-10" 
                  />
                  {comment.includes("@") && (
                    <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  )}
                </div>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!comment.trim() || commentMutation.isPending || replyMutation.isPending}
                >
                  {replyingTo ? "Reply" : "Post"}
                </Button>
              </form>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Share Sheet */}
      <Sheet open={showShareSheet} onOpenChange={setShowShareSheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-center">Share</SheetTitle>
          </SheetHeader>
          <div className="py-6 px-4">
            {/* Quick Share Options */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button className="flex flex-col items-center space-y-2" onClick={copyLink}>
                <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Copy className="h-6 w-6" />
                </div>
                <span className="text-xs">Copy Link</span>
              </button>
              <button 
                className="flex flex-col items-center space-y-2"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this reel! ${window.location.origin}/reels?id=${reel.id}`)}`, "_blank")}
              >
                <div className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs">WhatsApp</span>
              </button>
              <button 
                className="flex flex-col items-center space-y-2"
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/reels?id=${reel.id}`)}&text=${encodeURIComponent("Check out this cricket reel! 🏏")}`, "_blank")}
              >
                <div className="h-14 w-14 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white font-bold text-xl">𝕏</span>
                </div>
                <span className="text-xs">Twitter</span>
              </button>
              <button 
                className="flex flex-col items-center space-y-2"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/reels?id=${reel.id}`)}`, "_blank")}
              >
                <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">f</span>
                </div>
                <span className="text-xs">Facebook</span>
              </button>
            </div>

            {/* Share to DM */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-3">Share to message</p>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <Input placeholder="Search users..." className="flex-1" />
                <Button size="sm">Send</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});

export default ReelCardEnhanced;
