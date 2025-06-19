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

  const unfollowMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/nearby"] });
      toast({
        title: "Unfollowed user",
        description: "You are no longer following this user"
      });
    }
  });

  const handleFollow = (userId: number, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  const UserCard = ({ user }: { user: SuggestedUser }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profileImage || ""} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold truncate">
                  {user.fullName || user.username}
                </h4>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
              
              <Button
                size="sm"
                variant={user.isFollowing ? "outline" : "default"}
                onClick={() => handleFollow(user.id, user.isFollowing)}
                disabled={followMutation.isPending || unfollowMutation.isPending}
              >
                {user.isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
            
            {user.bio && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}
            
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              {user.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{user.followersCount} followers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="h-3 w-3" />
                <span>{user.postsCount} posts</span>
              </div>
            </div>
            
            {user.mutualFollowers > 0 && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {user.mutualFollowers} mutual followers
                </Badge>
              </div>
            )}
            
            {user.commonInterests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.commonInterests.slice(0, 3).map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Discover People</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="suggested">Suggested</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="nearby">Nearby</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
              </TabsList>

              <TabsContent value="suggested" className="space-y-3 mt-4">
                {suggestedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No suggestions available</p>
                  </div>
                ) : (
                  suggestedUsers.slice(0, 6).map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="search" className="space-y-3 mt-4">
                {searchQuery.length <= 2 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Type to search users</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="nearby" className="space-y-3 mt-4">
                {nearbyUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No nearby users found</p>
                  </div>
                ) : (
                  nearbyUsers.slice(0, 6).map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-3 mt-4">
                <div className="grid gap-3">
                  {trendingHashtags.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No trending hashtags</p>
                    </div>
                  ) : (
                    trendingHashtags.slice(0, 10).map((hashtag, index) => (
                      <div
                        key={hashtag.tag}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">#{hashtag.tag}</p>
                            <p className="text-sm text-gray-500">
                              {hashtag.count} posts
                            </p>
                          </div>
                        </div>
                        
                        {hashtag.growth > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
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
        </CardContent>
      </Card>
    </div>
  );
}