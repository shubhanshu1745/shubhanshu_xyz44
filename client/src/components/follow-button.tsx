import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserMinus, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  username: string;
  isFollowing: boolean;
  followRequestStatus?: string | null;
  isPrivate?: boolean;
  className?: string;
}

export function FollowButton({ 
  username, 
  isFollowing, 
  followRequestStatus,
  isPrivate = false,
  className = "" 
}: FollowButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      if (action === "follow") {
        return apiRequest("POST", `/api/users/${username}/follow`);
      } else {
        return apiRequest("DELETE", `/api/users/${username}/follow`);
      }
    },
    onSuccess: (data, action) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-requests"] });
      
      if (action === "follow") {
        if (isPrivate) {
          toast({
            title: "Follow Request Sent",
            description: `Your follow request has been sent to @${username}`,
          });
        } else {
          toast({
            title: "Following",
            description: `You are now following @${username}`,
          });
        }
      } else {
        toast({
          title: "Unfollowed",
          description: `You unfollowed @${username}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    if (isFollowing) {
      followMutation.mutate("unfollow");
    } else {
      followMutation.mutate("follow");
    }
  };

  // Determine button state and content
  const getButtonContent = () => {
    if (followMutation.isPending) {
      return {
        icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />,
        text: isFollowing ? "Unfollowing..." : "Following...",
        variant: "secondary" as const,
        disabled: true,
      };
    }

    if (isFollowing) {
      return {
        icon: <UserMinus className="h-4 w-4" />,
        text: "Unfollow",
        variant: "outline" as const,
        disabled: false,
      };
    }

    if (followRequestStatus === "pending") {
      return {
        icon: <Clock className="h-4 w-4" />,
        text: "Requested",
        variant: "secondary" as const,
        disabled: false,
      };
    }

    return {
      icon: <UserPlus className="h-4 w-4" />,
      text: isPrivate ? "Request" : "Follow",
      variant: "default" as const,
      disabled: false,
    };
  };

  const buttonContent = getButtonContent();

  return (
    <Button
      variant={buttonContent.variant}
      size="sm"
      onClick={handleClick}
      disabled={buttonContent.disabled}
      className={`${className} ${
        isFollowing 
          ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300" 
          : ""
      }`}
    >
      {buttonContent.icon}
      <span className="ml-2">{buttonContent.text}</span>
    </Button>
  );
}