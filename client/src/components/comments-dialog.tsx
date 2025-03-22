import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Comment, Post, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Heart, Trash2, MoreHorizontal, AlertCircle, Loader2, Reply, MessageSquare, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post & {
    user: User;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
  };
}

export function CommentsDialog({ open, onOpenChange, post }: CommentsDialogProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<Comment & { user: User } | null>(null);
  const [likedComments, setLikedComments] = useState<number[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading, error } = useQuery<(Comment & { user: User })[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: open, // Only fetch when dialog is open
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${post.id}/comments`, { content: comment });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest("DELETE", `/api/posts/${post.id}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      // In a real app this would call the API to like the comment
      return commentId;
    },
    onSuccess: (commentId) => {
      // Toggle like status
      setLikedComments(prev => 
        prev.includes(commentId) 
          ? prev.filter(id => id !== commentId) 
          : [...prev, commentId]
      );
      toast({
        title: "Success",
        description: likedComments.includes(commentId) 
          ? "Comment unliked" 
          : "Comment liked"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive"
      });
    }
  });

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      // If replying to a comment, include that info in the comment
      let finalComment = comment;
      if (replyTo) {
        finalComment = `@${replyTo.user.username} ${comment}`;
      }
      
      setComment(finalComment);
      commentMutation.mutate();
      setReplyTo(null);
    }
  };

  const handleReply = (comment: Comment & { user: User }) => {
    setReplyTo(comment);
    setComment(`@${comment.user.username} `);
    commentInputRef.current?.focus();
  };

  const handleLikeComment = (commentId: number) => {
    likeCommentMutation.mutate(commentId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 h-[80vh] max-h-[600px] flex flex-col">
        <DialogHeader className="px-4 py-2 border-b">
          <DialogTitle className="text-lg font-semibold">Comments</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-red-600 font-medium">Failed to load comments</p>
              <p className="text-sm text-neutral-500">Please try again later</p>
            </div>
          ) : comments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-neutral-600 font-medium">No comments yet</p>
              <p className="text-sm text-neutral-500">Be the first to comment on this post</p>
            </div>
          ) : (
            comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Link href={`/profile/${comment.user.username}`}>
                  <Avatar className="h-8 w-8 mt-0.5 cursor-pointer flex-shrink-0">
                    <AvatarImage 
                      src={comment.user.profileImage || "https://github.com/shadcn.png"} 
                      alt={comment.user.username} 
                    />
                    <AvatarFallback>
                      {comment.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/profile/${comment.user.username}`}>
                        <span className="font-semibold text-sm mr-2 cursor-pointer">
                          {comment.user.username}
                        </span>
                      </Link>
                      <span className="text-sm">{comment.content}</span>
                    </div>
                    
                    {user?.id === comment.userId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 rounded-full hover:bg-neutral-100 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Comment options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-1 space-x-4">
                    <p className="text-xs text-neutral-500">
                      {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'just now'}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-4 p-0 text-xs flex items-center gap-1 hover:text-primary ${likedComments.includes(comment.id) ? 'text-red-500' : ''}`}
                      onClick={() => handleLikeComment(comment.id)}
                    >
                      <Heart className={`h-3 w-3 ${likedComments.includes(comment.id) ? 'fill-red-500' : ''}`} />
                      {likedComments.includes(comment.id) ? 'Liked' : 'Like'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-4 p-0 text-xs text-neutral-500 hover:text-primary"
                      onClick={() => handleReply(comment)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {replyTo && (
          <div className="px-4 py-2 border-t flex items-center bg-neutral-50">
            <p className="text-sm text-neutral-600 flex-1">
              Replying to <span className="font-semibold text-primary">@{replyTo.user.username}</span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6"
              onClick={() => {
                setReplyTo(null);
                setComment("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <form 
          className="flex items-center w-full p-3 border-t mt-auto"
          onSubmit={handleComment}
        >
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage 
              src={user?.profileImage || "https://github.com/shadcn.png"} 
              alt={user?.username || "User"} 
            />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <Input 
            ref={commentInputRef}
            type="text" 
            placeholder={replyTo ? `Reply to ${replyTo.user.username}...` : "Add a comment..."} 
            className="flex-grow bg-transparent text-sm border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button 
            variant="ghost"
            size="sm"
            className="text-primary font-semibold text-sm ml-2"
            type="submit"
            disabled={!comment.trim() || commentMutation.isPending}
          >
            {commentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Post"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}