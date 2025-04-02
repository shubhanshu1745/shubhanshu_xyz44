import { useState, useEffect } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StoryComment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  storyId: number;
  user: {
    id: number;
    username: string;
    profileImage: string | null;
  };
}

interface StoryCommentsProps {
  storyId: number;
  currentUser: User | null;
}

export default function StoryComments({ storyId, currentUser }: StoryCommentsProps) {
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [storyId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories/${storyId}/comments`);
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment on stories",
        variant: "default",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment",
        variant: "default",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment("");
        toast({
          title: "Comment added",
          description: "Your comment has been added",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: "Failed to add your comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      setDeleting(commentId);
      const response = await fetch(`/api/stories/${storyId}/comments/${commentId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        toast({
          title: "Comment deleted",
          description: "Your comment has been deleted",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {currentUser && (
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.profileImage || undefined} alt={currentUser.username} />
            <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none min-h-[80px]"
            />
            <div className="flex justify-end mt-2">
              <Button 
                size="sm"
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2 pb-3 border-b">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.profileImage || undefined} alt={comment.user.username} />
                <AvatarFallback>{getInitials(comment.user.username)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">{comment.user.username}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {currentUser && currentUser.id === comment.userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleting === comment.id}
                    >
                      {deleting === comment.id ? 
                        <Loader2 className="h-4 w-4 animate-spin" /> : 
                        <Trash className="h-4 w-4" />
                      }
                    </Button>
                  )}
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}