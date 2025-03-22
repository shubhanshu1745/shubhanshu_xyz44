import { useState } from "react";
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Tag, Trophy, User as UserIcon, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Post, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type PostCardProps = {
  post: Post & {
    user: User;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
  };
  onCommentClick?: () => void;
};

export function PostCard({ post, onCommentClick }: PostCardProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(post.hasLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    onMutate: async (variables) => {
      setIsLiked(prev => !prev);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    },
    onError: (error) => {
      setIsLiked(post.hasLiked);
      setLikeCount(post.likeCount);
      toast({
        title: "Error",
        description: "Failed to like/unlike post",
        variant: "destructive"
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${post.id}/comments`, { content: comment });
    },
    onSuccess: () => {
      setComment("");
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

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate();
    }
  };

  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "recently";

  return (
    <Card className="bg-white mb-4 border border-neutral-200 md:rounded-lg overflow-hidden">
      <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center">
          <Link href={`/profile/${post.user.username}`}>
            <Avatar className="h-8 w-8 mr-2 cursor-pointer">
              <AvatarImage src={post.user.profileImage || "https://github.com/shadcn.png"} alt={post.user.username} />
              <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/profile/${post.user.username}`}>
              <p className="font-semibold text-sm cursor-pointer">{post.user.username}</p>
            </Link>
            {post.location && <p className="text-xs text-neutral-500">{post.location}</p>}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-neutral-500">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>
      
      <div className="w-full aspect-square overflow-hidden bg-neutral-100">
        {post.imageUrl ? (
          <img 
            src={post.imageUrl}
            alt="Post" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <p className="text-sm">No image</p>
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex justify-between mb-2">
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className={isLiked ? "text-[#FF5722]" : "text-neutral-600 hover:text-[#FF5722]"}
              onClick={handleLike}
            >
              <Heart className={`h-6 w-6 ${isLiked ? "fill-[#FF5722]" : ""}`} />
              <span className="sr-only">Like</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-neutral-600 hover:text-primary"
              onClick={onCommentClick}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="sr-only">Comment</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary">
              <Share className="h-6 w-6" />
              <span className="sr-only">Share</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary">
            <Bookmark className="h-6 w-6" />
            <span className="sr-only">Save</span>
          </Button>
        </div>
        
        <p className="font-semibold text-sm mb-1">{likeCount} likes</p>
        
        {post.content && (
          <p className="text-sm mb-1">
            <Link href={`/profile/${post.user.username}`}>
              <span className="font-semibold cursor-pointer">{post.user.username}</span>
            </Link>{" "}
            {post.content}
          </p>
        )}
        
        {post.commentCount > 0 && (
          <button 
            className="text-neutral-500 text-sm mb-1"
            onClick={onCommentClick}
          >
            View all {post.commentCount} comments
          </button>
        )}
        
        <p className="text-xs text-neutral-500 mt-2 uppercase">{formattedDate}</p>
      </CardContent>
      
      <CardFooter className="p-0 border-t border-neutral-200">
        <form 
          className="flex items-center w-full px-3 py-2"
          onSubmit={handleComment}
        >
          <Button variant="ghost" size="icon" className="text-neutral-500 mr-2">
            <span className="text-xl">😊</span>
          </Button>
          <Input 
            type="text" 
            placeholder="Add a comment..." 
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
            Post
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
