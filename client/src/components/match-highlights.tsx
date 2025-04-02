import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface MatchClip {
  id: string;
  title: string;
  url: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

export const MatchHighlights: React.FC = () => {
  const [selectedClip, setSelectedClip] = useState<MatchClip | null>(null);

  const { data: matches = [], isLoading, error } = useQuery({
    queryKey: ['matchHighlights'],
    queryFn: async () => {
      const response = await fetch('/api/cricket/matches/highlights');
      if (!response.ok) {
        throw new Error('Failed to fetch highlights');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return <div>Loading highlights...</div>;
  }

  if (error) {
    return <div>Error loading highlights: {error.message}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {Array.isArray(matches) && matches.map((clip: MatchClip) => (
        <Card 
          key={clip.id} 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedClip(clip)}
        >
          <div className="aspect-video relative">
            <img 
              src={clip.url} 
              alt={clip.title}
              className="w-full h-full object-cover rounded-t-lg"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">{clip.title}</h3>
            <div className="flex gap-2">
              <Badge variant="outline">
                <Heart className="h-3 w-3 mr-1" />
                {clip.likes}
              </Badge>
              <Badge variant="outline">
                <MessageCircle className="h-3 w-3 mr-1" />
                {clip.comments}
              </Badge>
              <Badge variant="outline">
                <Share2 className="h-3 w-3 mr-1" />
                {clip.shares}
              </Badge>
            </div>
          </div>
        </Card>
      ))}

      <Dialog open={!!selectedClip} onOpenChange={() => setSelectedClip(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedClip?.title}</DialogTitle>
          </DialogHeader>
          {selectedClip && (
            <div className="aspect-video">
              <video 
                src={selectedClip.url} 
                controls 
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchHighlights;