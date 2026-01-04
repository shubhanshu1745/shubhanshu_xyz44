import { useState, useEffect } from "react";
import { 
  Heart, MessageCircle, Send, Bookmark, BookmarkCheck, MoreHorizontal, 
  Tag, Trophy, Users, Copy, Check, Trash2, 
  Share2, MapPin, Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Post, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PostCardProps = {
  post: Post & {
    user: User;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
    isSaved?: boolean;
  };
  onCommentClick?: () => void;
};

export function PostCard({ post, onCommentClick }: PostCardProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(post.hasLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check saved status on mount
  useEffect(() => {
    if (post.isSaved !== undefined) {
      setIsSaved(post.isSaved);
    }
  }, [post.isSaved]);

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
    onMutate: async () => {
      const previousIsLiked = isLiked;
      const previousLikeCount = likeCount;
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      return { previousIsLiked, previousLikeCount };
    },
    onError: (_error, _, context) => {
      if (context) {
        setIsLiked(context.previousIsLiked);
        setLikeCount(context.previousLikeCount);
      }
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
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
    onMutate: async () => {
      const previousIsSaved = isSaved;
      setIsSaved(!isSaved);
      return { previousIsSaved };
    },
    onSuccess: (saved) => {
      toast({
        title: saved ? "Saved" : "Removed",
        description: saved ? "Post saved to your collection" : "Post removed from saved"
      });
    },
    onError: (_error, _, context) => {
      if (context) {
        setIsSaved(context.previousIsSaved);
      }
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive"
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/saved"] });
    }
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${post.id}/comments`, { content: comment });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Deleted",
        description: "Post has been deleted"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  });

  const handleDoubleTap = () => {
    if (!isLiked) {
      setShowHeartAnimation(true);
      likeMutation.mutate();
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate();
    }
  };

  const handleCopyLink = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(postUrl);
      setHasCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleShareExternal = (platform: string) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const text = post.content || "Check out this cricket post!";
    let shareUrl = "";
    
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + postUrl)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
    setIsShareDialogOpen(false);
  };

  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "recently";

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      match_discussion: "bg-blue-500/10 text-blue-600 border-blue-200",
      player_highlight: "bg-purple-500/10 text-purple-600 border-purple-200",
      team_news: "bg-green-500/10 text-green-600 border-green-200",
      opinion: "bg-orange-500/10 text-orange-600 border-orange-200",
      meme: "bg-pink-500/10 text-pink-600 border-pink-200",
      highlights: "bg-amber-500/10 text-amber-600 border-amber-200",
    };
    return colors[category] || "bg-slate-500/10 text-slate-600 border-slate-200";
  };

  return (
    <>
      <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.user.username}`}>
              <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-offset-2 ring-gradient-to-r from-orange-400 to-pink-500 cursor-pointer">
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
            <div className="flex flex-col">
              <Link href={`/profile/${post.user.username}`}>
                <span className="font-semibold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer">
                  {post.user.username}
                </span>
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{formattedDate}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <MapPin className="h-3 w-3" />
                    <span>{post.location}</span>
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
              <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)} className="cursor-pointer">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              {user?.id === post.userId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteMutation.mutate()} 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Category Tags */}
        {post.category && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            <Badge variant="outline" className={`${getCategoryColor(post.category)} text-xs font-medium`}>
              <Tag className="h-3 w-3 mr-1" />
              {post.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
            {post.matchId && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                Match
              </Badge>
            )}
            {post.teamId && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs">
                <Users className="h-3 w-3 mr-1" />
                Team
              </Badge>
            )}
          </div>
        )}

        {/* Image */}
        {post.imageUrl && (
          <div 
            className="relative w-full aspect-square bg-slate-100 cursor-pointer overflow-hidden"
            onDoubleClick={handleDoubleTap}
          >
            <img 
              src={post.imageUrl}
              alt="Post" 
              className="w-full h-full object-cover transition-transform hover:scale-[1.02]"
              loading="lazy"
            />
            
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
                <Heart className={`h-6 w-6 transition-all ${isLiked ? 'fill-current scale-110' : ''}`} />
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
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full transition-all ${isSaved ? 'text-amber-500 hover:text-amber-600' : 'text-slate-600 hover:text-amber-500'}`}
              onClick={() => saveMutation.mutate()}
            >
              {isSaved ? (
                <BookmarkCheck className="h-6 w-6 fill-current" />
              ) : (
                <Bookmark className="h-6 w-6" />
              )}
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
            <p className="text-slate-800 mb-2">
              <Link href={`/profile/${post.user.username}`}>
                <span className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer mr-2">
                  {post.user.username}
                </span>
              </Link>
              {post.content}
            </p>
          )}

          {/* View Comments */}
          {post.commentCount > 0 && (
            <button 
              className="text-slate-500 text-sm hover:text-slate-700 transition-colors mb-2"
              onClick={onCommentClick}
            >
              View all {post.commentCount} comments
            </button>
          )}
        </div>

        {/* Add Comment */}
        <div className="px-4 pb-4 border-t border-slate-100">
          <form onSubmit={handleComment} className="flex items-center gap-3 pt-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user?.profileImage || ""} />
              <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <Input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border-0 bg-slate-50 rounded-full px-4 h-9 text-sm focus-visible:ring-1 focus-visible:ring-orange-400"
            />
            {comment.trim() && (
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-orange-500 font-semibold hover:text-orange-600 hover:bg-orange-50"
                disabled={commentMutation.isPending}
              >
                Post
              </Button>
            )}
          </form>
        </div>
      </article>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Share Post</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            <button
              onClick={() => handleShareExternal("twitter")}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-xs text-slate-600">X</span>
            </button>
            <button
              onClick={() => handleShareExternal("facebook")}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-xs text-slate-600">Facebook</span>
            </button>
            <button
              onClick={() => handleShareExternal("whatsapp")}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-slate-600">WhatsApp</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                {hasCopied ? <Check className="h-6 w-6 text-white" /> : <Copy className="h-6 w-6 text-white" />}
              </div>
              <span className="text-xs text-slate-600">{hasCopied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
