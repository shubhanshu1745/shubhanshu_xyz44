import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import {
  Heart,
  ThumbsUp,
  Trophy,
  Award,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type CricketReactionsProps = {
  postId: number;
  userId: number | undefined;
  likeCount: number;
  currentUserReaction?: string;
  reactionCounts?: Record<string, number>;
};

type ReactionType = 'like' | 'six' | 'four' | 'wicket' | 'century' | 'catch' | 'wow';

const reactionIcons: Record<ReactionType, React.ReactNode> = {
  like: <ThumbsUp className="h-4 w-4 mr-1" />,
  six: <span className="font-bold text-sm mr-1">6</span>,
  four: <span className="font-bold text-sm mr-1">4</span>,
  wicket: <span className="font-bold text-sm mr-1">W</span>,
  century: <span className="font-bold text-sm mr-1">100</span>,
  catch: <span className="font-bold text-sm mr-1">C</span>,
  wow: <Star className="h-4 w-4 mr-1" />,
};

const reactionLabels: Record<ReactionType, string> = {
  like: 'Like',
  six: 'Six!',
  four: 'Four!',
  wicket: 'Howzat!',
  century: 'Century!',
  catch: 'Great Catch!',
  wow: 'Wow!'
};

const reactionColors: Record<ReactionType, string> = {
  like: 'text-blue-500',
  six: 'text-purple-500',
  four: 'text-green-500',
  wicket: 'text-red-500',
  century: 'text-yellow-500',
  catch: 'text-orange-500',
  wow: 'text-pink-500',
};

export function CricketReactions({
  postId,
  userId,
  likeCount,
  currentUserReaction,
  reactionCounts = {},
}: CricketReactionsProps) {
  const [showAllReactions, setShowAllReactions] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Combine default like with cricket-specific reactions
  const allReactions: ReactionType[] = ['like', 'six', 'four', 'wicket', 'century', 'catch', 'wow'];
  
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ reaction }: { reaction: ReactionType }) => {
      if (!userId) {
        throw new Error('You must be logged in to react to posts');
      }
      
      if (currentUserReaction) {
        // If user already reacted, remove the reaction
        await apiRequest('DELETE', `/api/posts/${postId}/like`);
        
        // If the user is changing the reaction type, add the new reaction
        if (currentUserReaction !== reaction) {
          await apiRequest('POST', `/api/posts/${postId}/like`, {
            userId,
            postId,
            reactionType: reaction,
          });
          return { reactionType: reaction };
        }
        
        return { reactionType: null };
      } else {
        // Add a new reaction
        await apiRequest('POST', `/api/posts/${postId}/like`, {
          userId,
          postId,
          reactionType: reaction,
        });
        return { reactionType: reaction };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/posts'],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleReactionClick = (reaction: ReactionType) => {
    toggleReactionMutation.mutate({ reaction });
  };

  // Determine which reaction to show when collapsed
  const mainReaction: ReactionType = currentUserReaction as ReactionType || 'like';

  // Get total reaction count
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0) || likeCount;

  return (
    <div className="flex flex-col items-start space-y-2">
      <div className="flex items-center space-x-2">
        {/* Main reaction button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${currentUserReaction ? reactionColors[currentUserReaction as ReactionType] : ''}`}
          onClick={() => handleReactionClick(mainReaction)}
        >
          {reactionIcons[mainReaction]}
          <span className="text-xs">{reactionLabels[mainReaction]}</span>
        </Button>
        
        {/* Toggle for additional reactions */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowAllReactions(!showAllReactions)}
        >
          {showAllReactions ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {/* Reaction count */}
        <span className="text-xs text-muted-foreground">
          {totalReactions > 0 ? `${totalReactions} ${totalReactions === 1 ? 'reaction' : 'reactions'}` : ''}
        </span>
      </div>
      
      {/* Expandable reaction options */}
      {showAllReactions && (
        <div className="flex flex-wrap gap-1 mt-1">
          {allReactions.map((reaction) => (
            <Button
              key={reaction}
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${
                currentUserReaction === reaction ? reactionColors[reaction] : ''
              }`}
              onClick={() => handleReactionClick(reaction)}
            >
              {reactionIcons[reaction]}
              <span className="text-xs">{reactionLabels[reaction]}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}