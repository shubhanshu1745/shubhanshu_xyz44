import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Upload, X, Image } from "lucide-react";
import { CreateStoryFormData } from "@shared/schema";

// Create a form schema for the story creation
const storySchema = z.object({
  imageUrl: z.string().url("Please enter a valid URL").min(1, "Image URL is required"),
  caption: z.string().max(100, "Caption must be less than 100 characters").optional(),
});

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStoryDialog({ open, onOpenChange }: CreateStoryDialogProps) {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Create form
  const form = useForm<CreateStoryFormData>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      imageUrl: "",
      caption: "",
    },
  });

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setPreviewUrl("");
    }
    onOpenChange(open);
  };

  // Image upload handling
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append("file", file);
      
      // Upload the file
      const response = await fetch("http://0.0.0.0:5000/api/upload/story", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      
      // Set the image URL in the form
      form.setValue("imageUrl", data.url);
      setPreviewUrl(data.url);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (data: CreateStoryFormData) => {
      return await apiRequest("POST", "/api/stories", data);
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Story created successfully",
      });
      handleOpenChange(false);
      setPreviewUrl("");
      form.reset();
      
      // Force immediate refetch of stories
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
      await queryClient.prefetchQuery({ 
        queryKey: ["stories"],
        queryFn: () => fetch("http://0.0.0.0:5000/api/stories", {
          credentials: 'include'
        }).then(res => res.json())
      });
    },
    onError: (error) => {
      console.error("Error creating story:", error);
      toast({
        title: "Error",
        description: "Failed to create story",
        variant: "destructive",
      });
    },
  });
  
  // Form submission
  const onSubmit = (data: CreateStoryFormData) => {
    createStoryMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Story</DialogTitle>
          <DialogDescription>
            Share a moment that disappears after 24 hours
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Image preview */}
            {previewUrl ? (
              <div className="relative w-full aspect-[9/16] rounded-md overflow-hidden bg-black">
                <img 
                  src={previewUrl} 
                  alt="Story preview"
                  className="w-full h-full object-contain" 
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={() => {
                    setPreviewUrl("");
                    form.setValue("imageUrl", "");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center bg-gray-50">
                <Image className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 mb-2">Upload a photo for your story</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingImage}
                    onClick={() => document.getElementById("story-image-upload")?.click()}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center">
                            <Input 
                              id="image-url-input"
                              placeholder="Or enter image URL" 
                              className="flex-1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setPreviewUrl(e.target.value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <input
                  id="story-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}
            
            {/* Caption field */}
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a caption to your story..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#FF5722] hover:bg-[#E64A19]"
                disabled={createStoryMutation.isPending || uploadingImage}
              >
                {createStoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Share Story"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}