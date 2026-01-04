import { useState, useRef, useCallback } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, Video, Music, Hash, MapPin, Users, Trophy, X, 
  Play, Pause, Volume2, VolumeX, Scissors, Sparkles, Camera
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface CreateReelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  duration: number;
  genre?: string;
  usageCount: number;
}

export function CreateReelDialog({ open, onOpenChange }: CreateReelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [step, setStep] = useState<'upload' | 'edit' | 'details'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [category, setCategory] = useState<string>("reel");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);

  // Fetch trending music
  const { data: trendingMusic = [] } = useQuery({
    queryKey: ["/api/reels/music/trending"],
    queryFn: getQueryFn("/api/reels/music/trending?limit=10"),
    enabled: open,
  });

  // Fetch music genres
  const { data: genres = [] } = useQuery({
    queryKey: ["/api/reels/music/genres"],
    queryFn: getQueryFn("/api/reels/music/genres"),
    enabled: open,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile) throw new Error("No video selected");

      const formData = new FormData();
      formData.append("video", videoFile);
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      const uploadResponse = await fetch("/api/reels/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video");
      }

      const { videoUrl, thumbnailUrl } = await uploadResponse.json();

      // Create the reel
      const reelData = {
        videoUrl,
        thumbnailUrl,
        caption,
        hashtags,
        musicId: selectedMusic?.id,
        category,
        duration,
      };

      return await apiRequest("POST", "/api/reels", reelData);
    },
    onSuccess: () => {
      toast({
        title: "Reel created!",
        description: "Your reel has been published successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reels/feed"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
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
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 100MB",
        variant: "destructive",
      });
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setStep('edit');

    // Get video duration
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      setDuration(Math.round(video.duration));
      
      // Validate duration (max 90 seconds)
      if (video.duration > 90) {
        toast({
          title: "Video too long",
          description: "Reels must be 90 seconds or less",
          variant: "destructive",
        });
      }
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
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          setThumbnailFile(file);
          setThumbnailPreview(URL.createObjectURL(blob));
        }
      }, 'image/jpeg', 0.8);
    }
  }, []);

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag) && hashtags.length < 30) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const resetForm = () => {
    setStep('upload');
    setVideoFile(null);
    setVideoPreview(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setCaption("");
    setHashtags([]);
    setHashtagInput("");
    setSelectedMusic(null);
    setCategory("reel");
    setDuration(0);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const categories = [
    { value: 'reel', label: 'General', icon: Video },
    { value: 'match_highlight', label: 'Match Highlight', icon: Trophy },
    { value: 'player_moment', label: 'Player Moment', icon: Users },
    { value: 'training', label: 'Training', icon: Sparkles },
    { value: 'fan_moment', label: 'Fan Moment', icon: Camera },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Reel</DialogTitle>
          <DialogDescription>
            Share your cricket moments with the world
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-8"
            >
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Upload className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Drag and drop video here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    MP4, MOV, WebM • Max 90 seconds • Max 100MB
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
          )}

          {/* Step 2: Edit */}
          {step === 'edit' && videoPreview && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Video preview */}
                <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-black/50 text-white hover:bg-black/70"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-black/50 text-white hover:bg-black/70"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-black/50 text-white">
                      {duration}s
                    </Badge>
                  </div>
                </div>

                {/* Thumbnail & Music */}
                <div className="space-y-4">
                  {/* Thumbnail */}
                  <div>
                    <Label className="text-sm font-medium">Cover Image</Label>
                    <div className="mt-2 aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden relative">
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Camera className="h-8 w-8" />
                        </div>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 left-2 right-2"
                        onClick={generateThumbnail}
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        Capture from video
                      </Button>
                    </div>
                  </div>

                  {/* Music selection */}
                  <div>
                    <Label className="text-sm font-medium">Add Music</Label>
                    <ScrollArea className="h-32 mt-2 border rounded-lg">
                      <div className="p-2 space-y-2">
                        {trendingMusic.map((track: MusicTrack) => (
                          <div
                            key={track.id}
                            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedMusic?.id === track.id ? 'bg-primary/10' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedMusic(track)}
                          >
                            <div className="h-10 w-10 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Music className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{track.title}</p>
                              <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                            </div>
                            <span className="text-xs text-gray-400">{track.duration}s</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button onClick={() => setStep('details')}>
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Caption */}
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="mt-2"
                  rows={3}
                  maxLength={2200}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {caption.length}/2200
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <Label>Hashtags</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Add hashtag"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                      className="pl-9"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addHashtag}>
                    Add
                  </Button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeHashtag(tag)}>
                        #{tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <Label>Category</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.value}
                      type="button"
                      variant={category === cat.value ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setCategory(cat.value)}
                    >
                      <cat.icon className="h-4 w-4 mr-2" />
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selected music display */}
              {selectedMusic && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Music className="h-5 w-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedMusic.title}</p>
                    <p className="text-xs text-gray-500">{selectedMusic.artist}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMusic(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep('edit')}>
                  Back
                </Button>
                <Button 
                  onClick={() => uploadMutation.mutate()}
                  disabled={uploadMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                      Publishing...
                    </>
                  ) : (
                    "Share Reel"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default CreateReelDialog;
