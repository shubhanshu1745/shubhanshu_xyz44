import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { AlertCircle, Loader2, Search, User as UserIcon, UserPlus, X, CheckCheck, UserCheck } from "lucide-react";
import { useState } from "react";

type ListType = "followers" | "following";

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  listType: ListType;
  userId: number;
}

export function FollowListDialog({ 
  open, 
  onOpenChange,
  username,
  listType,
  userId
}: FollowListDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const endpointSuffix = listType === "followers" ? "followers" : "following";
  
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: [`/api/users/${username}/${endpointSuffix}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: open, // Only fetch when dialog is open
  });

  const followMutation = useMutation({
    mutationFn: async (userToFollowUsername: string) => {
      return await apiRequest("POST", `/api/users/${userToFollowUsername}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/${endpointSuffix}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      toast({
        title: "Success",
        description: "User followed successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive"
      });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userToUnfollowUsername: string) => {
      return await apiRequest("DELETE", `/api/users/${userToUnfollowUsername}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/${endpointSuffix}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      toast({
        title: "Success",
        description: "User unfollowed successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive"
      });
    }
  });

  const handleFollow = (userToFollowUsername: string) => {
    followMutation.mutate(userToFollowUsername);
  };

  const handleUnfollow = (userToUnfollowUsername: string) => {
    unfollowMutation.mutate(userToUnfollowUsername);
  };

  // Filter users based on search term
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 max-h-[80vh] flex flex-col">
        <DialogHeader className="p-4 border-b flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold text-center w-full">
            {listType === "followers" ? "Followers" : "Following"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input 
              placeholder={`Search ${listType}`}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-red-600 font-medium">Failed to load {listType}</p>
              <p className="text-sm text-neutral-500">Please try again later</p>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <UserIcon className="h-10 w-10 text-neutral-300 mb-2" />
              <p className="text-neutral-600 font-medium">
                {searchTerm 
                  ? "No users found matching your search" 
                  : listType === "followers" 
                    ? "No followers yet" 
                    : "Not following anyone yet"}
              </p>
              {!searchTerm && listType === "followers" && (
                <p className="text-sm text-neutral-500 mt-1">
                  Connect with other cricket fans to grow your network
                </p>
              )}
            </div>
          ) : (
            filteredUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2">
                <Link href={`/profile/${user.username}`} onClick={() => onOpenChange(false)}>
                  <div className="flex items-center cursor-pointer">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage 
                        src={user.profileImage || "https://github.com/shadcn.png"} 
                        alt={user.username} 
                      />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{user.username}</p>
                      {user.name && <p className="text-xs text-neutral-500">{user.name}</p>}
                    </div>
                  </div>
                </Link>
                
                {currentUser && currentUser.id !== user.id && (
                  followMutation.isPending || unfollowMutation.isPending ? (
                    <Button disabled variant="ghost" size="sm" className="h-9 rounded-full">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={user.isFollowing ? "h-9 rounded-full" : "h-9 rounded-full bg-[#FF5722] hover:bg-[#E64A19] text-white hover:text-white border-none"}
                      onClick={() => user.isFollowing ? handleUnfollow(user.username) : handleFollow(user.username)}
                    >
                      {user.isFollowing ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}