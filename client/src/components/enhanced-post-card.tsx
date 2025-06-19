import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Pause, Volume2, VolumeX, Share2, Users, Trophy, Zap, Target, Award } from "lucide-react";
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
import { VerificationBadge } from "@/components/verification-badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  post: Post & { 
    user: User;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
    isSaved: boolean;
  };
  onCommentClick?: () => void;
  showComments?: boolean;
  className?: string;
}

export function EnhancedPostCard({ post, onCommentClick, showComments = true, className = "" }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isDoubleTapActive, setIsDoubleTapActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch recent comments for preview
  const { data: recentComments = [] } = useQuery({
    queryKey: [`/api/posts/${post.id}/comments`],
    queryFn: getQueryFn(),
    enabled: showComments && post.commentCount > 0
  });

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
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikeCount(likeCount);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  });

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
      setIsSaved(!isSaved);
    },
    onError: () => {
      setIsSaved(isSaved);
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive"
      });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      setComment("");
      setIsCommenting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    }
  });

  const handleDoubleClick = () => {
    if (!isLiked) {
      setIsDoubleTapActive(true);
      likeMutation.mutate();
      setTimeout(() => setIsDoubleTapActive(false), 1000);
    }
  };

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

  const handleShare = async () => {
    const shareData = {
      title: `${post.user.username}'s post`,
      text: post.content || 'Check out this cricket post!',
      url: `${window.location.origin}/posts/${post.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        setShowShareDialog(true);
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Link copied to clipboard"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const isVideo = post.imageUrl?.includes('.mp4') || post.imageUrl?.includes('.mov') || post.imageUrl?.includes('.webm');

  return (
    <article className={`bg-white border-b border-gray-200 ${className}`}>
      {/* Header */}
      <header className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.user.username}`} className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.user.profileImage || ""} alt={post.user.username} />
              <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold text-gray-900">{post.user.username}</span>
              {(post.user as any).isVerified && <VerificationBadge type="verified" size="sm" />}
              {(post.user as any).isPlayer && <VerificationBadge type="professional" size="sm" />}
            </div>
          </Link>
          <span className="text-gray-500">•</span>
          <time className="text-sm text-gray-500">{formatDate(post.createdAt)}</time>
        </div>

        <DropdownMenu open={showMoreOptions} onOpenChange={setShowMoreOptions}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user?.id === post.userId ? (
              <>
                <DropdownMenuItem>Edit post</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete post</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem>Report post</DropdownMenuItem>
                <DropdownMenuItem>Hide post</DropdownMenuItem>
                <DropdownMenuItem>Unfollow @{post.user.username}</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleShare}>Share post</DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/posts/${post.id}`)}>
              Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Media Content */}
      {post.imageUrl && (
        <div className="relative">
          {isVideo ? (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full aspect-square object-cover cursor-pointer"
                loop
                muted={isMuted}
                playsInline
                onClick={handleVideoClick}
                onDoubleClick={handleDoubleClick}
              >
                <source src={post.imageUrl} type="video/mp4" />
              </video>
              
              {/* Video Controls */}
              <div className="absolute bottom-3 right-3 flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-black/50 border-0 text-white hover:bg-black/70"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>

              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!isPlaying && (
                  <div className="bg-black/50 rounded-full p-3">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full aspect-square object-cover cursor-pointer"
              onDoubleClick={handleDoubleClick}
            />
          )}

          {/* Double-tap heart animation */}
          {isDoubleTapActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="h-20 w-20 text-red-500 fill-red-500 animate-ping" />
            </div>
          )}

          {/* Cricket-specific badges overlay */}
          {(post.category || post.matchId || post.teamId) && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {post.category && (
                <Badge className="bg-orange-500/90 text-white border-0 text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {post.category.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
              {post.matchId && (
                <Badge className="bg-blue-500/90 text-white border-0 text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  Match {post.matchId}
                </Badge>
              )}
              {post.teamId && (
                <Badge className="bg-green-500/90 text-white border-0 text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Team {post.teamId}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
            onClick={() => likeMutation.mutate()}
          >
            <Heart className={`h-6 w-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-700'} transition-colors`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
            onClick={onCommentClick}
          >
            <MessageCircle className="h-6 w-6 text-gray-700" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-transparent"
            onClick={handleShare}
          >
            <Send className="h-6 w-6 text-gray-700" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-transparent"
          onClick={() => saveMutation.mutate()}
        >
          <Bookmark className={`h-6 w-6 ${isSaved ? 'text-gray-900 fill-gray-900' : 'text-gray-700'} transition-colors`} />
        </Button>
      </div>

      {/* Like Count */}
      {likeCount > 0 && (
        <div className="px-3 pb-1">
          <span className="text-sm font-semibold text-gray-900">
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
          </span>
        </div>
      )}

      {/* Caption */}
      {post.content && (
        <div className="px-3 pb-1">
          <p className="text-sm">
            <Link href={`/profile/${post.user.username}`}>
              <span className="font-semibold text-gray-900">{post.user.username}</span>
            </Link>
            <span className="ml-2 text-gray-900">{post.content}</span>
          </p>
        </div>
      )}

      {/* Comments Preview */}
      {showComments && post.commentCount > 0 && (
        <div className="px-3 pb-1">
          {post.commentCount > 2 && (
            <button
              className="text-sm text-gray-500 mb-1 block"
              onClick={onCommentClick}
            >
              View all {post.commentCount} comments
            </button>
          )}
          {recentComments?.map((comment: any) => (
            <p key={comment.id} className="text-sm mb-1">
              <Link href={`/profile/${comment.user.username}`}>
                <span className="font-semibold text-gray-900">{comment.user.username}</span>
              </Link>
              <span className="ml-2 text-gray-900">{comment.content}</span>
            </p>
          ))}
        </div>
      )}

      {/* Add Comment */}
      {user && (
        <div className="px-3 pb-3">
          <form onSubmit={handleComment} className="flex items-center space-x-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.profileImage || ""} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Input
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border-0 bg-transparent text-sm placeholder-gray-500 focus:ring-0 px-0"
              disabled={commentMutation.isPending}
            />
            {comment.trim() && (
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-blue-500 font-semibold hover:bg-transparent px-0"
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
            <DialogTitle>Share post</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                copyToClipboard(`${window.location.origin}/posts/${post.id}`);
                setShowShareDialog(false);
              }}
            >
              Copy link
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this cricket post by @${post.user.username}`)}&url=${encodeURIComponent(`${window.location.origin}/posts/${post.id}`)}`);
                setShowShareDialog(false);
              }}
            >
              Share on Twitter
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/posts/${post.id}`)}`);
                setShowShareDialog(false);
              }}
            >
              Share on Facebook
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}