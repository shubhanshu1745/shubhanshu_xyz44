import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, ThumbsUp, MessageCircle, Share2, ArrowUpRight, Clock } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

interface HighlightVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  duration: string;
  date: string;
}

export function MatchHighlights() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { data: highlights, isLoading, error } = useQuery<HighlightVideo[]>({
    queryKey: ['/api/match/highlights'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter highlights based on selected category
  const filteredHighlights = highlights ? 
    (selectedCategory === 'all' ? 
      highlights : 
      highlights.filter(highlight => highlight.tags.includes(selectedCategory))
    ) : [];

  // Extract unique tags from all highlights
  const allTags = highlights ? 
    ['all', ...new Set(highlights.flatMap(highlight => highlight.tags))] : 
    ['all'];

  // Format view count with K/M suffix
  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (error) {
    return (
      <div className="w-full p-4 text-center">
        <p>Failed to load match highlights. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Match Highlights</h2>
        <a href="/highlights" className="text-sm text-primary flex items-center hover:underline">
          View All <ArrowUpRight className="ml-1 w-4 h-4" />
        </a>
      </div>

      {/* Category selector */}
      <ScrollArea className="w-full">
        <div className="flex space-x-2 pb-2">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))
          ) : (
            allTags.map(tag => (
              <button
                key={tag}
                className={`px-4 py-1 rounded-full text-sm ${
                  selectedCategory === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setSelectedCategory(tag)}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Highlights grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-[180px] w-full rounded-t-lg" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredHighlights.map(highlight => (
            <Card key={highlight.id} className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={highlight.thumbnail} 
                    alt={highlight.title} 
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-primary text-primary-foreground rounded-full p-3">
                      <Play className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {highlight.duration}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-medium line-clamp-2">{highlight.title}</h3>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{formatViewCount(highlight.views)} views • {highlight.date}</span>
                    <div className="flex space-x-3">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{formatViewCount(highlight.likes)}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span>{formatViewCount(highlight.comments)}</span>
                      </div>
                      <div className="flex items-center">
                        <Share2 className="h-4 w-4 mr-1" />
                        <span>{formatViewCount(highlight.shares)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default MatchHighlights;