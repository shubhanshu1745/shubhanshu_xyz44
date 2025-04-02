import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ExternalLink, 
  MessageCircle, 
  Film, 
  BarChart2, 
  LineChart, 
  Trophy, 
  Activity 
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

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
        <Avatar className="w-14 h-14 mr-4 border-2 border-[#2E8B57]">
          <AvatarImage 
            src={user.profileImage || "https://github.com/shadcn.png"} 
            alt={user.username} 
          />
          <AvatarFallback className="bg-[#2E8B57] text-white">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <Link href={`/profile/${user.username}`}>
            <p className="font-semibold cursor-pointer cricket-primary">{user.username}</p>
          </Link>
          <p className="text-neutral-500 text-sm">{user.fullName || user.username}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href="/chat">
            <Button variant="ghost" size="icon" className="text-[#2E8B57] hover:text-[#1F3B4D]" title="Messages">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-[#2E8B57] border-[#2E8B57] hover:bg-[#2E8B57] hover:text-white">
            Switch
          </Button>
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="mb-6 space-y-2">
        <Link href="/">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/" ? "font-semibold" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#1F3B4D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="cricket-primary">Home</span>
          </div>
        </Link>
        
        <Link href="/reels">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/reels" ? "font-semibold" : ""}`}>
            <Film className="h-5 w-5 mr-3 text-[#1F3B4D]" />
            <span className="cricket-primary">Reels</span>
          </div>
        </Link>
        
        <Link href="/stats">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/stats" ? "font-semibold" : ""}`}>
            <BarChart2 className="h-5 w-5 mr-3 text-[#1F3B4D]" />
            <span className="cricket-primary">Stats</span>
          </div>
        </Link>
        
        <Link href="/matches">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/matches" ? "font-semibold" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#1F3B4D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="cricket-primary">Matches</span>
          </div>
        </Link>
        
        <Link href="/teams">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/teams" ? "font-semibold" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#1F3B4D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="cricket-primary">Teams</span>
          </div>
        </Link>

        <Link href="/scoring">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/scoring" ? "font-semibold" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#1F3B4D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="cricket-primary">Live Scoring</span>
          </div>
        </Link>
        
        <Link href="/advanced-scoring">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/advanced-scoring" ? "font-semibold" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#1F3B4D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="cricket-primary">Advanced Scoring</span>
          </div>
        </Link>
        
        <Link href="/analytics">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/analytics" ? "font-semibold" : ""}`}>
            <Activity className="h-5 w-5 mr-3 text-[#1F3B4D]" />
            <span className="cricket-primary">Analytics</span>
          </div>
        </Link>
        
        <Link href="/tournaments">
          <div className={`flex items-center p-2 rounded-md hover:bg-gray-100 ${location === "/tournaments" ? "font-semibold" : ""}`}>
            <Trophy className="h-5 w-5 mr-3 text-[#1F3B4D]" />
            <span className="cricket-primary">Tournaments</span>
          </div>
        </Link>
      </div>
      
      {/* Suggestions */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-neutral-500 font-semibold text-sm">Suggestions For You</span>
          <Link href="/suggestions">
            <Button variant="link" size="sm" className="text-xs p-0 text-[#2E8B57] hover:text-[#1F3B4D]">
              See All
            </Button>
          </Link>
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
                  <Avatar className="w-9 h-9 mr-3 cursor-pointer border border-[#2E8B57]">
                    <AvatarImage 
                      src={suggestedUser.profileImage || "https://github.com/shadcn.png"} 
                      alt={suggestedUser.username} 
                    />
                    <AvatarFallback className="bg-[#2E8B57] text-white">{suggestedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-grow">
                  <Link href={`/profile/${suggestedUser.username}`}>
                    <p className="text-sm font-semibold cursor-pointer cricket-primary">{suggestedUser.username}</p>
                  </Link>
                  <p className="text-xs text-neutral-500">{suggestedUser.fullName || suggestedUser.username}</p>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-[#2E8B57] text-xs font-semibold p-0 hover:text-[#1F3B4D]"
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
      <div className="cricket-surface-bg rounded-lg border border-[#1F3B4D]/10 p-4 mb-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3 cricket-primary">Trending Cricket Hashtags</h3>
        <div className="space-y-2">
          <p className="text-sm hover:bg-white p-2 rounded cursor-pointer transition-colors">
            <span className="text-[#2E8B57] font-medium">#IPL2023</span> 
            <span className="text-neutral-500 text-xs ml-1">234K posts</span>
          </p>
          <p className="text-sm hover:bg-white p-2 rounded cursor-pointer transition-colors">
            <span className="text-[#2E8B57] font-medium">#TeamIndia</span> 
            <span className="text-neutral-500 text-xs ml-1">189K posts</span>
          </p>
          <p className="text-sm hover:bg-white p-2 rounded cursor-pointer transition-colors">
            <span className="text-[#2E8B57] font-medium">#CricketWorldCup</span> 
            <span className="text-neutral-500 text-xs ml-1">156K posts</span>
          </p>
          <p className="text-sm hover:bg-white p-2 rounded cursor-pointer transition-colors">
            <span className="text-[#2E8B57] font-medium">#TestCricket</span> 
            <span className="text-neutral-500 text-xs ml-1">98K posts</span>
          </p>
        </div>
      </div>
      
      {/* Upcoming Matches */}
      <div className="cricket-surface-bg rounded-lg border border-[#1F3B4D]/10 p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3 cricket-primary">Upcoming Matches</h3>
        <div className="space-y-3">
          <div className="border-b border-[#1F3B4D]/10 pb-2">
            <p className="text-xs text-[#2E8B57] font-medium">T20 WORLD CUP • TOMORROW</p>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center">
                <span className="font-semibold mr-1 cricket-primary">IND</span>
                <div className="w-5 h-4 bg-[#1F3B4D] rounded-sm"></div>
              </div>
              <span className="text-xs font-semibold text-[#FFC107]">VS</span>
              <div className="flex items-center">
                <div className="w-5 h-4 bg-[#FFC107] rounded-sm"></div>
                <span className="font-semibold ml-1 cricket-primary">AUS</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Sydney Cricket Ground • 7:00 PM</p>
          </div>
          
          <div>
            <p className="text-xs text-[#2E8B57] font-medium">TEST SERIES • 3 DAYS</p>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center">
                <span className="font-semibold mr-1 cricket-primary">ENG</span>
                <div className="w-5 h-4 bg-[#1F3B4D] rounded-sm"></div>
              </div>
              <span className="text-xs font-semibold text-[#FFC107]">VS</span>
              <div className="flex items-center">
                <div className="w-5 h-4 bg-[#2E8B57] rounded-sm"></div>
                <span className="font-semibold ml-1 cricket-primary">NZ</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Lord's Cricket Ground • 11:00 AM</p>
          </div>
        </div>
      </div>
      
      {/* Footer Links */}
      <div className="mt-8">
        <div className="flex flex-wrap text-xs mb-3">
          <Button variant="link" className="text-xs text-[#1F3B4D]/60 hover:text-[#2E8B57] p-0 h-auto mr-2 mb-1">About</Button>
          <Button variant="link" className="text-xs text-[#1F3B4D]/60 hover:text-[#2E8B57] p-0 h-auto mr-2 mb-1">Help</Button>
          <Button variant="link" className="text-xs text-[#1F3B4D]/60 hover:text-[#2E8B57] p-0 h-auto mr-2 mb-1">API</Button>
          <Button variant="link" className="text-xs text-[#1F3B4D]/60 hover:text-[#2E8B57] p-0 h-auto mr-2 mb-1">Privacy</Button>
          <Button variant="link" className="text-xs text-[#1F3B4D]/60 hover:text-[#2E8B57] p-0 h-auto mr-2 mb-1">Terms</Button>
        </div>
        <p className="text-xs text-[#1F3B4D]/60">© 2023 CRICSOCIAL</p>
      </div>
    </div>
  );
}
