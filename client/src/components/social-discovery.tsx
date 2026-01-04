import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Search, MapPin, Trophy, Users, Star, UserCheck, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

  const { data: suggestedUsers = [], isLoading: isLoadingSuggested } = useQuery<SuggestedUser[]>({
    queryKey: ["/api/users/suggested"],
    queryFn: getQueryFn()
  });

  const { data: searchData, isLoading: isSearching } = useQuery<{ users: SuggestedUser[] }>({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: searchQuery.length > 2
  });

  const searchResults = searchData?.users || [];

  const { data: trendingHashtags = [] } = useQuery<TrendingHashtag[]>({
    queryKey: ["/api/hashtags/trending"],
    queryFn: getQueryFn()
  });

  // Follow mutation - uses username in the URL
  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      return await apiRequest("POST", `/api/users/${username}/follow`);
    },
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search"] });
      toast({
        title: "Following!",
        description: `You are now following @${username}`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (username: string) => {
      return await apiRequest("DELETE", `/api/users/${username}/follow`);
    },
    onSuccess: (_, username) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search"] });
      toast({
        title: "Unfollowed",
        description: `You unfollowed @${username}`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleFollow = (username: string, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowMutation.mutate(username);
    } else {
      followMutation.mutate(username);
    }
  };

  // Compact User Card for sidebar
  const CompactUserCard = ({ user }: { user: SuggestedUser }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
          <AvatarImage src={user.profileImage || ""} alt={user.username} className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {user.isFollowing && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
            <UserCheck className="h-2.5 w-2.5" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 truncate">
          @{user.username}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {user.fullName || user.bio || "Cricket enthusiast"}
        </p>
        {user.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-400 truncate">{user.location}</span>
          </div>
        )}
      </div>
      
      <Button
        size="sm"
        variant={user.isFollowing ? "outline" : "default"}
        onClick={(e) => {
          e.stopPropagation();
          handleFollow(user.username, user.isFollowing);
        }}
        disabled={followMutation.isPending || unfollowMutation.isPending}
        className={`flex-shrink-0 h-8 px-3 text-xs font-semibold transition-all ${
          user.isFollowing 
            ? "bg-slate-100 border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200" 
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        }`}
      >
        {user.isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );

  // Horizontal scrollable user card
  const HorizontalUserCard = ({ user }: { user: SuggestedUser }) => (
    <div className="flex-shrink-0 w-[140px] p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-14 w-14 border-2 border-white shadow-md mb-2">
          <AvatarImage src={user.profileImage || ""} alt={user.username} className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-sm text-slate-800 truncate w-full">
          @{user.username}
        </p>
        <p className="text-xs text-slate-500 truncate w-full mb-2">
          {user.location || "Cricket fan"}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span>{user.followersCount || 0} followers</span>
        </div>
        <Button
          size="sm"
          variant={user.isFollowing ? "outline" : "default"}
          onClick={() => handleFollow(user.username, user.isFollowing)}
          disabled={followMutation.isPending || unfollowMutation.isPending}
          className={`w-full h-7 text-xs font-semibold ${
            user.isFollowing 
              ? "bg-slate-100 border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {user.isFollowing ? "Following" : "Follow"}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={`border-0 shadow-lg bg-white overflow-hidden ${className}`}>
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Discover People</h2>
            <p className="text-xs text-slate-500">Find and follow fellow cricket enthusiasts</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-5 pb-5">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl h-auto mb-4">
            <TabsTrigger 
              value="suggested" 
              className="text-xs py-2 px-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              Suggested
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="text-xs py-2 px-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              Search
            </TabsTrigger>
            <TabsTrigger 
              value="nearby" 
              className="text-xs py-2 px-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              Nearby
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="text-xs py-2 px-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggested" className="mt-0 space-y-1">
            {/* Horizontal scroll for first few users */}
            {suggestedUsers.length > 0 && (
              <ScrollArea className="w-full whitespace-nowrap mb-3">
                <div className="flex gap-3 pb-2">
                  {suggestedUsers.slice(0, 6).map((user) => (
                    <HorizontalUserCard key={user.id} user={user} />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-2" />
              </ScrollArea>
            )}
            
            {/* Vertical list */}
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {isLoadingSuggested ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                      </div>
                      <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">No suggestions available</p>
                </div>
              ) : (
                suggestedUsers.slice(0, 8).map((user) => (
                  <CompactUserCard key={user.id} user={user} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <div className="max-h-[350px] overflow-y-auto space-y-1">
              {searchQuery.length <= 2 ? (
                <div className="text-center py-8">
                  <Search className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">Type to search users</p>
                  <p className="text-slate-400 text-xs mt-1">Enter at least 3 characters</p>
                </div>
              ) : isSearching ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                      </div>
                      <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">No users found for "{searchQuery}"</p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <CompactUserCard key={user.id} user={user} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="nearby" className="mt-0">
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <MapPin className="h-7 w-7 text-green-500" />
              </div>
              <p className="text-slate-600 font-medium">Nearby Users</p>
              <p className="text-slate-400 text-xs mt-1">Enable location to find cricket fans near you</p>
              <Button variant="outline" size="sm" className="mt-3 text-xs">
                Enable Location
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {trendingHashtags.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 text-sm">No trending hashtags</p>
                </div>
              ) : (
                trendingHashtags.slice(0, 8).map((hashtag, index) => (
                  <div
                    key={hashtag.tag}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">#{hashtag.tag}</p>
                        <p className="text-xs text-slate-500">{hashtag.count} posts</p>
                      </div>
                    </div>
                    {hashtag.growth > 0 && (
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs font-semibold">
                        +{hashtag.growth}%
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
