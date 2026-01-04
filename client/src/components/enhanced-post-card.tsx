import { useState, useRef, useEffect } from "react";
import { 
  Heart, MessageCircle, Send, Bookmark, BookmarkCheck, MoreHorizontal, 
  Play, Volume2, VolumeX, Share2, Users, Trophy, Tag, 
  MapPin, Clock, Check, Copy, Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Post, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PostCardProps {
  post: Post & { 
    user: User;
    likeCount: number;
    commentCount: number;
    isLiked?: boolean;
    hasLiked?: boolean;
    isSaved?: boolean;
  };
  onCommentClick?: () => void;
  showComments?: boolean;
  className?: string;
}

export function EnhancedPostCard({ post, onCommentClick, showComments = true, className = "" }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLiked, setIsLiked] = useState(post.isLiked ?? post.hasLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [comment, setComment] = useState("");
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync state with props
  useEffect(() => {
    setIsLiked(post.isLiked ?? post.hasLiked ?? false);
    setLikeCount(post.likeCount);
    setIsSaved(post.isSaved ?? false);
  }, [post.isLiked, post.hasLiked, post.likeCount, post.isSaved]);

  // Fetch recent comments
  const { data: recentComments = [] } = useQuery<any[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: showComments && post.commentCount > 0
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/posts/${post.id}/like`);
        return false;
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/like`);
        return true;
      }
    },
    onMutate: () => {
      const prev = { isLiked, likeCount };
      setIsLiked(!isLiked);
      setLikeCount(c => isLiked ? c - 1 : c + 1);
      return prev;
    },
    onError: (_, __, context: any) => {
      if (context) {
        setIsLiked(context.isLiked);
        setLikeCount(context.likeCount);
      }
      toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest("DELETE", `/api/posts/${post.id}/save`);
        return false;
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/save`);
        return true;
      }
    },
    onMutate: () => {
      const prev = isSaved;
      setIsSaved(!isSaved);
      return prev;
    },
    onSuccess: (saved) => {
      toast({ title: saved ? "Saved!" : "Removed", description: saved ? "Added to your collection" : "Removed from saved" });
    },
    onError: (_, __, context) => {
      if (context !== undefined) setIsSaved(context as boolean);
      toast({ title: "Error", description: "Failed to save post", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/saved"] });
    }
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Posted!", description: "Your comment has been added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
    }
  });

  const handleDoubleTap = () => {
    if (!isLiked) {
      setShowHeartAnimation(true);
      likeMutation.mutate();
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate(comment.trim());
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      setHasCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleShareExternal = (platform: string) => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = post.content || "Check out this cricket post!";
    let shareUrl = "";
    
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
    }
    
    if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400");
    setShowShareDialog(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Just now";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const isVideo = post.videoUrl || post.imageUrl?.match(/\.(mp4|mov|webm)$/i);
  const mediaUrl = post.videoUrl || post.imageUrl;

  const getCategoryStyle = (cat: string) => {
    const styles: Record<string, string> = {
      match_discussion: "bg-blue-500/10 text-blue-600 border-blue-200",
      player_highlight: "bg-purple-500/10 text-purple-600 border-purple-200",
      team_news: "bg-green-500/10 text-green-600 border-green-200",
      opinion: "bg-orange-500/10 text-orange-600 border-orange-200",
      meme: "bg-pink-500/10 text-pink-600 border-pink-200",
      reel: "bg-red-500/10 text-red-600 border-red-200",
    };
    return styles[cat] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <article className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md ${className}`}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.username}`}>
            <div className="relative">
              <Avatar className="h-11 w-11 ring-2 ring-offset-2 ring-orange-400/50 cursor-pointer">
                <AvatarImage src={post.user.profileImage || ""} alt={post.user.username} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white font-semibold">
                  {post.user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {post.user.verificationBadge && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
          </Link>
          <div>
            <Link href={`/profile/${post.user.username}`}>
              <span className="font-semibold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer">
                {post.user.username}
              </span>
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{formatDate(post.createdAt)}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{post.location}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" /> Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-4 w-4 mr-2" /> Share
            </DropdownMenuItem>
            {user?.id === post.userId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Category Tags */}
      {(post.category || post.matchId || post.teamId) && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {post.category && (
            <Badge variant="outline" className={`${getCategoryStyle(post.category)} text-xs font-medium`}>
              <Tag className="h-3 w-3 mr-1" />
              {post.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
          )}
          {post.matchId && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs">
              <Trophy className="h-3 w-3 mr-1" /> Match
            </Badge>
          )}
          {post.teamId && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs">
              <Users className="h-3 w-3 mr-1" /> Team
            </Badge>
          )}
        </div>
      )}

      {/* Media Content */}
      {mediaUrl && (
        <div className="relative w-full aspect-square bg-slate-100 overflow-hidden" onDoubleClick={handleDoubleTap}>
          {isVideo ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover cursor-pointer"
                loop
                muted={isMuted}
                playsInline
                poster={post.thumbnailUrl || ""}
                onClick={handleVideoClick}
              >
                <source src={mediaUrl} type="video/mp4" />
              </video>
              
              {/* Video Controls */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-black/60 border-0 text-white hover:bg-black/80 rounded-full"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>

              {/* Play Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                    <Play className="h-10 w-10 text-white fill-white" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt="Post"
              className="w-full h-full object-cover transition-transform hover:scale-[1.02]"
              loading="lazy"
            />
          )}

          {/* Heart Animation */}
          {showHeartAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="h-24 w-24 text-white fill-white animate-ping drop-shadow-lg" />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full transition-all ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-slate-600 hover:text-red-500'}`}
              onClick={() => likeMutation.mutate()}
            >
              <Heart className={`h-6 w-6 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-slate-600 hover:text-blue-500"
              onClick={onCommentClick}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-slate-600 hover:text-green-500"
              onClick={() => setShowShareDialog(true)}
            >
              <Send className="h-6 w-6" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full transition-all ${isSaved ? 'text-amber-500' : 'text-slate-600 hover:text-amber-500'}`}
            onClick={() => saveMutation.mutate()}
          >
            {isSaved ? <BookmarkCheck className="h-6 w-6 fill-current" /> : <Bookmark className="h-6 w-6" />}
          </Button>
        </div>

        {/* Like Count */}
        <div className="mb-2">
          <span className="font-semibold text-slate-900">
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
          </span>
        </div>

        {/* Caption */}
        {post.content && (
          <p className="text-slate-800 mb-2 leading-relaxed">
            <Link href={`/profile/${post.user.username}`}>
              <span className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer mr-2">
                {post.user.username}
              </span>
            </Link>
            {post.content}
          </p>
        )}

        {/* Comments Preview */}
        {showComments && post.commentCount > 0 && (
          <div className="space-y-1">
            <button
              className="text-slate-500 text-sm hover:text-slate-700 transition-colors"
              onClick={onCommentClick}
            >
              View all {post.commentCount} comments
            </button>
            {recentComments.slice(0, 2).map((c: any) => (
              <p key={c.id} className="text-sm">
                <span className="font-semibold text-slate-900 mr-1">{c.user?.username}</span>
                <span className="text-slate-700">{c.content}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Add Comment */}
      {user && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <form onSubmit={handleComment} className="flex items-center gap-3 pt-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user.profileImage || ""} />
              <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Input
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border-0 bg-slate-50 rounded-full px-4 h-9 text-sm focus-visible:ring-1 focus-visible:ring-orange-400"
              disabled={commentMutation.isPending}
            />
            {comment.trim() && (
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-orange-500 font-semibold hover:text-orange-600"
                disabled={commentMutation.isPending}
              >
                Post
              </Button>
            )}
          </form>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Share Post</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            <button onClick={() => handleShareExternal("twitter")} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-xs text-slate-600">X</span>
            </button>
            <button onClick={() => handleShareExternal("facebook")} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50">
              <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-xs text-slate-600">Facebook</span>
            </button>
            <button onClick={() => handleShareExternal("whatsapp")} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50">
              <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-slate-600">WhatsApp</span>
            </button>
            <button onClick={handleCopyLink} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50">
              <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                {hasCopied ? <Check className="h-6 w-6 text-white" /> : <Copy className="h-6 w-6 text-white" />}
              </div>
              <span className="text-xs text-slate-600">{hasCopied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
