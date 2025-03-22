import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";

export default function SuggestionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestedUsers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/suggested", { limit: 50 }],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const followMutation = useMutation({
    mutationFn: async (username: string) => {
      await apiRequest("POST", `/api/users/${username}/follow`);
      return username;
    },
    onSuccess: (username) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      toast({
        title: "Success",
        description: `You are now following ${username}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const handleFollow = (username: string) => {
    followMutation.mutate(username);
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold cricket-primary">Suggested Accounts</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestedUsers?.map((suggestedUser) => (
            <div 
              key={suggestedUser.id}
              className="flex items-center p-4 border border-[#1F3B4D]/10 rounded-lg cricket-surface-bg shadow-sm"
            >
              <Link href={`/profile/${suggestedUser.username}`}>
                <Avatar className="w-14 h-14 mr-4 cursor-pointer border-2 border-[#2E8B57]">
                  <AvatarImage 
                    src={suggestedUser.profileImage || "https://github.com/shadcn.png"} 
                    alt={suggestedUser.username} 
                  />
                  <AvatarFallback className="bg-[#2E8B57] text-white">
                    {suggestedUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-grow">
                <Link href={`/profile/${suggestedUser.username}`}>
                  <p className="font-semibold cursor-pointer cricket-primary">{suggestedUser.username}</p>
                </Link>
                <p className="text-sm text-neutral-500">{suggestedUser.fullName || suggestedUser.username}</p>
                {suggestedUser.bio && (
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{suggestedUser.bio}</p>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4 text-[#2E8B57] border-[#2E8B57] hover:bg-[#2E8B57] hover:text-white"
                onClick={() => handleFollow(suggestedUser.username)}
              >
                Follow
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}