import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Post, User } from "@shared/schema";
import { PostCard } from "@/components/post-card";
import { CommentsDialog } from "@/components/comments-dialog";
import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

type EnrichedPost = Post & {
  user: User;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
  isSaved: boolean;
};

export default function SavedPostsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedPost, setSelectedPost] = useState<EnrichedPost | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const { data: savedPosts, isLoading, error } = useQuery<EnrichedPost[]>({
    queryKey: ["/api/user/saved"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const handleCommentClick = (post: EnrichedPost) => {
    setSelectedPost(post);
    setCommentsOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Saved Posts</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load saved posts</p>
        </div>
      ) : savedPosts?.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-600 mb-2">No saved posts yet</h2>
          <p className="text-neutral-500">
            Save posts by tapping the bookmark icon on any post
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts?.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCommentClick={() => handleCommentClick(post)}
            />
          ))}
        </div>
      )}

      {selectedPost && (
        <CommentsDialog
          open={commentsOpen}
          onOpenChange={setCommentsOpen}
          post={selectedPost}
        />
      )}
    </div>
  );
}
