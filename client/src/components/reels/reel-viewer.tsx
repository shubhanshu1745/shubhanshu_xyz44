import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Heart, MessageCircle, Send, Bookmark, Music, Volume2, VolumeX, 
  MoreHorizontal, Play, Zap, Share2, Flag, UserPlus, Eye
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { VerificationBadge } from "@/components/verification-badge";
import { motion, AnimatePresence } from "framer-motion";

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

interface ReelCardProps {
  reel: ReelData;
  isActive: boolean;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
}

export function ReelCard({ reel, isActive, onVideoRef }: ReelCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(reel.isLiked || reel.hasLiked || false);
  const [likeCount, setLikeCount] = useState(reel.likeCount || 0);
  const [commentCount, setCommentCount] = useState(reel.commentCount || 0);
  const [isSaved, setIsSaved] = useState(reel.isSaved || false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDoubleTapActive, setIsDoubleTapActive] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);

  const videoSrc = reel.videoUrl || reel.imageUrl || '';

  // Debug log for video URL
  useEffect(() => {
    console.log('Reel video URL:', videoSrc, 'Reel ID:', reel.id);
  }, [videoSrc, reel.id]);

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["/api/posts", reel.id, "comments"],
    queryFn: getQueryFn(`/api/posts/${reel.id}/comments`),
    enabled: showComments,
  });

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
      toast({ title: saved ? "Saved" : "Removed" });
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
      toast({ title: "Comment posted" });
    }
  });

  const viewMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/reels/${reel.id}/view`)
  });

  useEffect(() => {
    if (isActive && !viewRecorded) {
      viewMutation.mutate();
      setViewRecorded(true);
    }
  }, [isActive, viewRecorded]);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration && !isNaN(video.duration)) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => setVideoError(true);

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        setIsDoubleTapActive(true);
        likeMutation.mutate();
        setTimeout(() => setIsDoubleTapActive(false), 1000);
      }
    } else {
      const video = videoRef.current;
      if (video) video.paused ? video.play() : video.pause();
    }
    lastTapRef.current = now;
  }, [isLiked, likeMutation]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/reels?id=${reel.id}`);
    toast({ title: "Link copied!" });
    setShowShareSheet(false);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) commentMutation.mutate(comment.trim());
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden snap-start">
      {videoSrc && !videoError ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          onClick={handleVideoClick}
          poster={reel.thumbnailUrl || undefined}
          onError={(e) => {
            console.error('Video error:', e, 'URL:', videoSrc);
            setVideoError(true);
          }}
          onLoadedData={() => {
            console.log('Video loaded successfully:', videoSrc);
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc} type="video/webm" />
          <source src={videoSrc} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
          <p className="text-white mb-2">Video unavailable</p>
          <p className="text-gray-400 text-sm">URL: {videoSrc || 'No URL'}</p>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10">
        <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence>
        {isDoubleTapActive && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
          >
            <Heart className="h-32 w-32 text-red-500 fill-red-500" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isPlaying && isActive && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-black/50 rounded-full p-6">
              <Play className="h-16 w-16 text-white fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none z-[5]" />

      <div className="absolute bottom-24 left-4 right-24 text-white z-10">
        <div className="flex items-center space-x-3 mb-3">
          <Link href={`/profile/${reel.user?.username || ''}`}>
            <Avatar className="h-12 w-12 border-2 border-white ring-2 ring-pink-500">
              <AvatarImage src={reel.user?.profileImage || ""} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                {(reel.user?.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <Link href={`/profile/${reel.user?.username || ''}`}>
                <span className="font-bold hover:underline">{reel.user?.username || 'Unknown'}</span>
              </Link>
              {reel.user?.verificationBadge && <VerificationBadge type="verified" size="sm" />}
            </div>
            <span className="text-white/70 text-xs">
              {formatDistanceToNow(new Date(reel.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {reel.content && <p className="mb-3 text-sm line-clamp-3">{reel.content}</p>}

        {reel.category && reel.category !== 'reel' && (
          <Badge className="bg-orange-500/90 text-white border-0 text-xs mb-3">
            <Zap className="h-3 w-3 mr-1" />
            {reel.category.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        )}

        <div className="flex items-center bg-black/40 rounded-full px-3 py-1.5 w-fit">
          <Music className="h-4 w-4 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-sm truncate max-w-[180px]">Original audio</span>
        </div>
      </div>

      <div className="absolute bottom-24 right-3 flex flex-col items-center space-y-4 z-10">
        <div className="flex flex-col items-center">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/20" onClick={() => likeMutation.mutate()}>
            <Heart className={`h-7 w-7 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </Button>
          <span className="text-white text-xs mt-1">{formatCount(likeCount)}</span>
        </div>

        <div className="flex flex-col items-center">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/20" onClick={() => setShowComments(true)}>
            <MessageCircle className="h-7 w-7 text-white" />
          </Button>
          <span className="text-white text-xs mt-1">{formatCount(commentCount)}</span>
        </div>

        <div className="flex flex-col items-center">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/20" onClick={() => setShowShareSheet(true)}>
            <Send className="h-7 w-7 text-white" />
          </Button>
          <span className="text-white text-xs mt-1">Share</span>
        </div>

        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/20" onClick={() => saveMutation.mutate()}>
          <Bookmark className={`h-7 w-7 ${isSaved ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/20">
              <MoreHorizontal className="h-7 w-7 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem><Flag className="h-4 w-4 mr-2" />Report</DropdownMenuItem>
            <DropdownMenuItem><UserPlus className="h-4 w-4 mr-2" />Follow</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyLink}><Share2 className="h-4 w-4 mr-2" />Copy link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/40" onClick={handleMuteToggle}>
          {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
        </Button>
      </div>

      <div className="absolute top-16 right-4 flex items-center text-white/80 text-sm bg-black/40 rounded-full px-3 py-1.5 z-10">
        <Eye className="h-4 w-4 mr-1.5" />
        {formatCount(reel.viewsCount || 0)} views
      </div>

      <Sheet open={showComments} onOpenChange={setShowComments}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-center">Comments ({commentCount})</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-140px)] py-4">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-500">
                <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
                <p>No comments yet</p>
              </div>
            ) : (
              <div className="space-y-4 px-4">
                {comments.map((c: any) => (
                  <div key={c.id} className="flex space-x-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.user?.profileImage || ""} />
                      <AvatarFallback>{(c.user?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">{c.user?.username}</span>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm mt-1">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {user && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
              <form onSubmit={handleComment} className="flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.profileImage || ""} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Input placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} className="flex-1" />
                <Button type="submit" size="sm" disabled={!comment.trim() || commentMutation.isPending}>Post</Button>
              </form>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={showShareSheet} onOpenChange={setShowShareSheet}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-center">Share</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-4 py-6 px-4">
            <button className="flex flex-col items-center space-y-2" onClick={copyLink}>
              <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Share2 className="h-6 w-6" />
              </div>
              <span className="text-xs">Copy Link</span>
            </button>
            <button className="flex flex-col items-center space-y-2" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${window.location.origin}/reels?id=${reel.id}`)}`, '_blank')}>
              <div className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs">WhatsApp</span>
            </button>
            <button className="flex flex-col items-center space-y-2" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/reels?id=${reel.id}`)}`, '_blank')}>
              <div className="h-14 w-14 rounded-full bg-black flex items-center justify-center">
                <span className="text-white font-bold">𝕏</span>
              </div>
              <span className="text-xs">Twitter</span>
            </button>
            <button className="flex flex-col items-center space-y-2" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/reels?id=${reel.id}`)}`, '_blank')}>
              <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">f</span>
              </div>
              <span className="text-xs">Facebook</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default ReelCard;
