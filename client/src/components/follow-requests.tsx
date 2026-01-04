import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    bio?: string;
  };
}

interface FollowRequestsProps {
  className?: string;
}

export function FollowRequests({ className = "" }: FollowRequestsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch follow requests
  const { data: followRequests = [], isLoading } = useQuery<FollowRequest[]>({
    queryKey: ["/api/follow-requests"],
    queryFn: getQueryFn(),
  });

  // Accept follow request
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("POST", `/api/follow-requests/${requestId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "Follow request accepted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept follow request",
        variant: "destructive",
      });
    },
  });

  // Reject follow request
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("POST", `/api/follow-requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow-requests"] });
      toast({
        title: "Success",
        description: "Follow request rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject follow request",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleReject = (requestId: number) => {
    rejectRequestMutation.mutate(requestId);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Follow Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-16 bg-gray-200 rounded" />
                  <div className="h-8 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Follow Requests
          {followRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {followRequests.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {followRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No follow requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {followRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={request.follower.profileImage || ""} />
                    <AvatarFallback>
                      {request.follower.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {request.follower.fullName || request.follower.username}
                    </p>
                    <p className="text-sm text-gray-500">@{request.follower.username}</p>
                    {request.follower.bio && (
                      <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                        {request.follower.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(request.id)}
                    disabled={acceptRequestMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    disabled={rejectRequestMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}