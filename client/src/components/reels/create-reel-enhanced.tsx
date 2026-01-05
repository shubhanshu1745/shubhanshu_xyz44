import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Upload, Video, Hash, X, Camera, Globe, Users, Lock,
  ChevronLeft, ChevronRight, Loader2, Save, Eye
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { VideoEditor, EditorState, TextLayer, StickerLayer, MusicLayer } from "./editor/video-editor";
import { cn } from "@/lib/utils";

interface CreateReelEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "edit" | "details" | "publishing";

interface ReelDraft {
  videoFile: File | null;
  videoUrl: string | null;
  thumbnailFile: File | null;
  thumbnailUrl: string | null;
  duration: number;
  trimStart: number;
  trimEnd: number;
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
  musicLayer: MusicLayer | null;
  filter: string;
  originalVolume: number;
  caption: string;
  hashtags: string[];
  category: string;
  visibility: "public" | "followers" | "private";
  isDraft: boolean;
}

const initialDraft: ReelDraft = {
  videoFile: null,
  videoUrl: null,
  thumbnailFile: null,
  thumbnailUrl: null,
  duration: 0,
  trimStart: 0,
  trimEnd: 0,
  textLayers: [],
  stickerLayers: [],
  musicLayer: null,
  filter: "none",
  originalVolume: 100,
  caption: "",
  hashtags: [],
  category: "reel",
  visibility: "public",
  isDraft: false,
};

export function CreateReelEnhanced({ open, onOpenChange }: CreateReelEnhancedProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [step, setStep] = useState<Step>("upload");
  const [draft, setDraft] = useState<ReelDraft>(initialDraft);
  const [hashtagInput, setHashtagInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Categories for cricket reels
  const categories = [
    { value: "reel", label: "General", icon: Video },
    { value: "match_highlight", label: "Match Highlight", icon: "🏏" },
    { value: "player_moment", label: "Player Moment", icon: "⭐" },
    { value: "training", label: "Training", icon: "💪" },
    { value: "fan_moment", label: "Fan Moment", icon: "🎉" },
    { value: "behind_scenes", label: "Behind Scenes", icon: "🎬" },
  ];

  const visibilityOptions = [
    { value: "public", label: "Public", icon: Globe, desc: "Anyone can see" },
    { value: "followers", label: "Followers", icon: Users, desc: "Only followers" },
    { value: "private", label: "Private", icon: Lock, desc: "Only you" },
  ];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!draft.videoFile) throw new Error("No video selected");
      setUploadProgress(10);

      const formData = new FormData();
      formData.append("video", draft.videoFile);
      if (draft.thumbnailFile) {
        formData.append("thumbnail", draft.thumbnailFile);
      }

      setUploadProgress(30);
      const uploadResponse = await fetch("/api/reels/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload video");
      setUploadProgress(70);

      const { videoUrl, thumbnailUrl } = await uploadResponse.json();

      // Create the reel with all metadata
      const reelData = {
        videoUrl,
        thumbnailUrl,
        caption: draft.caption,
        hashtags: draft.hashtags,
        musicId: draft.musicLayer?.id,
        category: draft.category,
        visibility: draft.visibility,
        duration: draft.trimEnd - draft.trimStart,
        isDraft: draft.isDraft,
        // Editor metadata (stored as JSON in backend)
        editorData: {
          trimStart: draft.trimStart,
          trimEnd: draft.trimEnd,
          textLayers: draft.textLayers,
          stickerLayers: draft.stickerLayers,
          filter: draft.filter,
          originalVolume: draft.originalVolume,
        },
      };

      setUploadProgress(90);
      return await apiRequest("POST", "/api/reels", reelData);
    },
    onSuccess: () => {
      setUploadProgress(100);
      toast({
        title: draft.isDraft ? "Draft saved!" : "Reel published!",
        description: draft.isDraft 
          ? "Your reel has been saved as a draft." 
          : "Your reel is now live!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reels/feed"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Error",
        description: error.message || "Failed to create reel",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select a video file", variant: "destructive" });
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "File too large", description: "Video must be less than 100MB", variant: "destructive" });
      return;
    }

    const url = URL.createObjectURL(file);
    
    // Get video duration
    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => {
      const duration = video.duration;
      
      // Validate duration (max 90 seconds)
      if (duration > 90) {
        toast({ title: "Video too long", description: "Reels must be 90 seconds or less. You can trim it in the editor.", variant: "default" });
      }

      setDraft(prev => ({
        ...prev,
        videoFile: file,
        videoUrl: url,
        duration,
        trimStart: 0,
        trimEnd: Math.min(duration, 90),
      }));
      setStep("edit");
    };
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: input } as any);
      }
    }
  }, [handleFileSelect]);

  const generateThumbnail = useCallback(() => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
          setDraft(prev => ({
            ...prev,
            thumbnailFile: file,
            thumbnailUrl: URL.createObjectURL(blob),
          }));
        }
      }, "image/jpeg", 0.8);
    }
  }, []);

  const handleEditorSave = useCallback((editorState: Partial<EditorState>) => {
    setDraft(prev => ({
      ...prev,
      trimStart: editorState.trimStart ?? prev.trimStart,
      trimEnd: editorState.trimEnd ?? prev.trimEnd,
      textLayers: editorState.textLayers ?? prev.textLayers,
      stickerLayers: editorState.stickerLayers ?? prev.stickerLayers,
      musicLayer: editorState.musicLayer ?? prev.musicLayer,
      filter: editorState.filter ?? prev.filter,
      originalVolume: editorState.originalVolume ?? prev.originalVolume,
    }));
    setStep("details");
  }, []);

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !draft.hashtags.includes(tag) && draft.hashtags.length < 30) {
      setDraft(prev => ({ ...prev, hashtags: [...prev.hashtags, tag] }));
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setDraft(prev => ({ ...prev, hashtags: prev.hashtags.filter(t => t !== tag) }));
  };

  const resetForm = () => {
    setStep("upload");
    setDraft(initialDraft);
    setHashtagInput("");
    setUploadProgress(0);
  };

  const handlePublish = (asDraft: boolean = false) => {
    setDraft(prev => ({ ...prev, isDraft: asDraft }));
    setStep("publishing");
    uploadMutation.mutate();
  };

  // Render step content
  const renderStep = () => {
    switch (step) {
      case "upload":
        return (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col items-center justify-center h-full p-4 sm:p-8"
          >
            <div
              className="w-full max-w-md border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 sm:p-12 text-center cursor-pointer hover:border-purple-500 transition-all hover:bg-purple-500/5"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Drop your video here</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">or tap to browse</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                  <Badge variant="outline">MP4</Badge>
                  <Badge variant="outline">MOV</Badge>
                  <Badge variant="outline">WebM</Badge>
                  <Badge variant="outline">Max 90s</Badge>
                  <Badge variant="outline">Max 100MB</Badge>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </motion.div>
        );

      case "edit":
        return draft.videoFile && draft.videoUrl ? (
          <VideoEditor
            videoFile={draft.videoFile}
            videoUrl={draft.videoUrl}
            duration={draft.duration}
            onSave={handleEditorSave}
            onCancel={() => setStep("upload")}
          />
        ) : null;

      case "details":
        return (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col md:flex-row h-full"
          >
            {/* Preview - Hidden on mobile, shown on md+ */}
            <div className="hidden md:flex w-80 bg-black items-center justify-center p-4">
              <div className="relative aspect-[9/16] w-full max-h-full rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={draft.videoUrl || ""}
                  className="w-full h-full object-cover"
                  style={{ filter: draft.filter !== "none" ? draft.filter : undefined }}
                  loop
                  muted
                  autoPlay
                  playsInline
                />
                {draft.thumbnailUrl && (
                  <div className="absolute bottom-2 right-2">
                    <Badge className="bg-black/50 text-white text-xs">
                      <Camera className="h-3 w-3 mr-1" /> Cover set
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Preview - Small preview at top on mobile */}
            <div className="md:hidden w-full bg-black p-3">
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-36 rounded-lg overflow-hidden flex-shrink-0">
                  <video
                    src={draft.videoUrl || ""}
                    className="w-full h-full object-cover"
                    style={{ filter: draft.filter !== "none" ? draft.filter : undefined }}
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Your Reel</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {Math.round(draft.trimEnd - draft.trimStart)}s duration
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-xs h-7"
                    onClick={generateThumbnail}
                  >
                    <Camera className="h-3 w-3 mr-1" /> Set Cover
                  </Button>
                </div>
              </div>
            </div>

            {/* Details Form */}
            <ScrollArea className="flex-1 p-4 sm:p-6 bg-white dark:bg-slate-900">
              <div className="max-w-lg mx-auto space-y-5">
                {/* Caption */}
                <div>
                  <Label htmlFor="caption" className="text-base font-semibold text-slate-900 dark:text-slate-100">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Write a caption for your reel..."
                    value={draft.caption}
                    onChange={(e) => setDraft(prev => ({ ...prev, caption: e.target.value }))}
                    className="mt-2 min-h-[80px] sm:min-h-[100px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    maxLength={2200}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">{draft.caption.length}/2200</p>
                </div>

                {/* Hashtags */}
                <div>
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">Hashtags</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="relative flex-1">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Add hashtag"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                        className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={addHashtag} size="sm">Add</Button>
                  </div>
                  {draft.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {draft.hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => removeHashtag(tag)}>
                          #{tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">{draft.hashtags.length}/30 hashtags</p>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">Category</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={cn(
                          "flex flex-col items-center p-2 sm:p-3 rounded-xl border-2 transition-all",
                          draft.category === cat.value 
                            ? "border-purple-500 bg-purple-500/10" 
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        )}
                        onClick={() => setDraft(prev => ({ ...prev, category: cat.value }))}
                      >
                        <span className="text-xl sm:text-2xl mb-1">
                          {typeof cat.icon === "string" ? cat.icon : <cat.icon className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">Who can see this?</Label>
                  <div className="space-y-2 mt-2">
                    {visibilityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          "w-full flex items-center p-3 rounded-xl border-2 transition-all",
                          draft.visibility === opt.value 
                            ? "border-purple-500 bg-purple-500/10" 
                            : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        )}
                        onClick={() => setDraft(prev => ({ ...prev, visibility: opt.value as any }))}
                      >
                        <opt.icon className="h-5 w-5 mr-3 text-slate-600 dark:text-slate-400" />
                        <div className="text-left">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{opt.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thumbnail - Desktop only */}
                <div className="hidden md:block">
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">Cover Image</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="w-20 h-36 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      {draft.thumbnailUrl ? (
                        <img src={draft.thumbnailUrl} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Camera className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <Button variant="outline" onClick={generateThumbnail}>
                      <Camera className="h-4 w-4 mr-2" /> Capture from video
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button variant="ghost" onClick={() => setStep("edit")} className="w-full sm:w-auto order-2 sm:order-1">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Editor
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                    <Button variant="outline" onClick={() => handlePublish(true)} className="w-full sm:w-auto">
                      <Save className="h-4 w-4 mr-2" /> Save Draft
                    </Button>
                    <Button 
                      onClick={() => handlePublish(false)}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Share Reel <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        );

      case "publishing":
        return (
          <motion.div
            key="publishing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full p-8"
          >
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
                  {uploadProgress < 100 ? (
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  ) : (
                    <Eye className="h-12 w-12 text-white" />
                  )}
                </div>
                {uploadProgress < 100 && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-black text-white">{uploadProgress}%</Badge>
                  </div>
                )}
              </div>
              
              <div>
                <h2 className="text-2xl font-bold">
                  {uploadProgress < 100 ? "Publishing your reel..." : "All done!"}
                </h2>
                <p className="text-gray-500 mt-2">
                  {uploadProgress < 30 && "Uploading video..."}
                  {uploadProgress >= 30 && uploadProgress < 70 && "Processing..."}
                  {uploadProgress >= 70 && uploadProgress < 100 && "Almost there..."}
                  {uploadProgress >= 100 && "Your reel is now live!"}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-64 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Create New Reel</DialogTitle>
          <DialogDescription>Upload and edit your video to create a new reel</DialogDescription>
        </VisuallyHidden>
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default CreateReelEnhanced;
