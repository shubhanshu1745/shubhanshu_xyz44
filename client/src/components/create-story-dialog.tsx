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

// Define the form schema locally to ensure it matches exactly what we need
const createStorySchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  caption: z.string().optional(),
});

type CreateStoryFormData = z.infer<typeof createStorySchema>;

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStoryDialog({ open, onOpenChange }: CreateStoryDialogProps) {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Create form using the shared schema
  const form = useForm<CreateStoryFormData>({
    resolver: zodResolver(createStorySchema),
    defaultValues: {
      imageUrl: "",
      caption: "",
    },
    mode: "onChange", // Enable real-time validation
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
      const response = await fetch("/api/upload/story", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      
      // Ensure we get the URL from the response
      const uploadedUrl = data.url || data.filename || data.path;
      if (!uploadedUrl) {
        throw new Error('No URL returned from upload');
      }
      
      // Set the image URL in the form
      form.setValue("imageUrl", uploadedUrl);
      setPreviewUrl(uploadedUrl);
      
      // Clear any previous validation errors
      form.clearErrors("imageUrl");
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
      try {
        const response = await apiRequest("POST", "/api/stories", data);
        return response;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async (data) => {
      toast({
        title: "Success",
        description: "Story created successfully! Your story will be visible for 24 hours.",
      });
      handleOpenChange(false);
      
      // Force immediate refetch of stories
      await queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stories/feed"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stories/user"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create story";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  // Form submission
  const onSubmit = async (data: CreateStoryFormData) => {
    // Validate that we have an image
    if (!data.imageUrl || data.imageUrl.trim() === "") {
      toast({
        title: "Error",
        description: "Please upload an image or provide an image URL",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createStoryMutation.mutateAsync(data);
    } catch (error) {
      console.error("Failed to create story:", error);
    }
  };

  // Handle form errors
  const onError = (errors: any) => {
    // Show toast for validation errors
    const errorMessages = Object.values(errors).map((error: any) => error.message).join(", ");
    toast({
      title: "Validation Error",
      description: errorMessages,
      variant: "destructive",
    });
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
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">

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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const testUrl = "https://via.placeholder.com/400x600/FF5722/FFFFFF?text=Test+Story";
                      form.setValue("imageUrl", testUrl);
                      setPreviewUrl(testUrl);
                    }}
                  >
                    Use Test Image
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
                className="bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
                disabled={createStoryMutation.isPending || uploadingImage || form.formState.isSubmitting}
              >
                {createStoryMutation.isPending || form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : uploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
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