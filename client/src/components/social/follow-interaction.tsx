import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Clock, Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface FollowInteractionProps {
  userId: number;
  isFollowing: boolean;
  isPending?: boolean;
  isPrivate?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export function FollowInteraction({
  userId,
  isFollowing,
  isPending = false,
  isPrivate = false,
  onFollowChange,
  size = "default",
  variant = "default"
}: FollowInteractionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to follow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      onFollowChange?.(true);
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/unfollow`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to unfollow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      onFollowChange?.(false);
    }
  });

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  // Determine button state and appearance
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <span className="flex items-center gap-1">
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        </span>
      );
    }

    if (isPending) {
      return (
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Requested</span>
        </span>
      );
    }

    if (isFollowing) {
      return (
        <span className="flex items-center gap-1">
          {isHovered ? (
            <>
              <UserMinus className="h-4 w-4" />
              <span className="hidden sm:inline">Unfollow</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Following</span>
            </>
          )}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1">
        <UserPlus className="h-4 w-4" />
        <span className="hidden sm:inline">{isPrivate ? "Request" : "Follow"}</span>
      </span>
    );
  };

  const getButtonVariant = () => {
    if (isFollowing || isPending) {
      return isHovered ? "destructive" : "outline";
    }
    return variant;
  };

  return (
    <Button
      size={size}
      variant={getButtonVariant() as "default" | "outline" | "ghost" | "destructive"}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading || isPending}
      className="touch-manipulation min-w-[80px] transition-all duration-200"
    >
      {getButtonContent()}
    </Button>
  );
}

// Follow request actions component
interface FollowRequestActionsProps {
  requestId: number;
  requesterId: number;
  onAccept?: () => void;
  onReject?: () => void;
}

export function FollowRequestActions({
  requestId,
  requesterId,
  onAccept,
  onReject
}: FollowRequestActionsProps) {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/follow-requests/${requestId}/accept`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to accept");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      onAccept?.();
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/follow-requests/${requestId}/reject`, {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to reject");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      onReject?.();
    }
  });

  const isLoading = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => acceptMutation.mutate()}
        disabled={isLoading}
        className="touch-manipulation"
      >
        <Check className="h-4 w-4 mr-1" />
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => rejectMutation.mutate()}
        disabled={isLoading}
        className="touch-manipulation"
      >
        <X className="h-4 w-4 mr-1" />
        Decline
      </Button>
    </div>
  );
}
