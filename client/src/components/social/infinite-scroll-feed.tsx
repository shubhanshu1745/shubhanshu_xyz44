import { useState, useEffect, useRef, ReactNode, useCallback } from "react";

interface InfiniteScrollFeedProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  className?: string;
  emptyMessage?: string;
  loadingComponent?: ReactNode;
}

export function InfiniteScrollFeed<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoading,
  threshold = 200,
  className = "",
  emptyMessage = "No items to display",
  loadingComponent
}: InfiniteScrollFeedProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: `${threshold}px` }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore, threshold]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
      
      {/* Loading indicator / trigger */}
      <div ref={loadingRef} className="py-4">
        {isLoading && (
          loadingComponent || (
            <div className="flex justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-muted-foreground text-sm">
            You've reached the end
          </p>
        )}
      </div>
    </div>
  );
}

// Virtualized list for better performance with large lists
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 3,
  className = ""
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: "100%" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for feed items
interface FeedSkeletonProps {
  count?: number;
}

export function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-card rounded-lg p-4 animate-pulse">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
          
          {/* Image placeholder */}
          <div className="h-64 bg-muted rounded-lg mb-4" />
          
          {/* Actions */}
          <div className="flex gap-4">
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Grid layout for explore/discover
interface GridFeedProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export function GridFeed<T>({
  items,
  renderItem,
  columns = 3,
  gap = 2,
  className = ""
}: GridFeedProps<T>) {
  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 4}px`
      }}
    >
      {items.map((item, index) => (
        <div key={index} className="aspect-square overflow-hidden">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
