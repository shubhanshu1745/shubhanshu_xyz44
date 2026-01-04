import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, ArrowDown, Plus, Compass, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ReelCard } from "./reel-viewer";
import { CreateReelDialog } from "./create-reel-dialog";
import { motion, AnimatePresence } from "framer-motion";

interface ReelsFeedProps {
  className?: string;
  initialType?: 'following' | 'explore' | 'trending';
}

export function ReelsFeed({ className = "", initialType = 'following' }: ReelsFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedType, setFeedType] = useState<'following' | 'explore' | 'trending'>(initialType);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  
  const { data: reelsData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["/api/reels/feed", feedType],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/reels/feed?type=${feedType}&page=${pageParam}&limit=10`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch reels");
      return response.json();
    },
    getNextPageParam: (lastPage: any[], pages) => {
      return lastPage?.length === 10 ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allReels = reelsData?.pages.flat() || [];

  // Reset index when feed type changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [feedType]);

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 300);

    if (direction === 'down' && currentIndex < allReels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Fetch more when near the end
      if (currentIndex >= allReels.length - 3 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, allReels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleVideoRef = useCallback((_index: number) => (_ref: HTMLVideoElement | null) => {
    // Video refs are managed by individual ReelCard components
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handleScroll('up');
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleScroll('down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll]);

  // Touch/wheel navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let threshold = 50;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          handleScroll('down');
        } else {
          handleScroll('up');
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          handleScroll('down');
        } else {
          handleScroll('up');
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleScroll]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (!allReels.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center px-4">
          <div className="mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center">
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
        <CreateReelDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`h-screen overflow-hidden bg-black ${className}`}>
      {/* Header with tabs */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold">Reels</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        
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

      {/* Reels container */}
      <motion.div 
        className="h-full"
        animate={{ y: -currentIndex * window.innerHeight }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ height: `${allReels.length * 100}vh` }}
      >
        {allReels.map((reel, index) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            isActive={index === currentIndex}
            onVideoRef={handleVideoRef(index)}
          />
        ))}
      </motion.div>

      {/* Navigation indicators */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-20">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-black/30 text-white hover:bg-black/50 rounded-full"
          onClick={() => handleScroll('up')}
          disabled={currentIndex === 0}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 bg-black/30 text-white hover:bg-black/50 rounded-full"
          onClick={() => handleScroll('down')}
          disabled={currentIndex === allReels.length - 1}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20">
        <div className="flex flex-col space-y-1">
          {allReels.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((_, idx) => {
            const actualIndex = Math.max(0, currentIndex - 3) + idx;
            return (
              <motion.div
                key={actualIndex}
                className={`w-1 rounded-full transition-all ${
                  actualIndex === currentIndex ? 'bg-white h-8' : 'bg-white/30 h-4'
                }`}
                layoutId={`indicator-${actualIndex}`}
              />
            );
          })}
        </div>
      </div>

      {/* Loading indicator */}
      <AnimatePresence>
        {isFetchingNextPage && (
          <motion.div 
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="bg-black/50 rounded-full px-4 py-2 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              <span className="text-white text-sm">Loading more...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Reel Dialog */}
      <CreateReelDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}

export default ReelsFeed;
