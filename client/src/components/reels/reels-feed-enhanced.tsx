import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowUp, ArrowDown, Plus, Compass, TrendingUp, Users, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ReelCardEnhanced } from "./reel-viewer-enhanced";
import { CreateReelEnhanced } from "./create-reel-enhanced";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

// Video preloader utility
class VideoPreloader {
  private preloadedVideos: Map<string, HTMLVideoElement> = new Map();
  private preloadQueue: string[] = [];
  private maxPreloaded = 3;

  preload(url: string): void {
    if (!url || this.preloadedVideos.has(url)) return;
    
    // Remove oldest if at capacity
    if (this.preloadedVideos.size >= this.maxPreloaded) {
      const oldest = this.preloadQueue.shift();
      if (oldest) {
        const video = this.preloadedVideos.get(oldest);
        if (video) {
          video.src = '';
          video.load();
        }
        this.preloadedVideos.delete(oldest);
      }
    }

    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    // Start loading
    video.src = url;
    video.load();
    
    this.preloadedVideos.set(url, video);
    this.preloadQueue.push(url);
  }

  getPreloaded(url: string): HTMLVideoElement | undefined {
    return this.preloadedVideos.get(url);
  }

  clear(): void {
    this.preloadedVideos.forEach(video => {
      video.src = '';
      video.load();
    });
    this.preloadedVideos.clear();
    this.preloadQueue = [];
  }
}

const videoPreloader = new VideoPreloader();

interface ReelsFeedEnhancedProps {
  className?: string;
  initialType?: "following" | "explore" | "trending";
  initialReelId?: number;
}

export function ReelsFeedEnhanced({ 
  className = "", 
  initialType = "following",
  initialReelId 
}: ReelsFeedEnhancedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedType, setFeedType] = useState<"following" | "explore" | "trending">(initialType);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const touchStartY = useRef(0);
  
  // Motion values for smooth transitions
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-100, 0, 100], [0.5, 1, 0.5]);

  // Fetch reels with infinite scroll
  const { 
    data: reelsData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    refetch 
  } = useInfiniteQuery({
    queryKey: ["/api/reels/feed", feedType],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/reels/feed?type=${feedType}&page=${pageParam}&limit=10`, 
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch reels");
      return response.json();
    },
    getNextPageParam: (lastPage: any[], pages) => {
      return lastPage?.length === 10 ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allReels = useMemo(() => reelsData?.pages.flat() || [], [reelsData]);

  // Find initial reel index if provided
  useEffect(() => {
    if (initialReelId && allReels.length > 0) {
      const index = allReels.findIndex(r => r.id === initialReelId);
      if (index !== -1) setCurrentIndex(index);
    }
  }, [initialReelId, allReels]);

  // Reset index when feed type changes
  useEffect(() => {
    setCurrentIndex(0);
    refetch();
  }, [feedType, refetch]);

  // Preload next videos when current index changes
  useEffect(() => {
    if (allReels.length === 0) return;

    // Preload next 2 videos
    const preloadIndices = [currentIndex + 1, currentIndex + 2];
    preloadIndices.forEach(idx => {
      if (idx < allReels.length) {
        const reel = allReels[idx];
        const videoUrl = reel.videoUrl || reel.imageUrl;
        if (videoUrl) {
          videoPreloader.preload(videoUrl);
        }
      }
    });

    // Also preload previous video for smooth backward navigation
    if (currentIndex > 0) {
      const prevReel = allReels[currentIndex - 1];
      const prevVideoUrl = prevReel.videoUrl || prevReel.imageUrl;
      if (prevVideoUrl) {
        videoPreloader.preload(prevVideoUrl);
      }
    }
  }, [currentIndex, allReels]);

  // Cleanup preloader on unmount
  useEffect(() => {
    return () => {
      videoPreloader.clear();
    };
  }, []);

  // Scroll handler
  const handleScroll = useCallback((direction: "up" | "down") => {
    if (isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    setTimeout(() => { isScrollingRef.current = false; }, 400);

    if (direction === "down" && currentIndex < allReels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Prefetch more when near the end
      if (currentIndex >= allReels.length - 3 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    } else if (direction === "up" && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, allReels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearch) return;
      
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        handleScroll("up");
      } else if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        handleScroll("down");
      } else if (e.key === "m") {
        // Toggle mute with 'm' key
      } else if (e.key === "l") {
        // Like with 'l' key
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleScroll, showSearch]);

  // Touch/wheel navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const threshold = 50;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const diff = touchStartY.current - endY;

      if (Math.abs(diff) > threshold) {
        handleScroll(diff > 0 ? "down" : "up");
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 30) {
        handleScroll(e.deltaY > 0 ? "down" : "up");
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleScroll]);

  // Pan gesture handler
  const handlePanEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.velocity.y) > 500 || Math.abs(info.offset.y) > 100) {
      handleScroll(info.offset.y < 0 ? "down" : "up");
    }
  }, [handleScroll]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
          </div>
          <p className="text-lg font-medium">Loading reels...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!allReels.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center px-4">
          <div className="mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Plus className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">No reels yet</h2>
          <p className="text-gray-400 mb-6">Be the first to share a cricket moment!</p>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Create Reel
          </Button>
        </div>
        <CreateReelEnhanced open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("h-screen overflow-hidden bg-black", className)}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold">Reels</h1>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowSearch(!showSearch)}
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Input
                placeholder="Search reels, users, hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Feed Type Tabs */}
        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as any)}>
          <TabsList className="bg-white/10 border-0">
            <TabsTrigger 
              value="following" 
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Following
            </TabsTrigger>
            <TabsTrigger 
              value="explore"
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
            >
              <Compass className="h-4 w-4 mr-2" />
              Explore
            </TabsTrigger>
            <TabsTrigger 
              value="trending"
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Reels Container */}
      <motion.div 
        className="h-full"
        animate={{ y: -currentIndex * window.innerHeight }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ height: `${allReels.length * 100}vh` }}
        onPanEnd={handlePanEnd}
      >
        {allReels.map((reel, index) => (
          <ReelCardEnhanced
            key={reel.id}
            reel={reel}
            isActive={index === currentIndex}
          />
        ))}
      </motion.div>

      {/* Navigation Controls */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-20">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all",
            currentIndex === 0 
              ? "bg-black/20 text-white/30 cursor-not-allowed" 
              : "bg-black/40 text-white hover:bg-black/60"
          )}
          onClick={() => handleScroll("up")}
          disabled={currentIndex === 0}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all",
            currentIndex === allReels.length - 1 
              ? "bg-black/20 text-white/30 cursor-not-allowed" 
              : "bg-black/40 text-white hover:bg-black/60"
          )}
          onClick={() => handleScroll("down")}
          disabled={currentIndex === allReels.length - 1}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Dots */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col space-y-1">
          {allReels.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((_, idx) => {
            const actualIndex = Math.max(0, currentIndex - 3) + idx;
            const isActive = actualIndex === currentIndex;
            return (
              <motion.div
                key={actualIndex}
                className={cn(
                  "w-1 rounded-full transition-all cursor-pointer",
                  isActive ? "bg-white h-8" : "bg-white/30 h-4 hover:bg-white/50"
                )}
                onClick={() => setCurrentIndex(actualIndex)}
                whileHover={{ scale: 1.2 }}
              />
            );
          })}
        </div>
      </div>

      {/* Reel Counter */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
          {currentIndex + 1} / {allReels.length}
        </div>
      </div>

      {/* Loading More Indicator */}
      <AnimatePresence>
        {isFetchingNextPage && (
          <motion.div 
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span className="text-white text-sm">Loading more...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Reel Dialog */}
      <CreateReelEnhanced open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}

export default ReelsFeedEnhanced;
