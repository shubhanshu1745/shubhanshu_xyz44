import { useState } from "react";
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
import { CricketProfileEditor } from "@/components/cricket-profile-editor";
import { 
  Grid3X3, 
  Bookmark, 
  Settings, 
  Tag, 
  Loader2, 
  MapPin,
  Link as LinkIcon,
  CalendarDays,
  UserPlus,
  MessageSquare,
  Bell,
  MoreHorizontal,
  Trophy,
  ActivitySquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { FollowListDialog } from "@/components/follow-list-dialog";
import { CommentsDialog } from "@/components/comments-dialog";
import { VerificationBadge } from "@/components/verification-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type UserProfileData = User & {
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  followRequestStatus?: string | null; // "pending", "accepted", or null
  canViewPosts?: boolean;
  isMutual?: boolean; // true if both users follow each other
  name?: string;
  website?: string;
  // Verification attributes
  isVerified?: boolean;
  // Cricket-specific attributes
  isPlayer?: boolean;
  isCoach?: boolean; 
  isFan?: boolean;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  preferredRole?: string | null;
  position?: string | null;
  favoriteTeam?: string | null;
  favoritePlayer?: string | null;
  favoriteTournament?: string | null;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // State for dialogs
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post & { 
    user: User; 
    likeCount: number; 
    commentCount: number; 
    hasLiked: boolean;
  } | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const isOwnProfile = user?.username === username;

  // Fetch mutual friends (only for other users' profiles)
  const { data: mutualFriendsData } = useQuery<{ mutualFriends: User[]; count: number }>({
    queryKey: [`/api/users/${username}/mutual-friends`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !isOwnProfile && !!username,
  });

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

  const { 
    data: savedPosts, 
    isLoading: isSavedPostsLoading 
  } = useQuery<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean, isSaved: boolean })[]>({
    queryKey: ["/api/user/saved"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isOwnProfile,
  });

  const { 
    data: taggedPosts, 
    isLoading: isTaggedPostsLoading 
  } = useQuery<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean, isSaved: boolean })[]>({
    queryKey: ["/api/user/tagged"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profile?.isFollowing) {
        // Unfollow
        await apiRequest("DELETE", `/api/users/${username}/follow`);
        return { isFollowing: false, status: null, action: "unfollow" };
      } else if (profile?.followRequestStatus === "pending") {
        // Cancel pending request
        await apiRequest("DELETE", `/api/users/${username}/follow-request`);
        return { isFollowing: false, status: null, action: "cancel" };
      } else {
        // Send follow request
        const response = await apiRequest("POST", `/api/users/${username}/follow`);
        const data = await response.json();
        return { isFollowing: data.status === "accepted", status: data.status, action: "follow" };
      }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/users/${username}`] });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      
      if (result.action === "cancel") {
        toast({
          title: "Request Cancelled",
          description: `Your follow request to ${username} has been cancelled.`,
        });
      } else if (result.status === "pending") {
        toast({
          title: "Follow Request Sent",
          description: `Your follow request to ${username} is pending approval.`,
        });
      } else if (result.isFollowing) {
        toast({
          title: "Following",
          description: `You are now following ${username}`,
        });
      } else {
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${username}`,
        });
      }
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

  const handlePostClick = (post: Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean }) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  };
  
  const handleCopyProfileLink = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${username}`;
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Profile link copied",
        description: "Profile link copied to clipboard"
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy profile link to clipboard",
        variant: "destructive"
      });
    }
  };
  
  const blockMutation = useMutation({
    mutationFn: async () => {
      if (profile?.isBlocked) {
        await apiRequest("DELETE", `/api/users/${username}/block`);
        return false;
      } else {
        await apiRequest("POST", `/api/users/${username}/block`);
        return true;
      }
    },
    onMutate: async () => {
      // Optimistic update
      if (profile) {
        const updatedProfile = {
          ...profile,
          isBlocked: !profile.isBlocked,
        };
        queryClient.setQueryData([`/api/users/${username}`], updatedProfile);
      }
    },
    onSuccess: (isBlocked) => {
      toast({
        title: isBlocked ? "User Blocked" : "User Unblocked",
        description: isBlocked
          ? `You have blocked ${username}`
          : `You have unblocked ${username}`,
      });
      if (isBlocked) {
        setLocation("/"); // Redirect to home page after blocking
      }
    },
    onError: (error) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      toast({
        title: "Error",
        description: "Failed to update block status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  const handleBlockUser = () => {
    blockMutation.mutate();
  };

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
                    <div className="flex items-center gap-2 mb-3 md:mb-0 md:mr-4">
                      <h1 className="text-xl font-semibold">{profile.username}</h1>
                      {profile.isVerified && <VerificationBadge type="verified" size="md" />}
                      {profile.isPlayer && <VerificationBadge type="professional" size="md" />}
                      {profile.isCoach && <VerificationBadge type="coach" size="md" />}
                    </div>
                    
                    {isOwnProfile ? (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="text-sm font-semibold"
                          onClick={() => setEditProfileOpen(true)}
                        >
                          Edit Profile
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Settings className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Account Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSettingsOpen(true);
                              // This will be used in the future to automatically navigate to the notifications tab
                            }}>
                              <Bell className="h-4 w-4 mr-2" />
                              Notifications
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyProfileLink}>
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Copy Profile Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant={isFollowing || profile?.followRequestStatus === "pending" ? "outline" : "default"}
                          className={!isFollowing && profile?.followRequestStatus !== "pending" ? "bg-[#FF5722] hover:bg-[#E64A19] text-white text-sm font-semibold" : "text-sm font-semibold"}
                          onClick={handleFollowToggle}
                          disabled={followMutation.isPending}
                        >
                          {followMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : isFollowing ? (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Following
                            </>
                          ) : profile?.followRequestStatus === "pending" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1" />
                              Requested
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="text-sm font-semibold"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleCopyProfileLink}>
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Copy Profile Link
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={handleBlockUser} disabled={blockMutation.isPending}>
                              {blockMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Bell className="h-4 w-4 mr-2" />
                              )}
                              {profile?.isBlocked ? "Unblock User" : "Block User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-6 mb-4">
                    <div>
                      <span className="font-semibold">{profile.postCount}</span> posts
                    </div>
                    <div 
                      className="cursor-pointer hover:underline"
                      onClick={() => setFollowersOpen(true)}
                    >
                      <span className="font-semibold">{profile.followerCount}</span> followers
                    </div>
                    <div 
                      className="cursor-pointer hover:underline"
                      onClick={() => setFollowingOpen(true)}
                    >
                      <span className="font-semibold">{profile.followingCount}</span> following
                    </div>
                  </div>

                  {/* Mutual Friends Display */}
                  {!isOwnProfile && mutualFriendsData && mutualFriendsData.count > 0 && (
                    <div className="mb-4 text-sm text-neutral-600">
                      <span className="font-medium">Followed by </span>
                      {mutualFriendsData.mutualFriends.slice(0, 3).map((friend, index) => (
                        <span key={friend.id}>
                          <a 
                            href={`/profile/${friend.username}`} 
                            className="font-semibold hover:underline"
                          >
                            {friend.username}
                          </a>
                          {index < Math.min(mutualFriendsData.mutualFriends.length, 3) - 1 && ", "}
                        </span>
                      ))}
                      {mutualFriendsData.count > 3 && (
                        <span> + {mutualFriendsData.count - 3} more you follow</span>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <p className="font-semibold">{profile.name || profile.fullName}</p>
                    <p className="whitespace-pre-line">{profile.bio || "No bio yet."}</p>
                    
                    <div className="mt-2 space-y-1">
                      {profile.website && (
                        <div className="flex items-center text-sm">
                          <LinkIcon className="h-3.5 w-3.5 mr-2 text-neutral-500" />
                          <a 
                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {profile.website}
                          </a>
                        </div>
                      )}
                      
                      {profile.location && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3.5 w-3.5 mr-2 text-neutral-500" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-neutral-500">
                        <CalendarDays className="h-3.5 w-3.5 mr-2" />
                        <span>Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
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
                  <TabsTrigger value="stats" className="flex items-center gap-2 py-3">
                    <Trophy className="h-4 w-4" />
                    <span className="hidden sm:inline">CRICKET STATS</span>
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
                      {isOwnProfile && (
                        <Button 
                          className="mt-4 bg-[#FF5722] hover:bg-[#E64A19] text-white"
                          onClick={() => setLocation("/")}
                        >
                          Create Your First Post
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                      {posts?.map(post => (
                        <div 
                          key={post.id} 
                          className="aspect-square bg-neutral-100 overflow-hidden cursor-pointer relative group"
                          onClick={() => handlePostClick(post)}
                        >
                          {post.imageUrl ? (
                            <>
                              <img 
                                src={post.imageUrl} 
                                alt="Post" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex space-x-6 text-white font-semibold">
                                  <div className="flex items-center">
                                    <span className="mr-1">❤️</span>
                                    <span>{post.likeCount}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="mr-1">💬</span>
                                    <span>{post.commentCount}</span>
                                  </div>
                                </div>
                              </div>
                            </>
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
                  {!isOwnProfile ? (
                    <div className="text-center py-10">
                      <p className="text-neutral-500">Only you can see your saved posts.</p>
                    </div>
                  ) : isSavedPostsLoading ? (
                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                      {Array(6).fill(0).map((_, index) => (
                        <div 
                          key={index} 
                          className="aspect-square bg-neutral-200 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : savedPosts?.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-neutral-500">No saved posts yet.</p>
                      <p className="text-sm text-neutral-400 mt-2">Save posts by clicking the bookmark icon.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                      {savedPosts?.map(post => (
                        <div 
                          key={post.id} 
                          className="aspect-square bg-neutral-100 overflow-hidden cursor-pointer relative group"
                          onClick={() => handlePostClick(post)}
                        >
                          {post.imageUrl ? (
                            <>
                              <img 
                                src={post.imageUrl} 
                                alt="Post" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex space-x-6 text-white font-semibold">
                                  <div className="flex items-center">
                                    <span className="mr-1">❤️</span>
                                    <span>{post.likeCount}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="mr-1">💬</span>
                                    <span>{post.commentCount}</span>
                                  </div>
                                </div>
                              </div>
                            </>
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
                
                <TabsContent value="tagged" className="mt-4">
                  {!isOwnProfile ? (
                    <div className="text-center py-10">
                      <p className="text-neutral-500">Only you can see posts you're tagged in.</p>
                    </div>
                  ) : isTaggedPostsLoading ? (
                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                      {Array(6).fill(0).map((_, index) => (
                        <div 
                          key={index} 
                          className="aspect-square bg-neutral-200 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : taggedPosts?.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-neutral-500">No tagged posts yet.</p>
                      <p className="text-sm text-neutral-400 mt-2">When someone tags you in a post, it will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 md:gap-4">
                      {taggedPosts?.map(post => (
                        <div 
                          key={post.id} 
                          className="aspect-square bg-neutral-100 overflow-hidden cursor-pointer relative group"
                          onClick={() => handlePostClick(post)}
                        >
                          {post.imageUrl ? (
                            <>
                              <img 
                                src={post.imageUrl} 
                                alt="Post" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex space-x-6 text-white font-semibold">
                                  <div className="flex items-center">
                                    <span className="mr-1">❤️</span>
                                    <span>{post.likeCount}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="mr-1">💬</span>
                                    <span>{post.commentCount}</span>
                                  </div>
                                </div>
                              </div>
                            </>
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

                <TabsContent value="stats" className="mt-4">
                  <div className="p-6 bg-white rounded-md shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <ActivitySquare className="h-12 w-12 text-primary" />
                      <div>
                        <h3 className="text-xl font-bold">Cricket Statistics</h3>
                        <p className="text-muted-foreground">View detailed cricket performance metrics</p>
                      </div>
                      
                      {isOwnProfile && (
                        <div className="ml-auto">
                          <CricketProfileEditor />
                        </div>
                      )}
                    </div>
                    
                    {profile?.isPlayer ? (
                      <>
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-md text-center">
                            <h4 className="font-semibold text-lg">Batting Style</h4>
                            <p>{profile.battingStyle ? profile.battingStyle.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not specified'}</p>
                          </div>
                          <div className="p-4 border rounded-md text-center">
                            <h4 className="font-semibold text-lg">Bowling Style</h4>
                            <p>{profile.bowlingStyle ? profile.bowlingStyle.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not specified'}</p>
                          </div>
                          <div className="p-4 border rounded-md text-center">
                            <h4 className="font-semibold text-lg">Preferred Role</h4>
                            <p>{profile.preferredRole ? profile.preferredRole.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not specified'}</p>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h4 className="font-semibold text-lg mb-2">Cricket Preferences</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 border rounded-md">
                              <span className="block text-sm text-muted-foreground">Favorite Team</span>
                              <span>{profile.favoriteTeam || 'Not specified'}</span>
                            </div>
                            <div className="p-3 border rounded-md">
                              <span className="block text-sm text-muted-foreground">Favorite Player</span>
                              <span>{profile.favoritePlayer || 'Not specified'}</span>
                            </div>
                            <div className="p-3 border rounded-md">
                              <span className="block text-sm text-muted-foreground">Favorite Tournament</span>
                              <span>{profile.favoriteTournament || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => setLocation(`/player-stats/${username}`)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          View Cricket Stats Dashboard
                        </Button>
                      </>
                    ) : isOwnProfile ? (
                      <div className="text-center py-8">
                        <p className="mb-4 text-gray-600">You haven't set up your cricket profile yet.</p>
                        <p className="mb-6">
                          Complete your cricket profile to track your cricket stats, performance, 
                          and connect with other players and coaches.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600">This user hasn't set up their cricket profile yet.</p>
                      </div>
                    )}
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
      
      {/* Dialogs */}
      {profile && (
        <>
          <EditProfileDialog 
            open={editProfileOpen} 
            onOpenChange={setEditProfileOpen} 
            profile={profile} 
          />
          
          <SettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          />
          
          <FollowListDialog 
            open={followersOpen} 
            onOpenChange={setFollowersOpen} 
            username={username}
            listType="followers"
            userId={profile.id}
          />
          
          <FollowListDialog 
            open={followingOpen} 
            onOpenChange={setFollowingOpen} 
            username={username}
            listType="following"
            userId={profile.id}
          />
          
          {selectedPost && (
            <CommentsDialog 
              open={commentsOpen} 
              onOpenChange={setCommentsOpen} 
              post={selectedPost} 
            />
          )}
        </>
      )}
    </div>
  );
}
