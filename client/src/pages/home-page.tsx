import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Post, User } from "@shared/schema";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { StoryCircle } from "@/components/story-circle";
import { MatchHighlights } from "@/components/match-highlights";
import { CommentsDialog } from "@/components/comments-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { CreatePostModal } from "@/components/create-post-modal";

export default function HomePage() {
  const [selectedPost, setSelectedPost] = useState<Post & { 
    user: User; 
    likeCount: number; 
    commentCount: number; 
    hasLiked: boolean;
  } | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const { data: posts, isLoading, error } = useQuery<(Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean })[]>({
    queryKey: ["/api/posts"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // For stories, we'll just use the users from posts for this demo
  const storyUsers = posts ? Array.from(
    new Map(posts.map(post => [post.user.id, post.user]))
      .values()
  ).slice(0, 6) : [];

  const handleCommentClick = (post: Post & { user: User, likeCount: number, commentCount: number, hasLiked: boolean }) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <Header />
      
      <main className="flex-grow pt-16 pb-16 md:pb-0">
        <div className="container mx-auto max-w-5xl px-0 md:px-4 flex flex-col md:flex-row">
          {/* Feed Section */}
          <div className="w-full md:w-2/3 bg-white md:bg-transparent">
            {/* Match Highlights */}
            <div className="px-4 py-4 md:mt-4">
              <MatchHighlights />
            </div>

            {/* Stories */}
            <div className="px-4 py-4 bg-white border-b border-neutral-200 md:rounded-lg md:border overflow-x-auto custom-scrollbar">
              <div className="flex space-x-4">
                {isLoading ? (
                  // Loading skeletons for stories
                  Array(6).fill(0).map((_, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="mb-1 bg-neutral-200 w-16 h-16 rounded-full animate-pulse"></div>
                      <div className="w-12 h-3 bg-neutral-200 rounded animate-pulse"></div>
                    </div>
                  ))
                ) : (
                  <>
                    {storyUsers.map((user) => (
                      <StoryCircle key={user.id} user={user} hasStory={true} />
                    ))}
                    <div className="flex flex-col items-center cursor-pointer">
                      <div className="mb-1 bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-neutral-500">+</span>
                      </div>
                      <span className="text-xs">More</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Create Post Button */}
            <div className="px-4 py-3">
              <Button 
                className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white"
                onClick={() => setCreatePostOpen(true)}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Post
              </Button>
            </div>
            
            {/* Posts */}
            <div className="mt-2">
              {isLoading ? (
                // Loading skeletons for posts
                <div className="px-4 space-y-4">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                      <div className="p-3 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse mr-2"></div>
                        <div>
                          <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse mb-1"></div>
                          <div className="h-2 w-16 bg-neutral-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="w-full aspect-square bg-neutral-200 animate-pulse"></div>
                      <div className="p-3">
                        <div className="h-4 w-full bg-neutral-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                  <p className="text-red-500 font-medium">Error loading posts</p>
                  <p className="text-sm text-neutral-500 mt-1">Please try again later or check your connection</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : posts?.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-neutral-500">No posts yet. Start following cricket fans to see their posts!</p>
                  <Button 
                    className="mt-4 bg-[#FF5722] hover:bg-[#E64A19] text-white"
                    onClick={() => setCreatePostOpen(true)}
                  >
                    Create Your First Post
                  </Button>
                </div>
              ) : (
                posts?.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onCommentClick={() => handleCommentClick(post)}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="hidden md:block md:w-1/3">
            <Sidebar />
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
    </div>
  );
}
