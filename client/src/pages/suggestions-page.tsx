import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useSearch } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface SearchUser extends User {
  followersCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

export default function SuggestionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get search query from URL
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search users query
  const { data: searchData, isLoading: isSearching } = useQuery<{ users: SearchUser[] }>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length >= 1,
  });

  const { data: suggestedUsers, isLoading: isLoadingSuggested } = useQuery<SearchUser[]>({
    queryKey: ["/api/users/suggested", { limit: 50 }],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: debouncedQuery.length === 0,
  });

  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      await apiRequest("POST", `/api/users/${username}/follow`);
      return username;
    },
    onSuccess: (username) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search"] });
      toast({
        title: "Success",
        description: `You are now following ${username}`,
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to follow user";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleFollow = (username: string) => {
    followMutation.mutate(username);
  };
  
  const isLoading = debouncedQuery.length >= 1 ? isSearching : isLoadingSuggested;
  const displayUsers = debouncedQuery.length >= 1 ? (searchData?.users || []) : (suggestedUsers || []);

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold cricket-primary">
          {debouncedQuery ? "Search Results" : "Suggested Accounts"}
        </h1>
      </div>
      
      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search users by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {debouncedQuery 
              ? `No users found for "${debouncedQuery}"` 
              : "No suggested users available"}
          </p>
          {debouncedQuery && (
            <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayUsers.map((user) => (
            <div 
              key={user.id}
              className="flex items-center p-4 border border-[#1F3B4D]/10 rounded-lg cricket-surface-bg shadow-sm"
            >
              <Link href={`/profile/${user.username}`}>
                <Avatar className="w-14 h-14 mr-4 cursor-pointer border-2 border-[#2E8B57]">
                  <AvatarImage 
                    src={user.profileImage || "https://github.com/shadcn.png"} 
                    alt={user.username} 
                  />
                  <AvatarFallback className="bg-[#2E8B57] text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-grow min-w-0">
                <Link href={`/profile/${user.username}`}>
                  <p className="font-semibold cursor-pointer cricket-primary truncate">{user.username}</p>
                </Link>
                <p className="text-sm text-neutral-500 truncate">{user.fullName || user.username}</p>
                {user.bio && (
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{user.bio}</p>
                )}
                {(user.followersCount !== undefined || user.postsCount !== undefined) && (
                  <p className="text-xs text-neutral-400 mt-1">
                    {user.followersCount || 0} followers · {user.postsCount || 0} posts
                  </p>
                )}
              </div>
              {user.isFollowing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4 text-gray-500 border-gray-300"
                  disabled
                >
                  Following
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4 text-[#2E8B57] border-[#2E8B57] hover:bg-[#2E8B57] hover:text-white"
                  onClick={() => handleFollow(user.username)}
                  disabled={followMutation.isPending}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}