import { useEffect, useState } from "react";
import { Tag as TagIcon, Plus, X } from "lucide-react";
import { Tag } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type PostTagsProps = {
  postId: number;
  isPostOwner: boolean;
};

export function PostTags({ postId, isPostOwner }: PostTagsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const queryClient = useQueryClient();

  // Fetch tags for this post
  const { data: postTags = [], isLoading: isLoadingPostTags } = useQuery({
    queryKey: ["/api/posts", postId, "tags"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/posts/${postId}/tags`);
      return response;
    },
    enabled: !!postId,
  });

  // Fetch all available tags
  const { data: allTags = [], isLoading: isLoadingAllTags } = useQuery({
    queryKey: ["/api/tags"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tags");
      return response;
    },
    enabled: isDialogOpen,
  });

  // Add tag to post
  const addTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      return await apiRequest("POST", `/api/posts/${postId}/tags`, { tagId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "tags"] });
      toast({
        title: "Tag added",
        description: "Tag was successfully added to the post",
      });
      setSelectedTag(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add tag to post",
        variant: "destructive",
      });
    },
  });

  // Remove tag from post
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      return await apiRequest("DELETE", `/api/posts/${postId}/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "tags"] });
      toast({
        title: "Tag removed",
        description: "Tag was successfully removed from the post",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove tag from post",
        variant: "destructive",
      });
    },
  });

  const handleAddTag = () => {
    if (selectedTag) {
      addTagMutation.mutate(selectedTag.id);
      setIsDialogOpen(false);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    removeTagMutation.mutate(tagId);
  };

  // Filter out tags that are already added to the post
  const availableTags = allTags.filter(
    (tag: Tag) => !postTags.some((postTag: Tag) => postTag.id === tag.id)
  );

  return (
    <div className="flex flex-wrap items-center mt-1 mb-2">
      {isLoadingPostTags ? (
        <div className="text-xs text-neutral-400">Loading tags...</div>
      ) : postTags.length > 0 ? (
        <>
          {postTags.map((tag: Tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="bg-[#f8f5ff] text-[#5b33b9] border-[#e2d7ff] mr-1 mb-1"
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag.name}
              {isPostOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tag.id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove tag</span>
                </Button>
              )}
            </Badge>
          ))}
        </>
      ) : (
        <div className="text-xs text-neutral-400 mr-2">No tags</div>
      )}

      {isPostOwner && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 rounded-full text-xs mb-1"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Tags to Post</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {isLoadingAllTags ? (
                <div className="text-center py-4">Loading available tags...</div>
              ) : (
                <Command>
                  <CommandInput placeholder="Search tags..." />
                  <CommandList>
                    <CommandEmpty>No tags found.</CommandEmpty>
                    <CommandGroup>
                      {availableTags.length > 0 ? (
                        availableTags.map((tag: Tag) => (
                          <CommandItem
                            key={tag.id}
                            onSelect={() => setSelectedTag(tag)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center">
                              <TagIcon className="h-4 w-4 mr-2 text-primary" />
                              <span>{tag.name}</span>
                            </div>
                            {tag.type && (
                              <Badge variant="outline" className="text-xs">
                                {tag.type}
                              </Badge>
                            )}
                          </CommandItem>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground">
                          All available tags are already added to this post.
                        </div>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}

              <div className="mt-4">
                {selectedTag && (
                  <div className="mb-4">
                    <div className="text-sm font-medium">Selected tag:</div>
                    <Badge className="mt-1">
                      <TagIcon className="h-3 w-3 mr-1" />
                      {selectedTag.name}
                    </Badge>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddTag}
                    disabled={!selectedTag || addTagMutation.isPending}
                  >
                    {addTagMutation.isPending ? "Adding..." : "Add Tag"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}