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
import { Heart, Trash2, MoreHorizontal, AlertCircle, Loader2, Reply, MessageSquare, X, ChevronDown, ChevronUp, Pin, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface EnrichedComment extends Omit<Comment, 'isPinned' | 'isEdited' | 'editedAt'> {
  user: User;
  likeCount: number;
  replyCount: number;
  hasLiked: boolean;
  isPinned?: boolean | null;
  isEdited?: boolean | null;
  editedAt?: string | Date | null;
}

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
  const [replyTo, setReplyTo] = useState<EnrichedComment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [editingComment, setEditingComment] = useState<EnrichedComment | null>(null);
  const [editContent, setEditContent] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading, error } = useQuery<EnrichedComment[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: open,
  });

  // Sort comments to show pinned first
  const sortedComments = comments?.slice().sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const payload: { content: string; parentId?: number } = { content: comment };
      if (replyTo) {
        payload.parentId = replyTo.id;
      }
      return await apiRequest("POST", `/api/posts/${post.id}/comments`, payload);
    },
    onSuccess: () => {
      setComment("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (replyTo) {
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments/${replyTo.id}/replies`] });
      }
      toast({
        title: replyTo ? "Reply added" : "Comment added",
        description: replyTo ? "Your reply has been added successfully" : "Your comment has been added successfully"
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  });

  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: number; isLiked: boolean }) => {
      if (isLiked) {
        return await apiRequest("DELETE", `/api/comments/${commentId}/like`);
      } else {
        return await apiRequest("POST", `/api/comments/${commentId}/like`);
      }
    },
    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      // Also invalidate replies if this is a reply
      sortedComments?.forEach(c => {
        if (c.replyCount > 0) {
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments/${c.id}/replies`] });
        }
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      return await apiRequest("PATCH", `/api/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      setEditingComment(null);
      setEditContent("");
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive"
      });
    }
  });

  // Pin comment mutation (only post owner)
  const pinCommentMutation = useMutation({
    mutationFn: async ({ commentId, isPinned }: { commentId: number; isPinned: boolean }) => {
      if (isPinned) {
        return await apiRequest("DELETE", `/api/comments/${commentId}/pin`);
      } else {
        return await apiRequest("POST", `/api/comments/${commentId}/pin`);
      }
    },
    onSuccess: (_, { isPinned }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      toast({
        title: isPinned ? "Comment unpinned" : "Comment pinned",
        description: isPinned ? "Comment has been unpinned" : "Comment has been pinned to the top"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pin status",
        variant: "destructive"
      });
    }
  });

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate();
    }
  };

  const handleReply = (comment: EnrichedComment) => {
    setReplyTo(comment);
    setComment(`@${comment.user.username} `);
    commentInputRef.current?.focus();
  };

  const handleEditComment = (comment: EnrichedComment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (editingComment && editContent.trim()) {
      editCommentMutation.mutate({ commentId: editingComment.id, content: editContent.trim() });
    }
  };

  const handlePinComment = (commentId: number, isPinned: boolean) => {
    pinCommentMutation.mutate({ commentId, isPinned });
  };

  const handleLikeComment = (commentId: number, isLiked: boolean) => {
    likeCommentMutation.mutate({ commentId, isLiked });
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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
          ) : sortedComments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-neutral-600 font-medium">No comments yet</p>
              <p className="text-sm text-neutral-500">Be the first to comment on this post</p>
            </div>
          ) : (
            sortedComments?.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={post.id}
                postOwnerId={post.userId}
                currentUserId={user?.id}
                onReply={handleReply}
                onLike={handleLikeComment}
                onDelete={(id) => deleteCommentMutation.mutate(id)}
                onEdit={handleEditComment}
                onPin={handlePinComment}
                isExpanded={expandedReplies.has(comment.id)}
                onToggleReplies={() => toggleReplies(comment.id)}
              />
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

// Separate component for comment item with replies
function CommentItem({
  comment,
  postId,
  postOwnerId,
  currentUserId,
  onReply,
  onLike,
  onDelete,
  onEdit,
  onPin,
  isExpanded,
  onToggleReplies
}: {
  comment: EnrichedComment;
  postId: number;
  postOwnerId: number;
  currentUserId?: number;
  onReply: (comment: EnrichedComment) => void;
  onLike: (commentId: number, isLiked: boolean) => void;
  onDelete: (commentId: number) => void;
  onEdit: (comment: EnrichedComment) => void;
  onPin: (commentId: number, isPinned: boolean) => void;
  isExpanded: boolean;
  onToggleReplies: () => void;
}) {
  const { data: replies } = useQuery<(Comment & { user: User; likeCount: number; hasLiked: boolean })[]>({
    queryKey: [`/api/posts/${postId}/comments/${comment.id}/replies`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isExpanded && comment.replyCount > 0,
  });

  const isCommentOwner = currentUserId === comment.userId;
  const isPostOwner = currentUserId === postOwnerId;
  const canDelete = isCommentOwner || isPostOwner;

  return (
    <div className="space-y-2">
      {comment.isPinned && (
        <div className="flex items-center gap-1 text-xs text-amber-600 mb-1">
          <Pin className="h-3 w-3" />
          <span>Pinned by creator</span>
        </div>
      )}
      <div className="flex gap-3 group">
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
              {comment.isEdited && (
                <span className="text-xs text-neutral-400 ml-1">(edited)</span>
              )}
            </div>
            
            {(isCommentOwner || isPostOwner) && (
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
                  {isCommentOwner && (
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => onEdit(comment)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {isPostOwner && (
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => onPin(comment.id, !!comment.isPinned)}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {comment.isPinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                  )}
                  {(isCommentOwner || isPostOwner) && <DropdownMenuSeparator />}
                  {canDelete && (
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer"
                      onClick={() => onDelete(comment.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="flex items-center mt-1 space-x-4">
            <p className="text-xs text-neutral-500">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'just now'}
            </p>
            {comment.likeCount > 0 && (
              <span className="text-xs text-neutral-500">{comment.likeCount} likes</span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-4 p-0 text-xs flex items-center gap-1 hover:text-primary ${comment.hasLiked ? 'text-red-500' : ''}`}
              onClick={() => onLike(comment.id, comment.hasLiked)}
            >
              <Heart className={`h-3 w-3 ${comment.hasLiked ? 'fill-red-500' : ''}`} />
              {comment.hasLiked ? 'Liked' : 'Like'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-4 p-0 text-xs text-neutral-500 hover:text-primary"
              onClick={() => onReply(comment)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>
          
          {/* Show replies toggle */}
          {comment.replyCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 p-0 text-xs text-neutral-500 hover:text-primary mt-1"
              onClick={onToggleReplies}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide replies
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  View {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Replies */}
      {isExpanded && replies && replies.length > 0 && (
        <div className="ml-10 space-y-3 border-l-2 border-neutral-100 pl-3">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-3 group">
              <Link href={`/profile/${reply.user.username}`}>
                <Avatar className="h-6 w-6 mt-0.5 cursor-pointer flex-shrink-0">
                  <AvatarImage 
                    src={reply.user.profileImage || "https://github.com/shadcn.png"} 
                    alt={reply.user.username} 
                  />
                  <AvatarFallback>
                    {reply.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="flex-1">
                <div>
                  <Link href={`/profile/${reply.user.username}`}>
                    <span className="font-semibold text-sm mr-2 cursor-pointer">
                      {reply.user.username}
                    </span>
                  </Link>
                  <span className="text-sm">{reply.content}</span>
                </div>
                
                <div className="flex items-center mt-1 space-x-4">
                  <p className="text-xs text-neutral-500">
                    {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : 'just now'}
                  </p>
                  {reply.likeCount > 0 && (
                    <span className="text-xs text-neutral-500">{reply.likeCount} likes</span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-4 p-0 text-xs flex items-center gap-1 hover:text-primary ${reply.hasLiked ? 'text-red-500' : ''}`}
                    onClick={() => onLike(reply.id, reply.hasLiked)}
                  >
                    <Heart className={`h-3 w-3 ${reply.hasLiked ? 'fill-red-500' : ''}`} />
                    {reply.hasLiked ? 'Liked' : 'Like'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
