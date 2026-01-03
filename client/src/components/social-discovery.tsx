import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Search, MapPin, Trophy, Users, Star, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface SuggestedUser {
  id: number;
  username: string;
  fullName: string;
  profileImage: string;
  bio: string;
  location: string;
  followersCount: number;
  postsCount: number;
  isFollowing: boolean;
  mutualFollowers: number;
  commonInterests: string[];
  recentActivity: string;
}

interface TrendingHashtag {
  tag: string;
  count: number;
  growth: number;
}

interface SocialDiscoveryProps {
  className?: string;
}

export function SocialDiscovery({ className = "" }: SocialDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("suggested");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestedUsers = [] } = useQuery<SuggestedUser[]>({
    queryKey: ["/api/users/suggested"],
    queryFn: getQueryFn()
  });

  const { data: searchResults = [] } = useQuery<SuggestedUser[]>({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: getQueryFn(),
    enabled: searchQuery.length > 2
  });

  const { data: trendingHashtags = [] } = useQuery<TrendingHashtag[]>({
    queryKey: ["/api/hashtags/trending"],
    queryFn: getQueryFn()
  });

  const { data: nearbyUsers = [] } = useQuery<SuggestedUser[]>({
    queryKey: ["/api/users/nearby"],
    queryFn: getQueryFn()
  });

  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/nearby"] });
      toast({
        title: "Following user",
        description: "You are now following this user"
      });
    }
  });

  const handleFollow = (userId: number) => {
    followMutation.mutate(userId);
  };

  const UserCard = ({ user }: { user: SuggestedUser }) => (
    <Card className="hover:shadow-md transition-all duration-300 border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-primary/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={user.profileImage || ""} alt={user.username} className="object-cover" />
              <AvatarFallback className="bg-primary/5 text-primary font-bold text-lg">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {user.isFollowing && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white dark:border-zinc-950">
                <UserCheck className="h-3 w-3" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-bold text-lg truncate text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  {user.fullName || user.username}
                </h4>
                <p className="text-sm text-zinc-500 font-medium">@{user.username}</p>
              </div>
              
              <Button
                size="sm"
                variant={user.isFollowing ? "outline" : "default"}
                onClick={() => handleFollow(user.id)}
                disabled={followMutation.isPending || user.isFollowing}
                className={`transition-all duration-300 min-w-[100px] h-9 font-semibold ${
                  user.isFollowing 
                    ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500" 
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                }`}
              >
                {user.isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
            
            {user.bio && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                {user.bio}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[13px] text-zinc-500 font-medium">
              {user.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                <span>{user.followersCount} followers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-zinc-400" />
                <span>{user.postsCount} posts</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">Discover People</h2>
            <p className="text-sm text-zinc-500 mt-1.5 font-medium">Find and follow fellow cricket enthusiasts</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-base shadow-sm"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-8 bg-transparent border-b border-zinc-100 dark:border-zinc-900 rounded-none h-auto p-0 mb-6 flex overflow-x-auto no-scrollbar">
            {["suggested", "search", "nearby", "trending"].map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab} 
                className="px-1 py-4 text-[15px] font-bold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none transition-all capitalize"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="suggested" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            {suggestedUsers.length === 0 ? (
              <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/50">
                <Users className="h-16 w-16 mx-auto text-zinc-300 dark:text-zinc-800 mb-4" />
                <p className="text-zinc-500 font-semibold text-lg">No suggestions available</p>
                <p className="text-zinc-400 text-sm mt-1">Try again later or search for specific users</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {suggestedUsers.slice(0, 8).map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            {searchQuery.length <= 2 ? (
              <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/50">
                <Search className="h-16 w-16 mx-auto text-zinc-300 dark:text-zinc-800 mb-4" />
                <p className="text-zinc-500 font-semibold text-lg">Type to search users</p>
                <p className="text-zinc-400 text-sm mt-1">Enter at least 3 characters to start searching</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/50">
                <Search className="h-16 w-16 mx-auto text-zinc-300 dark:text-zinc-800 mb-4" />
                <p className="text-zinc-500 font-semibold text-lg">No users found</p>
                <p className="text-zinc-400 text-sm mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {searchResults.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="nearby" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/50">
              <MapPin className="h-16 w-16 mx-auto text-zinc-300 dark:text-zinc-800 mb-4" />
              <p className="text-zinc-500 font-semibold text-lg">No nearby users found</p>
              <p className="text-zinc-400 text-sm mt-1">Enable location services to find cricket fans near you</p>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid gap-3">
              {trendingHashtags.length === 0 ? (
                <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/50">
                  <Star className="h-16 w-16 mx-auto text-zinc-300 dark:text-zinc-800 mb-4" />
                  <p className="text-zinc-500 font-semibold text-lg">No trending hashtags</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {trendingHashtags.slice(0, 10).map((hashtag, index) => (
                    <div
                      key={hashtag.tag}
                      className="flex items-center justify-between p-5 bg-white dark:bg-zinc-950 rounded-2xl hover:shadow-lg transition-all duration-300 border border-zinc-100 dark:border-zinc-800 group cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-11 h-11 bg-primary/5 rounded-2xl text-[15px] font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base">#{hashtag.tag}</p>
                          <p className="text-[13px] text-zinc-500 font-medium">
                            {hashtag.count} posts this week
                          </p>
                        </div>
                      </div>
                      
                      {hashtag.growth > 0 && (
                        <Badge className="bg-green-100/80 hover:bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-none px-3 py-1 font-bold text-xs rounded-full">
                          +{hashtag.growth}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}