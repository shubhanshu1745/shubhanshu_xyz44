import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X, Heart, MessageCircle, UserPlus, Eye, Share2, AtSign, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  fromUserId?: number;
  entityType?: string;
  entityId?: number;
  fromUser?: {
    id: number;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  actionUrl?: string;
}

interface NotificationsProps {
  className?: string;
}

interface FollowRequest {
  id: number;
  followerId: number;
  followingId: number;
  status: string;
  createdAt: string;
  follower: {
    id: number;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
}

export function Notifications({ className = "" }: NotificationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: getQueryFn(),
  });

  // Fetch follow requests (for private accounts)
  const { data: followRequests = [] } = useQuery<FollowRequest[]>({
    queryKey: ["/api/follow-requests"],
    queryFn: getQueryFn(),
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: getQueryFn(),
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("POST", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  // Accept follow request
  const acceptFollowMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("POST", `/api/follow-requests/${requestId}/accept`);
    },
    onSuccess: (_, requestId) => {
      // Find the request to get the follower info
      const request = followRequests.find(r => r.id === requestId);
      if (request) {
        setAcceptedRequests(prev => new Set(prev).add(request.followerId));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/follow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Accepted",
        description: "Follow request accepted. You can now follow them back!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept follow request",
        variant: "destructive",
      });
    },
  });

  // Reject follow request
  const rejectFollowMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("POST", `/api/follow-requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Rejected",
        description: "Follow request rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject follow request",
        variant: "destructive",
      });
    },
  });

  // Follow back mutation (for when someone follows you and you want to follow them back)
  const followBackMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("POST", `/api/users/${username}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Following",
        description: "You are now following this user",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  // Track which users we've followed back (to update UI)
  const [followedBackUsers, setFollowedBackUsers] = useState<Set<number>>(new Set());
  
  // Track accepted follow requests to show "Follow Back" option
  const [acceptedRequests, setAcceptedRequests] = useState<Set<number>>(new Set());

  // Set up SSE for real-time notifications
  useEffect(() => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/notifications/stream", {
      withCredentials: true,
    });

    es.onopen = () => {
      console.log("SSE connection opened");
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "notification") {
          // Invalidate queries to refresh notifications
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["/api/follow-requests"] });
          
          // Show toast for new notification
          toast({
            title: data.notification.title,
            description: data.notification.message,
          });
        } else if (data.type === "connected") {
          console.log("Connected to notification stream");
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    es.onerror = (error) => {
      console.error("SSE error:", error);
      // Reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          es.close();
          eventSourceRef.current = null;
        }
      }, 5000);
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [queryClient, toast]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow_request":
        return <UserPlus className="h-4 w-4 text-orange-500" />;
      case "follow_accepted":
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "new_follower":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case "story_view":
        return <Eye className="h-4 w-4 text-cyan-500" />;
      case "post_share":
        return <Share2 className="h-4 w-4 text-indigo-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification, e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    }
  };

  // Find follow request ID for a notification
  const getFollowRequestId = (notification: Notification): number | null => {
    if (notification.type !== "follow_request" || !notification.fromUserId) {
      return null;
    }
    const request = followRequests.find(r => r.followerId === notification.fromUserId);
    return request?.id || null;
  };

  // Handle follow back - with event stop propagation
  const handleFollowBack = (e: React.MouseEvent, username: string, userId: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    followBackMutation.mutate(username, {
      onSuccess: () => {
        setFollowedBackUsers(prev => new Set(prev).add(userId));
        // Remove from accepted requests since we've followed back
        setAcceptedRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });
  };
  
  // Handle accept with follow back option
  const handleAcceptRequest = (e: React.MouseEvent, request: FollowRequest) => {
    e.stopPropagation();
    e.preventDefault();
    acceptFollowMutation.mutate(request.id);
  };
  
  // Handle reject request
  const handleRejectRequest = (e: React.MouseEvent, requestId: number) => {
    e.stopPropagation();
    e.preventDefault();
    rejectFollowMutation.mutate(requestId);
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg ${className}`}>
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span className="font-semibold">Notifications</span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg ${className}`}>
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span className="font-semibold">Notifications</span>
            {unreadData && unreadData.count > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadData.count}
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="h-[400px]">
        {/* Follow Requests Section */}
        {followRequests.length > 0 && (
          <div className="border-b dark:border-gray-700">
            <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Follow Requests ({followRequests.length})
              </span>
            </div>
            {followRequests.map((request) => {
              const isAccepted = acceptedRequests.has(request.followerId);
              const hasFollowedBack = followedBackUsers.has(request.followerId);
              
              return (
                <div
                  key={`request-${request.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.follower.profileImage || ""} />
                      <AvatarFallback>
                        {request.follower.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {request.follower.fullName || request.follower.username}
                      </p>
                      <p className="text-xs text-gray-500">@{request.follower.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasFollowedBack ? (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Following
                      </span>
                    ) : isAccepted ? (
                      <Button
                        size="sm"
                        onClick={(e) => handleFollowBack(e, request.follower.username, request.followerId)}
                        disabled={followBackMutation.isPending}
                        className="bg-blue-500 hover:bg-blue-600 text-white h-8 px-3"
                      >
                        {followBackMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Follow Back
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={(e) => handleAcceptRequest(e, request)}
                          disabled={acceptFollowMutation.isPending}
                          className="bg-blue-500 hover:bg-blue-600 text-white h-8 px-3"
                        >
                          {acceptFollowMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleRejectRequest(e, request.id)}
                          disabled={rejectFollowMutation.isPending}
                          className="h-8 px-3"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 && followRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm mt-1">When someone interacts with you, you'll see it here</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const followRequestId = getFollowRequestId(notification);
              const showFollowActions = notification.type === "follow_request" && followRequestId;
              const hasFollowedBack = notification.fromUserId ? followedBackUsers.has(notification.fromUserId) : false;
              const showFollowBack = (notification.type === "follow_accepted" || notification.type === "new_follower") && 
                notification.fromUserId && 
                notification.fromUser?.username &&
                !hasFollowedBack;
              
              // Get display name
              const displayName = notification.fromUser?.fullName || notification.fromUser?.username || "Someone";
              
              return (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-3 p-3 cursor-pointer transition-colors border-b dark:border-gray-700 last:border-b-0 ${
                    notification.isRead 
                      ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800" 
                      : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  }`}
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className="flex-shrink-0">
                    {notification.fromUser ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.fromUser.profileImage || ""} />
                        <AvatarFallback>
                          {notification.fromUser.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{displayName}</span>
                          {" "}
                          <span className="text-gray-600 dark:text-gray-400">
                            {notification.type === "follow_accepted" 
                              ? "accepted your follow request" 
                              : notification.type === "follow_request"
                              ? "wants to follow you"
                              : notification.type === "new_follower"
                              ? "started following you"
                              : notification.message.replace(notification.fromUser?.username || "", "").trim()}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        {getNotificationIcon(notification.type)}
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    
                    {/* Follow request action buttons inline */}
                    {showFollowActions && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            acceptFollowMutation.mutate(followRequestId);
                          }}
                          disabled={acceptFollowMutation.isPending}
                          className="bg-blue-500 hover:bg-blue-600 text-white h-7 px-3 text-xs"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            rejectFollowMutation.mutate(followRequestId);
                          }}
                          disabled={rejectFollowMutation.isPending}
                          className="h-7 px-3 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                    
                    {/* Follow back button for follow_accepted notifications */}
                    {showFollowBack && notification.fromUser && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          size="sm"
                          onClick={(e) => handleFollowBack(e, notification.fromUser!.username, notification.fromUserId!)}
                          disabled={followBackMutation.isPending}
                          className="bg-blue-500 hover:bg-blue-600 text-white h-7 px-3 text-xs"
                        >
                          {followBackMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <UserPlus className="h-3 w-3 mr-1" />
                          )}
                          Follow Back
                        </Button>
                      </div>
                    )}
                    
                    {/* Show "Following" badge if already followed back */}
                    {(notification.type === "follow_accepted" || notification.type === "new_follower") && 
                     notification.fromUserId && 
                     hasFollowedBack && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Following
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}