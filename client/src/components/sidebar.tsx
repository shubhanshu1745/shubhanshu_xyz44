import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestedUsers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/suggested"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      await apiRequest("POST", `/api/users/${username}/follow`);
      return username;
    },
    onSuccess: (username) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      toast({
        title: "Success",
        description: `You are now following ${username}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const handleFollow = (username: string) => {
    followMutation.mutate(username);
  };

  if (!user) return null;

  return (
    <div className="p-4">
      {/* User Profile Summary */}
      <div className="flex items-center mb-6">
        <Avatar className="w-14 h-14 mr-4">
          <AvatarImage 
            src={user.profileImage || "https://github.com/shadcn.png"} 
            alt={user.username} 
          />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <Link href={`/profile/${user.username}`}>
            <p className="font-semibold cursor-pointer">{user.username}</p>
          </Link>
          <p className="text-neutral-500 text-sm">{user.fullName || user.username}</p>
        </div>
        <Button variant="link" size="sm" className="ml-auto">
          Switch
        </Button>
      </div>
      
      {/* Suggestions */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-neutral-500 font-semibold text-sm">Suggestions For You</span>
          <Button variant="link" size="sm" className="text-xs p-0">
            See All
          </Button>
        </div>
        
        {/* Suggestion List */}
        {isLoading ? (
          <div className="flex flex-col space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="flex items-center mb-3" key={i}>
                <div className="w-9 h-9 rounded-full bg-neutral-200 mr-3 animate-pulse" />
                <div className="flex-grow">
                  <div className="h-4 bg-neutral-200 rounded w-24 mb-1 animate-pulse" />
                  <div className="h-3 bg-neutral-200 rounded w-32 animate-pulse" />
                </div>
                <div className="w-12 h-4 bg-neutral-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {suggestedUsers?.map((suggestedUser) => (
              <div className="flex items-center" key={suggestedUser.id}>
                <Link href={`/profile/${suggestedUser.username}`}>
                  <Avatar className="w-9 h-9 mr-3 cursor-pointer">
                    <AvatarImage 
                      src={suggestedUser.profileImage || "https://github.com/shadcn.png"} 
                      alt={suggestedUser.username} 
                    />
                    <AvatarFallback>{suggestedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-grow">
                  <Link href={`/profile/${suggestedUser.username}`}>
                    <p className="text-sm font-semibold cursor-pointer">{suggestedUser.username}</p>
                  </Link>
                  <p className="text-xs text-neutral-500">{suggestedUser.fullName || suggestedUser.username}</p>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary text-xs font-semibold p-0"
                  onClick={() => handleFollow(suggestedUser.username)}
                >
                  Follow
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Trending Hashtags */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-4">
        <h3 className="font-semibold text-sm mb-3">Trending Cricket Hashtags</h3>
        <div className="space-y-2">
          <p className="text-sm hover:bg-neutral-100 p-2 rounded cursor-pointer">
            <span className="text-primary">#IPL2023</span> 
            <span className="text-neutral-500 text-xs ml-1">234K posts</span>
          </p>
          <p className="text-sm hover:bg-neutral-100 p-2 rounded cursor-pointer">
            <span className="text-primary">#TeamIndia</span> 
            <span className="text-neutral-500 text-xs ml-1">189K posts</span>
          </p>
          <p className="text-sm hover:bg-neutral-100 p-2 rounded cursor-pointer">
            <span className="text-primary">#CricketWorldCup</span> 
            <span className="text-neutral-500 text-xs ml-1">156K posts</span>
          </p>
          <p className="text-sm hover:bg-neutral-100 p-2 rounded cursor-pointer">
            <span className="text-primary">#TestCricket</span> 
            <span className="text-neutral-500 text-xs ml-1">98K posts</span>
          </p>
        </div>
      </div>
      
      {/* Upcoming Matches */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <h3 className="font-semibold text-sm mb-3">Upcoming Matches</h3>
        <div className="space-y-3">
          <div className="border-b border-neutral-100 pb-2">
            <p className="text-xs text-neutral-500">T20 WORLD CUP • TOMORROW</p>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center">
                <span className="font-semibold mr-1">IND</span>
                <div className="w-5 h-4 bg-[#1A73E8] rounded-sm"></div>
              </div>
              <span className="text-xs font-semibold">VS</span>
              <div className="flex items-center">
                <div className="w-5 h-4 bg-[#FFB74D] rounded-sm"></div>
                <span className="font-semibold ml-1">AUS</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Sydney Cricket Ground • 7:00 PM</p>
          </div>
          
          <div>
            <p className="text-xs text-neutral-500">TEST SERIES • 3 DAYS</p>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center">
                <span className="font-semibold mr-1">ENG</span>
                <div className="w-5 h-4 bg-[#E74C3C] rounded-sm"></div>
              </div>
              <span className="text-xs font-semibold">VS</span>
              <div className="flex items-center">
                <div className="w-5 h-4 bg-[#2ECC71] rounded-sm"></div>
                <span className="font-semibold ml-1">NZ</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Lord's Cricket Ground • 11:00 AM</p>
          </div>
        </div>
      </div>
      
      {/* Footer Links */}
      <div className="mt-8">
        <div className="flex flex-wrap text-xs text-neutral-400 mb-3">
          <Button variant="link" className="text-xs text-neutral-400 p-0 h-auto mr-2 mb-1">About</Button>
          <Button variant="link" className="text-xs text-neutral-400 p-0 h-auto mr-2 mb-1">Help</Button>
          <Button variant="link" className="text-xs text-neutral-400 p-0 h-auto mr-2 mb-1">API</Button>
          <Button variant="link" className="text-xs text-neutral-400 p-0 h-auto mr-2 mb-1">Privacy</Button>
          <Button variant="link" className="text-xs text-neutral-400 p-0 h-auto mr-2 mb-1">Terms</Button>
        </div>
        <p className="text-xs text-neutral-400">© 2023 CRICSOCIAL</p>
      </div>
    </div>
  );
}
