import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { User, Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, Bookmark, Settings, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserProfileData = User & {
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  const { 
    data: profile, 
    isLoading: isProfileLoading 
  } = useQuery<UserProfileData>({
    queryKey: [`/api/users/${username}`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { 
    data: posts, 
    isLoading: isPostsLoading 
  } = useQuery<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>({
    queryKey: [`/api/users/${username}/posts`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!username,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profile?.isFollowing) {
        await apiRequest("DELETE", `/api/users/${username}/follow`);
        return false;
      } else {
        await apiRequest("POST", `/api/users/${username}/follow`);
        return true;
      }
    },
    onMutate: async () => {
      // Optimistic update
      if (profile) {
        const updatedProfile = {
          ...profile,
          isFollowing: !profile.isFollowing,
          followerCount: profile.isFollowing ? profile.followerCount - 1 : profile.followerCount + 1
        };
        queryClient.setQueryData([`/api/users/${username}`], updatedProfile);
      }
    },
    onSuccess: (isFollowing) => {
      toast({
        title: isFollowing ? "Following" : "Unfollowed",
        description: isFollowing 
          ? `You are now following ${username}` 
          : `You are no longer following ${username}`,
      });
    },
    onError: (error) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  const handleFollowToggle = () => {
    followMutation.mutate();
  };

  const isOwnProfile = user?.username === username;
  const isFollowing = profile?.isFollowing;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header />
      
      <main className="flex-grow pt-16 pb-16 md:pb-0">
        <div className="container mx-auto max-w-5xl px-4">
          {isProfileLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : profile ? (
            <>
              {/* Profile Header */}
              <div className="py-8 flex flex-col md:flex-row items-center md:items-start">
                <div className="mb-6 md:mb-0 md:mr-10">
                  <Avatar className="h-24 w-24 md:h-36 md:w-36">
                    <AvatarImage 
                      src={profile.profileImage || "https://github.com/shadcn.png"} 
                      alt={profile.username} 
                    />
                    <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center mb-4">
                    <h1 className="text-xl font-semibold mb-3 md:mb-0 md:mr-4">{profile.username}</h1>
                    
                    {isOwnProfile ? (
                      <div className="flex gap-2">
                        <Button variant="outline" className="text-sm font-semibold">
                          Edit Profile
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant={isFollowing ? "outline" : "default"}
                          className="text-sm font-semibold"
                          onClick={handleFollowToggle}
                          disabled={followMutation.isPending}
                        >
                          {followMutation.isPending ? 
                            <Loader2 className="h-4 w-4 animate-spin mr-1" /> : 
                            null}
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                        <Button variant="outline" className="text-sm font-semibold">
                          Message
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-6 mb-4">
                    <div>
                      <span className="font-semibold">{profile.postCount}</span> posts
                    </div>
                    <div className="cursor-pointer">
                      <span className="font-semibold">{profile.followerCount}</span> followers
                    </div>
                    <div className="cursor-pointer">
                      <span className="font-semibold">{profile.followingCount}</span> following
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-semibold">{profile.fullName}</p>
                    <p>{profile.bio || "No bio yet."}</p>
                    {profile.location && (
                      <p className="text-sm text-neutral-500 mt-1">📍 {profile.location}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Profile Tabs */}
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full flex justify-center border-t">
                  <TabsTrigger value="posts" className="flex items-center gap-2 py-3">
                    <Grid3X3 className="h-4 w-4" />
                    <span className="hidden sm:inline">POSTS</span>
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="flex items-center gap-2 py-3">
                    <Bookmark className="h-4 w-4" />
                    <span className="hidden sm:inline">SAVED</span>
                  </TabsTrigger>
                  <TabsTrigger value="tagged" className="flex items-center gap-2 py-3">
                    <Tag className="h-4 w-4" />
                    <span className="hidden sm:inline">TAGGED</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="posts" className="mt-4">
                  {isPostsLoading ? (
                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                      {Array(6).fill(0).map((_, index) => (
                        <div 
                          key={index} 
                          className="aspect-square bg-neutral-200 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : posts?.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-neutral-500">No posts yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                      {posts?.map(post => (
                        <div 
                          key={post.id} 
                          className="aspect-square bg-neutral-100 overflow-hidden cursor-pointer"
                          onClick={() => {/* Open post detail */}}
                        >
                          {post.imageUrl ? (
                            <img 
                              src={post.imageUrl} 
                              alt="Post" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <p className="text-sm">No image</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="saved" className="mt-4">
                  <div className="text-center py-10">
                    <p className="text-neutral-500">No saved posts yet.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="tagged" className="mt-4">
                  <div className="text-center py-10">
                    <p className="text-neutral-500">No tagged posts yet.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-neutral-500">User not found.</p>
              <Button 
                className="mt-4"
                onClick={() => setLocation("/")}
              >
                Return to Home
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
