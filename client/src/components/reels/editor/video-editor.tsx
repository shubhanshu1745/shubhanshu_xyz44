import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Pause, Volume2, VolumeX, Scissors, RotateCcw, 
  Type, Sticker, Music, Sparkles, Layers, ChevronLeft, 
  ChevronRight, Check, X, Undo, Redo, ZoomIn, ZoomOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Types for editor layers
export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  rotation: number;
  scale: number;
  startTime: number;
  endTime: number;
  animation: "none" | "fade" | "slide" | "bounce" | "typewriter";
  style: "normal" | "bold" | "neon" | "stroke" | "shadow";
}

export interface StickerLayer {
  id: string;
  type: "emoji" | "gif" | "sticker";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  startTime: number;
  endTime: number;
}

export interface MusicLayer {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  startOffset: number;
  duration: number;
  volume: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  filter: string;
  thumbnail?: string;
}

export interface EditorState {
  videoFile: File | null;
  videoUrl: string | null;
  duration: number;
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  textLayers: TextLayer[];
  stickerLayers: StickerLayer[];
  musicLayer: MusicLayer | null;
  filter: string;
  originalVolume: number;
  isPlaying: boolean;
  isMuted: boolean;
  selectedLayerId: string | null;
  history: EditorState[];
  historyIndex: number;
}

// Filter presets - CSS-based (free)
export const FILTER_PRESETS: FilterPreset[] = [
  { id: "none", name: "Normal", filter: "none" },
  { id: "warm", name: "Warm", filter: "sepia(0.3) saturate(1.4) brightness(1.1)" },
  { id: "cool", name: "Cool", filter: "saturate(0.9) hue-rotate(10deg) brightness(1.05)" },
  { id: "vintage", name: "Vintage", filter: "sepia(0.4) contrast(1.1) brightness(0.9)" },
  { id: "bw", name: "B&W", filter: "grayscale(1) contrast(1.2)" },
  { id: "vivid", name: "Vivid", filter: "saturate(1.5) contrast(1.1)" },
  { id: "fade", name: "Fade", filter: "contrast(0.9) brightness(1.1) saturate(0.8)" },
  { id: "dramatic", name: "Dramatic", filter: "contrast(1.3) saturate(1.2) brightness(0.95)" },
  { id: "cricket", name: "Cricket", filter: "saturate(1.3) brightness(1.1) contrast(1.05)" },
  { id: "stadium", name: "Stadium", filter: "brightness(1.15) contrast(1.1) saturate(1.1)" },
];

interface VideoEditorProps {
  videoFile: File;
  videoUrl: string;
  duration: number;
  onSave: (state: Partial<EditorState>) => void;
  onCancel: () => void;
}

export function VideoEditor({ videoFile, videoUrl, duration, onSave, onCancel }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration);
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [originalVolume, setOriginalVolume] = useState(100);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [stickerLayers, setStickerLayers] = useState<StickerLayer[]>([]);
  const [musicLayer, setMusicLayer] = useState<MusicLayer | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("trim");
  const [zoom, setZoom] = useState(1);

  // Video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
        if (!isPlaying) video.pause();
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [trimStart, trimEnd, isPlaying]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, trimStart, trimEnd]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(trimStart, Math.min(trimEnd, time));
      setCurrentTime(video.currentTime);
    }
  }, [trimStart, trimEnd]);

  const handleTrimChange = useCallback((values: number[]) => {
    const [start, end] = values;
    setTrimStart(start);
    setTrimEnd(end);
    if (currentTime < start) seekTo(start);
    if (currentTime > end) seekTo(end);
  }, [currentTime, seekTo]);

  const addTextLayer = useCallback(() => {
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      text: "Tap to edit",
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: "Inter",
      color: "#ffffff",
      rotation: 0,
      scale: 1,
      startTime: trimStart,
      endTime: trimEnd,
      animation: "none",
      style: "normal",
    };
    setTextLayers([...textLayers, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, [textLayers, trimStart, trimEnd]);

  const addStickerLayer = useCallback((type: "emoji" | "gif" | "sticker", src: string) => {
    const newLayer: StickerLayer = {
      id: `sticker-${Date.now()}`,
      type,
      src,
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 0,
      startTime: trimStart,
      endTime: trimEnd,
    };
    setStickerLayers([...stickerLayers, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, [stickerLayers, trimStart, trimEnd]);

  const updateTextLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
    setTextLayers(layers => 
      layers.map(l => l.id === id ? { ...l, ...updates } : l)
    );
  }, []);

  const updateStickerLayer = useCallback((id: string, updates: Partial<StickerLayer>) => {
    setStickerLayers(layers => 
      layers.map(l => l.id === id ? { ...l, ...updates } : l)
    );
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setTextLayers(layers => layers.filter(l => l.id !== id));
    setStickerLayers(layers => layers.filter(l => l.id !== id));
    setSelectedLayerId(null);
  }, []);

  // Layer ordering functions
  const bringLayerForward = useCallback((id: string) => {
    setTextLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx < layers.length - 1) {
        const newLayers = [...layers];
        [newLayers[idx], newLayers[idx + 1]] = [newLayers[idx + 1], newLayers[idx]];
        return newLayers;
      }
      return layers;
    });
    setStickerLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx < layers.length - 1) {
        const newLayers = [...layers];
        [newLayers[idx], newLayers[idx + 1]] = [newLayers[idx + 1], newLayers[idx]];
        return newLayers;
      }
      return layers;
    });
  }, []);

  const sendLayerBackward = useCallback((id: string) => {
    setTextLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx > 0) {
        const newLayers = [...layers];
        [newLayers[idx], newLayers[idx - 1]] = [newLayers[idx - 1], newLayers[idx]];
        return newLayers;
      }
      return layers;
    });
    setStickerLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx > 0) {
        const newLayers = [...layers];
        [newLayers[idx], newLayers[idx - 1]] = [newLayers[idx - 1], newLayers[idx]];
        return newLayers;
      }
      return layers;
    });
  }, []);

  const bringLayerToFront = useCallback((id: string) => {
    setTextLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx !== -1 && idx < layers.length - 1) {
        const layer = layers[idx];
        return [...layers.slice(0, idx), ...layers.slice(idx + 1), layer];
      }
      return layers;
    });
    setStickerLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx !== -1 && idx < layers.length - 1) {
        const layer = layers[idx];
        return [...layers.slice(0, idx), ...layers.slice(idx + 1), layer];
      }
      return layers;
    });
  }, []);

  const sendLayerToBack = useCallback((id: string) => {
    setTextLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx > 0) {
        const layer = layers[idx];
        return [layer, ...layers.slice(0, idx), ...layers.slice(idx + 1)];
      }
      return layers;
    });
    setStickerLayers(layers => {
      const idx = layers.findIndex(l => l.id === id);
      if (idx > 0) {
        const layer = layers[idx];
        return [layer, ...layers.slice(0, idx), ...layers.slice(idx + 1)];
      }
      return layers;
    });
  }, []);

  const handleSave = () => {
    onSave({
      trimStart,
      trimEnd,
      textLayers,
      stickerLayers,
      musicLayer,
      filter: selectedFilter,
      originalVolume,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const trimmedDuration = trimEnd - trimStart;
  const currentFilter = FILTER_PRESETS.find(f => f.id === selectedFilter)?.filter || "none";

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 border-b border-white/10">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-white">
          <X className="h-5 w-5 mr-1" /> Cancel
        </Button>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-white/10 text-white">
            {formatTime(trimmedDuration)}
          </Badge>
        </div>
        <Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Check className="h-4 w-4 mr-1" /> Done
        </Button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Preview */}
        <div className="flex-1 relative flex items-center justify-center bg-black p-4" ref={containerRef}>
          <div 
            className="relative aspect-[9/16] max-h-full overflow-hidden rounded-xl"
            style={{ transform: `scale(${zoom})` }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              style={{ filter: currentFilter }}
              loop
              muted={isMuted}
              playsInline
            />
            
            {/* Text Layers Overlay */}
            {textLayers.map(layer => (
              <motion.div
                key={layer.id}
                className={cn(
                  "absolute cursor-move select-none",
                  selectedLayerId === layer.id && "ring-2 ring-blue-500"
                )}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                  fontSize: layer.fontSize,
                  fontFamily: layer.fontFamily,
                  color: layer.color,
                  backgroundColor: layer.backgroundColor,
                  display: currentTime >= layer.startTime && currentTime <= layer.endTime ? "block" : "none",
                }}
                onClick={() => setSelectedLayerId(layer.id)}
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  const container = containerRef.current;
                  if (container) {
                    const rect = container.getBoundingClientRect();
                    const x = ((info.point.x - rect.left) / rect.width) * 100;
                    const y = ((info.point.y - rect.top) / rect.height) * 100;
                    updateTextLayer(layer.id, { x, y });
                  }
                }}
              >
                <span className={cn(
                  "px-2 py-1 rounded",
                  layer.style === "neon" && "text-shadow-neon",
                  layer.style === "stroke" && "text-stroke",
                  layer.style === "shadow" && "drop-shadow-lg",
                  layer.style === "bold" && "font-bold"
                )}>
                  {layer.text}
                </span>
              </motion.div>
            ))}

            {/* Sticker Layers Overlay */}
            {stickerLayers.map(layer => (
              <motion.div
                key={layer.id}
                className={cn(
                  "absolute cursor-move",
                  selectedLayerId === layer.id && "ring-2 ring-blue-500"
                )}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  width: layer.width,
                  height: layer.height,
                  transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                  display: currentTime >= layer.startTime && currentTime <= layer.endTime ? "block" : "none",
                }}
                onClick={() => setSelectedLayerId(layer.id)}
                drag
                dragMomentum={false}
              >
                {layer.type === "emoji" ? (
                  <span className="text-5xl">{layer.src}</span>
                ) : (
                  <img src={layer.src} alt="" className="w-full h-full object-contain" />
                )}
              </motion.div>
            ))}

            {/* Play/Pause Overlay */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                  onClick={togglePlayPause}
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Play className="h-12 w-12 text-white fill-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            <Button variant="ghost" size="icon" className="bg-black/50 text-white" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="bg-black/50 text-white" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Panel - Tools */}
        <div className="w-80 bg-gray-900 border-l border-white/10 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-5 bg-black/50 m-2">
              <TabsTrigger value="trim" className="text-xs"><Scissors className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="text" className="text-xs"><Type className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="stickers" className="text-xs"><Sticker className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="music" className="text-xs"><Music className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="filters" className="text-xs"><Sparkles className="h-4 w-4" /></TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Trim Tab */}
              <TabsContent value="trim" className="mt-0 space-y-4">
                <div>
                  <h3 className="text-white font-medium mb-3">Trim Video</h3>
                  <div className="space-y-4">
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>{formatTime(trimStart)}</span>
                        <span>{formatTime(trimEnd)}</span>
                      </div>
                      <Slider
                        value={[trimStart, trimEnd]}
                        min={0}
                        max={duration}
                        step={0.1}
                        onValueChange={handleTrimChange}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Duration: {formatTime(trimmedDuration)}</span>
                      <Button variant="ghost" size="sm" className="text-white" onClick={() => { setTrimStart(0); setTrimEnd(duration); }}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Original Audio</h3>
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="icon" className="text-white" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <Slider
                      value={[originalVolume]}
                      min={0}
                      max={100}
                      onValueChange={([v]) => setOriginalVolume(v)}
                      className="flex-1"
                      disabled={isMuted}
                    />
                    <span className="text-white text-sm w-10">{originalVolume}%</span>
                  </div>
                </div>
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="mt-0 space-y-4">
                <Button onClick={addTextLayer} className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  <Type className="h-4 w-4 mr-2" /> Add Text
                </Button>
                
                {selectedLayerId && textLayers.find(l => l.id === selectedLayerId) && (
                  <TextLayerEditor
                    layer={textLayers.find(l => l.id === selectedLayerId)!}
                    onUpdate={(updates) => updateTextLayer(selectedLayerId, updates)}
                    onDelete={() => deleteLayer(selectedLayerId)}
                    onBringForward={() => bringLayerForward(selectedLayerId)}
                    onSendBackward={() => sendLayerBackward(selectedLayerId)}
                    onBringToFront={() => bringLayerToFront(selectedLayerId)}
                    onSendToBack={() => sendLayerToBack(selectedLayerId)}
                    duration={duration}
                  />
                )}

                {textLayers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-gray-400 text-sm">Text Layers</h4>
                    {textLayers.map(layer => (
                      <div
                        key={layer.id}
                        className={cn(
                          "p-2 rounded-lg cursor-pointer transition-colors",
                          selectedLayerId === layer.id ? "bg-purple-500/20 border border-purple-500" : "bg-black/30 hover:bg-black/50"
                        )}
                        onClick={() => setSelectedLayerId(layer.id)}
                      >
                        <p className="text-white text-sm truncate">{layer.text}</p>
                        <p className="text-gray-500 text-xs">{formatTime(layer.startTime)} - {formatTime(layer.endTime)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Stickers Tab */}
              <TabsContent value="stickers" className="mt-0 space-y-4">
                <EmojiPicker onSelect={(emoji) => addStickerLayer("emoji", emoji)} />
                
                {selectedLayerId && stickerLayers.find(l => l.id === selectedLayerId) && (
                  <StickerLayerEditor
                    layer={stickerLayers.find(l => l.id === selectedLayerId)!}
                    onUpdate={(updates) => updateStickerLayer(selectedLayerId, updates)}
                    onDelete={() => deleteLayer(selectedLayerId)}
                    onBringForward={() => bringLayerForward(selectedLayerId)}
                    onSendBackward={() => sendLayerBackward(selectedLayerId)}
                    onBringToFront={() => bringLayerToFront(selectedLayerId)}
                    onSendToBack={() => sendLayerToBack(selectedLayerId)}
                    duration={duration}
                  />
                )}
              </TabsContent>

              {/* Music Tab */}
              <TabsContent value="music" className="mt-0 space-y-4">
                <MusicSelector
                  selectedMusic={musicLayer}
                  onSelect={setMusicLayer}
                  videoDuration={trimmedDuration}
                />
              </TabsContent>

              {/* Filters Tab */}
              <TabsContent value="filters" className="mt-0">
                <div className="grid grid-cols-3 gap-2">
                  {FILTER_PRESETS.map(filter => (
                    <button
                      key={filter.id}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                        selectedFilter === filter.id ? "border-purple-500 scale-105" : "border-transparent"
                      )}
                      onClick={() => setSelectedFilter(filter.id)}
                    >
                      <div 
                        className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500"
                        style={{ filter: filter.filter }}
                      />
                      <p className="text-white text-xs mt-1 text-center">{filter.name}</p>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Bottom Timeline */}
      <div className="bg-gray-900 border-t border-white/10 p-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-white" onClick={togglePlayPause}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          <div className="flex-1">
            <Slider
              value={[currentTime]}
              min={trimStart}
              max={trimEnd}
              step={0.01}
              onValueChange={([v]) => seekTo(v)}
              className="w-full"
            />
          </div>
          
          <span className="text-white text-sm font-mono">
            {formatTime(currentTime - trimStart)} / {formatTime(trimmedDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Text Layer Editor Component
function TextLayerEditor({ 
  layer, 
  onUpdate, 
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  duration 
}: { 
  layer: TextLayer; 
  onUpdate: (updates: Partial<TextLayer>) => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  duration: number;
}) {
  const fontFamilies = ["Inter", "Arial", "Georgia", "Courier New", "Impact", "Comic Sans MS"];
  const textStyles = [
    { id: "normal", name: "Normal" },
    { id: "bold", name: "Bold" },
    { id: "neon", name: "Neon" },
    { id: "stroke", name: "Outline" },
    { id: "shadow", name: "Shadow" },
  ];
  const animations = [
    { id: "none", name: "None" },
    { id: "fade", name: "Fade" },
    { id: "slide", name: "Slide" },
    { id: "bounce", name: "Bounce" },
    { id: "typewriter", name: "Typewriter" },
  ];

  return (
    <div className="space-y-3 p-3 bg-black/30 rounded-lg">
      <input
        type="text"
        value={layer.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        className="w-full bg-black/50 text-white px-3 py-2 rounded-lg border border-white/20"
        placeholder="Enter text..."
      />
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Font</label>
          <select
            value={layer.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full bg-black/50 text-white px-2 py-1 rounded text-sm"
          >
            {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs">Size</label>
          <input
            type="number"
            value={layer.fontSize}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
            className="w-full bg-black/50 text-white px-2 py-1 rounded text-sm"
            min={12}
            max={72}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Color</label>
          <input
            type="color"
            value={layer.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Background</label>
          <input
            type="color"
            value={layer.backgroundColor || "#000000"}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs">Style</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {textStyles.map(s => (
            <button
              key={s.id}
              className={cn(
                "px-2 py-1 rounded text-xs",
                layer.style === s.id ? "bg-purple-500 text-white" : "bg-black/50 text-gray-400"
              )}
              onClick={() => onUpdate({ style: s.id as TextLayer["style"] })}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs">Animation</label>
        <div className="flex flex-wrap gap-1 mt-1">
          {animations.map(a => (
            <button
              key={a.id}
              className={cn(
                "px-2 py-1 rounded text-xs",
                layer.animation === a.id ? "bg-purple-500 text-white" : "bg-black/50 text-gray-400"
              )}
              onClick={() => onUpdate({ animation: a.id as TextLayer["animation"] })}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs">Timing</label>
        <div className="flex items-center space-x-2 mt-1">
          <input
            type="number"
            value={layer.startTime.toFixed(1)}
            onChange={(e) => onUpdate({ startTime: parseFloat(e.target.value) })}
            className="w-16 bg-black/50 text-white px-2 py-1 rounded text-sm"
            min={0}
            max={duration}
            step={0.1}
          />
          <span className="text-gray-400">to</span>
          <input
            type="number"
            value={layer.endTime.toFixed(1)}
            onChange={(e) => onUpdate({ endTime: parseFloat(e.target.value) })}
            className="w-16 bg-black/50 text-white px-2 py-1 rounded text-sm"
            min={0}
            max={duration}
            step={0.1}
          />
        </div>
      </div>

      {/* Layer Ordering */}
      <div>
        <label className="text-gray-400 text-xs">Layer Order</label>
        <div className="grid grid-cols-4 gap-1 mt-1">
          <button
            className="px-2 py-1 rounded text-xs bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white"
            onClick={onSendToBack}
            title="Send to Back"
          >
            ⇤ Back
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white"
            onClick={onSendBackward}
            title="Send Backward"
          >
            ← Down
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white"
            onClick={onBringForward}
            title="Bring Forward"
          >
            Up →
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white"
            onClick={onBringToFront}
            title="Bring to Front"
          >
            Front ⇥
          </button>
        </div>
      </div>

      <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}>
        <X className="h-4 w-4 mr-1" /> Delete Text
      </Button>
    </div>
  );
}

// Sticker Layer Editor Component
function StickerLayerEditor({ 
  layer, 
  onUpdate, 
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  duration 
}: { 
  layer: StickerLayer; 
  onUpdate: (updates: Partial<StickerLayer>) => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  duration: number;
}) {
  return (
    <div className="space-y-3 p-3 bg-black/30 rounded-lg">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 text-xs">Width</label>
          <Slider
            value={[layer.width]}
            min={20}
            max={200}
            onValueChange={([v]) => onUpdate({ width: v, height: v })}
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs">Rotation</label>
          <Slider
            value={[layer.rotation]}
            min={-180}
            max={180}
            onValueChange={([v]) => onUpdate({ rotation: v })}
          />
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs">Timing</label>
        <div className="flex items-center space-x-2 mt-1">
          <input
            type="number"
            value={layer.startTime.toFixed(1)}
            onChange={(e) => onUpdate({ startTime: parseFloat(e.target.value) })}
            className="w-16 bg-black/50 text-white px-2 py-1 rounded text-sm"
            min={0}
            max={duration}
            step={0.1}
          />
          <span className="text-gray-400">to</span>
          <input
            type="number"
            value={layer.endTime.toFixed(1)}
            onChange={(e) => onUpdate({ endTime: parseFloat(e.target.value) })}
            className="w-16 bg-black/50 text-white px-2 py-1 rounded text-sm"
            min={0}
            max={duration}
            step={0.1}
          />
        </div>
      </div>

      {/* Layer Ordering */}
      <div>
        <label className="text-gray-400 text-xs">Layer Order</label>
        <div className="grid grid-cols-4 gap-1 mt-1">
          <button
            className="px-2 py-1 rounded text-xs bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white"
            onClick={onSendToBack}
            title="Send to Back"
          >
            ⇤ Back
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white"
            onClick={onSendBackward}
            title="Send Backward"
          >
            ← Down
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white"
            onClick={onBringForward}
            title="Bring Forward"
          >
            Up →
          </button>
          <button
            className="px-2 py-1 rounded text-xs bg-black/50 text-gray-400 hover:bg-black/70 hover:text-white"
            onClick={onBringToFront}
            title="Bring to Front"
          >
            Front ⇥
          </button>
        </div>
      </div>

      <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}>
        <X className="h-4 w-4 mr-1" /> Delete Sticker
      </Button>
    </div>
  );
}

// Emoji Picker Component
function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const cricketEmojis = ["🏏", "🏆", "⚾", "🎯", "🔥", "💪", "👏", "🙌", "🎉", "⭐", "💯", "🥇", "🥈", "🥉", "🏅"];
  const celebrationEmojis = ["🎊", "🎈", "🎁", "🎀", "✨", "💫", "🌟", "⚡", "💥", "🔔", "📣", "🎺", "🎵", "🎶", "❤️"];
  const faceEmojis = ["😀", "😂", "🤣", "😍", "🥳", "😎", "🤩", "😱", "😤", "💀", "🙏", "👀", "🫡", "🤯", "😈"];

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-gray-400 text-xs mb-2">Cricket</h4>
        <div className="grid grid-cols-5 gap-2">
          {cricketEmojis.map(emoji => (
            <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl hover:scale-125 transition-transform">
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-gray-400 text-xs mb-2">Celebration</h4>
        <div className="grid grid-cols-5 gap-2">
          {celebrationEmojis.map(emoji => (
            <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl hover:scale-125 transition-transform">
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-gray-400 text-xs mb-2">Reactions</h4>
        <div className="grid grid-cols-5 gap-2">
          {faceEmojis.map(emoji => (
            <button key={emoji} onClick={() => onSelect(emoji)} className="text-2xl hover:scale-125 transition-transform">
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Music Selector Component with Audio Preview
function MusicSelector({ 
  selectedMusic, 
  onSelect, 
  videoDuration 
}: { 
  selectedMusic: MusicLayer | null;
  onSelect: (music: MusicLayer | null) => void;
  videoDuration: number;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [musicVolume, setMusicVolume] = useState(80);
  const [previewingTrackId, setPreviewingTrackId] = useState<number | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sample music tracks (in production, fetch from API)
  const musicTracks = [
    { id: 1, title: "Cricket Anthem", artist: "Stadium Sounds", audioUrl: "/audio/cricket-anthem.mp3", duration: 30 },
    { id: 2, title: "Victory March", artist: "Champion Beats", audioUrl: "/audio/victory-march.mp3", duration: 45 },
    { id: 3, title: "Crowd Roar", artist: "Stadium Ambience", audioUrl: "/audio/crowd-roar.mp3", duration: 20 },
    { id: 4, title: "Six Hit", artist: "Cricket Beats", audioUrl: "/audio/six-hit.mp3", duration: 15 },
    { id: 5, title: "Wicket Fall", artist: "Cricket Beats", audioUrl: "/audio/wicket-fall.mp3", duration: 10 },
  ];

  const filteredTracks = musicTracks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  // Handle preview playback
  const togglePreview = useCallback((track: typeof musicTracks[0]) => {
    // If already previewing this track, stop it
    if (previewingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewingTrackId(null);
      setPreviewProgress(0);
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      return;
    }

    // Stop any existing preview
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create new audio element for preview
    const audio = new Audio(track.audioUrl);
    audioRef.current = audio;
    audio.volume = 0.7;

    // Update progress during playback
    const updateProgress = () => {
      if (audio && !audio.paused) {
        setPreviewProgress((audio.currentTime / Math.min(15, track.duration)) * 100);
        if (audio.currentTime < 15) {
          requestAnimationFrame(updateProgress);
        }
      }
    };

    audio.onplay = () => {
      setPreviewingTrackId(track.id);
      updateProgress();
    };

    audio.onended = () => {
      setPreviewingTrackId(null);
      setPreviewProgress(0);
    };

    audio.onerror = () => {
      setPreviewingTrackId(null);
      setPreviewProgress(0);
    };

    // Play preview (max 15 seconds)
    audio.play().catch(() => {
      setPreviewingTrackId(null);
    });

    // Auto-stop after 15 seconds
    previewTimeoutRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewingTrackId(null);
      setPreviewProgress(0);
    }, 15000);
  }, [previewingTrackId]);

  const handleSelectTrack = (track: typeof musicTracks[0]) => {
    // Stop preview when selecting
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPreviewingTrackId(null);
    setPreviewProgress(0);

    onSelect({
      id: track.id,
      title: track.title,
      artist: track.artist,
      audioUrl: track.audioUrl,
      startOffset: 0,
      duration: Math.min(track.duration, videoDuration),
      volume: musicVolume,
    });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search music..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-black/50 text-white px-3 py-2 rounded-lg border border-white/20"
      />

      {selectedMusic ? (
        <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-medium">{selectedMusic.title}</p>
              <p className="text-gray-400 text-sm">{selectedMusic.artist}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs">Start Offset</label>
              <Slider
                value={[selectedMusic.startOffset]}
                min={0}
                max={Math.max(0, selectedMusic.duration - videoDuration)}
                onValueChange={([v]) => onSelect({ ...selectedMusic, startOffset: v })}
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs">Volume</label>
              <Slider
                value={[selectedMusic.volume]}
                min={0}
                max={100}
                onValueChange={([v]) => onSelect({ ...selectedMusic, volume: v })}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredTracks.map(track => {
            const isPreviewing = previewingTrackId === track.id;
            return (
              <div
                key={track.id}
                className={cn(
                  "w-full flex items-center space-x-3 p-3 rounded-lg transition-colors relative overflow-hidden",
                  isPreviewing ? "bg-purple-500/30 border border-purple-500/50" : "bg-black/30 hover:bg-black/50"
                )}
              >
                {/* Preview progress bar */}
                {isPreviewing && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all"
                    style={{ width: `${previewProgress}%` }}
                  />
                )}
                
                {/* Play/Pause preview button */}
                <button
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                    isPreviewing 
                      ? "bg-purple-500 text-white" 
                      : "bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:scale-105"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePreview(track);
                  }}
                >
                  {isPreviewing ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </button>
                
                {/* Track info */}
                <button
                  className="flex-1 text-left"
                  onClick={() => handleSelectTrack(track)}
                >
                  <p className="text-white text-sm font-medium">{track.title}</p>
                  <p className="text-gray-400 text-xs">
                    {track.artist} • {track.duration}s
                    {isPreviewing && <span className="text-purple-400 ml-2">♪ Playing preview...</span>}
                  </p>
                </button>
                
                {/* Select button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                  onClick={() => handleSelectTrack(track)}
                >
                  Use
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VideoEditor;
