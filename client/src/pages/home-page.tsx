import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Post, User, Story } from "@shared/schema";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { EnhancedPostCard } from "@/components/enhanced-post-card";
import { StoriesContainer } from "@/components/enhanced-stories";
import { LiveActivityFeed } from "@/components/live-activity-feed";
import { SocialDiscovery } from "@/components/social-discovery";
import { CommentsDialog } from "@/components/comments-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, AlertCircle, Trophy, Play, TrendingUp, Sparkles, Users } from "lucide-react";
import { CreatePostModal } from "@/components/create-post-modal";
import { CreateStoryDialog } from "@/components/create-story-dialog";
import { StoryViewer } from "@/components/story-viewer";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<Post & { 
    user: User; 
    likeCount: number; 
    commentCount: number; 
    hasLiked: boolean;
  } | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryUserIndex, setSelectedStoryUserIndex] = useState(0);

  // Query posts
  const { data: posts, isLoading, error } = useQuery<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean, isLiked?: boolean, isSaved?: boolean })[]>({
    queryKey: ["/api/posts"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Query stories
  const { data: stories, isLoading: isStoriesLoading } = useQuery<(Story & { user: User })[]>({
    queryKey: ["/api/stories"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  // Group stories by user
  const storyUserMap = new Map<number, (Story & { user: User })[]>();
  const storyUsers: User[] = [];
  
  if (stories?.length) {
    stories.forEach(story => {
      // Skip stories without user data
      if (!story?.user?.id) return;
      
      if (!storyUserMap.has(story.user.id)) {
        storyUserMap.set(story.user.id, []);
        storyUsers.push(story.user);
      }
      storyUserMap.get(story.user.id)?.push(story);
    });
  }
  
  const allStories = stories || [];

  const handleCommentClick = (post: Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean }) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Header />
      
      <main className="flex-grow pt-16 pb-20 md:pb-6">
        <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Sidebar - Social Discovery */}
            <aside className="hidden lg:block w-[320px] flex-shrink-0">
              <div className="sticky top-20 space-y-4">
                <SocialDiscovery />
              </div>
            </aside>
            
            {/* Main Feed Section */}
            <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
              
              {/* Match Highlights Card */}
              <Card className="mb-4 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#1F3B4D] via-[#2a4a5f] to-[#1F3B4D]">
                <CardContent className="p-0">
                  <div className="relative p-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Match Highlights</h2>
                          <p className="text-white/70 text-sm mt-0.5">Watch the best moments</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Matches Card */}
              <Card className="mb-4 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-[#2E7D32] via-[#388E3C] to-[#2E7D32]">
                <CardContent className="p-0">
                  <div className="relative p-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">Recent Matches</h2>
                          <p className="text-white/70 text-sm mt-0.5">Live scores & updates</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-full border border-white/30">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stories Section */}
              <Card className="mb-4 border-0 shadow-md bg-white">
                <CardContent className="p-0">
                  <StoriesContainer 
                    onCreateStory={() => setCreateStoryOpen(true)}
                  />
                </CardContent>
              </Card>
              
              {/* Create Post Button */}
              <Card className="mb-4 border-0 shadow-md bg-white overflow-hidden">
                <CardContent className="p-4">
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#FF5722] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={() => setCreatePostOpen(true)}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Post
                  </Button>
                </CardContent>
              </Card>
              
              {/* Posts Feed */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, index) => (
                      <Card key={index} className="border-0 shadow-md bg-white overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                            <div className="flex-1">
                              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mb-2" />
                              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                            </div>
                          </div>
                          <div className="w-full aspect-square bg-slate-200 animate-pulse" />
                          <div className="p-4 space-y-2">
                            <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                            <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  <Card className="border-0 shadow-md bg-white">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                      </div>
                      <p className="text-red-600 font-semibold text-lg">Error loading posts</p>
                      <p className="text-slate-500 mt-2">Please try again later or check your connection</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => window.location.reload()}
                      >
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                ) : posts?.length === 0 ? (
                  <Card className="border-0 shadow-md bg-white">
                    <CardContent className="p-8 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <Sparkles className="h-10 w-10 text-orange-500" />
                      </div>
                      <p className="text-slate-700 font-semibold text-lg">No posts yet. Start following cricket fans to see their posts!</p>
                      <Button 
                        className="mt-4 bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#FF5722] text-white"
                        onClick={() => setCreatePostOpen(true)}
                      >
                        Create Your First Post
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {posts?.map((post) => (
                      <EnhancedPostCard 
                        key={post.id}
                        post={{
                          ...post,
                          isLiked: post.isLiked ?? post.hasLiked ?? false,
                          isSaved: post.isSaved ?? false
                        }} 
                        onCommentClick={() => handleCommentClick(post)}
                        className="rounded-xl shadow-md border-0 overflow-hidden"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Sidebar - Live Activity */}
            <aside className="hidden lg:block w-[320px] flex-shrink-0">
              <div className="sticky top-20">
                <LiveActivityFeed />
              </div>
            </aside>
          </div>
        </div>
      </main>
      
      <MobileNav />

      {/* Modals and Dialogs */}
      {selectedPost && (
        <CommentsDialog 
          open={commentsOpen} 
          onOpenChange={setCommentsOpen} 
          post={selectedPost} 
        />
      )}

      <CreatePostModal 
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
      />
      
      <CreateStoryDialog
        open={createStoryOpen}
        onOpenChange={setCreateStoryOpen}
      />
      
      {allStories.length > 0 && (
        <StoryViewer
          open={storyViewerOpen}
          onOpenChange={setStoryViewerOpen}
          stories={allStories}
          initialStoryIndex={selectedStoryUserIndex}
        />
      )}
    </div>
  );
}
