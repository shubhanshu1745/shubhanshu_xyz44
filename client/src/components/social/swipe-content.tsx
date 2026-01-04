import { useState, useRef, useEffect, ReactNode } from "react";

interface SwipeContentProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeContent({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = ""
}: SwipeContentProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (distanceX < -threshold && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (distanceY > threshold && onSwipeUp) {
        onSwipeUp();
      } else if (distanceY < -threshold && onSwipeDown) {
        onSwipeDown();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`touch-manipulation ${className}`}
    >
      {children}
    </div>
  );
}

// Swipeable card for feed items
interface SwipeableCardProps {
  children: ReactNode;
  onLike?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  className?: string;
}

export function SwipeableCard({
  children,
  onLike,
  onSave,
  onShare,
  className = ""
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Limit the offset
    setOffset(Math.max(-100, Math.min(100, diff)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (offset > 50 && onLike) {
      onLike();
    } else if (offset < -50 && onSave) {
      onSave();
    }
    
    setOffset(0);
  };

  const getBackgroundColor = () => {
    if (offset > 30) return "bg-red-100";
    if (offset < -30) return "bg-blue-100";
    return "bg-white";
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Action indicators */}
      <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-center bg-red-500 text-white">
        ❤️
      </div>
      <div className="absolute inset-y-0 right-0 w-16 flex items-center justify-center bg-blue-500 text-white">
        🔖
      </div>
      
      {/* Main content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative transition-transform duration-200 ${getBackgroundColor()} ${
          isDragging ? "" : "transition-all"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  className = ""
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || containerRef.current?.scrollTop !== 0) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`overflow-auto ${className}`}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all duration-200"
        style={{ height: pullDistance }}
      >
        {isRefreshing ? (
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        ) : pullDistance > 0 ? (
          <div className={`transition-transform ${pullDistance >= threshold ? "scale-110" : ""}`}>
            ↓ {pullDistance >= threshold ? "Release to refresh" : "Pull to refresh"}
          </div>
        ) : null}
      </div>
      
      {children}
    </div>
  );
}
