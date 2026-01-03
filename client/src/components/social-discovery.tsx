import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Search, UserPlus, MapPin, Trophy, Users, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="hover:shadow-md transition-shadow border-none shadow-sm bg-white dark:bg-zinc-950">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-14 w-14 border-2 border-primary/10">
            <AvatarImage src={user.profileImage || ""} alt={user.username} />
            <AvatarFallback className="bg-primary/5 text-primary font-bold">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base truncate text-zinc-900 dark:text-zinc-100">
                  {user.fullName || user.username}
                </h4>
                <p className="text-sm text-zinc-500 font-medium">@{user.username}</p>
              </div>
              
              <Button
                size="sm"
                variant={user.isFollowing ? "outline" : "default"}
                onClick={() => handleFollow(user.id)}
                disabled={followMutation.isPending || user.isFollowing}
                className={user.isFollowing ? "bg-zinc-100" : "bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-md font-semibold"}
              >
                {user.isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
            
            {user.bio && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2 leading-snug">
                {user.bio}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500 font-medium">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{user.followersCount} followers</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                <span>{user.postsCount} posts</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded-lg">
          <Users className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Discover People</h2>
      </div>
      
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-primary/20 transition-all"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-6 bg-transparent border-b border-zinc-100 dark:border-zinc-900 rounded-none h-auto p-0 mb-6">
            <TabsTrigger 
              value="suggested" 
              className="px-1 py-3 text-base font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none transition-all"
            >
              Suggested
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="px-1 py-3 text-base font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none transition-all"
            >
              Search
            </TabsTrigger>
            <TabsTrigger 
              value="nearby" 
              className="px-1 py-3 text-base font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none transition-all"
            >
              Nearby
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="px-1 py-3 text-base font-semibold border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none transition-all"
            >
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggested" className="space-y-4 outline-none">
            {suggestedUsers.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Users className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-500 font-medium">No suggestions available</p>
              </div>
            ) : (
              suggestedUsers.slice(0, 6).map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4 outline-none">
            {searchQuery.length <= 2 ? (
              <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Search className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-500 font-medium">Type to search users</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Search className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-500 font-medium">No users found</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent value="nearby" className="space-y-4 outline-none">
            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <MapPin className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">No nearby users found</p>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-4 outline-none">
            <div className="grid gap-3">
              {trendingHashtags.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Star className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
                  <p className="text-zinc-500 font-medium">No trending hashtags</p>
                </div>
              ) : (
                trendingHashtags.slice(0, 10).map((hashtag, index) => (
                  <div
                    key={hashtag.tag}
                    className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl hover:shadow-md transition-all border border-zinc-100 dark:border-zinc-900 group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/5 rounded-full text-sm font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">#{hashtag.tag}</p>
                        <p className="text-sm text-zinc-500 font-medium">
                          {hashtag.count} posts
                        </p>
                      </div>
                    </div>
                    
                    {hashtag.growth > 0 && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-none px-2.5 py-1">
                        +{hashtag.growth}%
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}