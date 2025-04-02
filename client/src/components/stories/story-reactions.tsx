import { useState, useEffect } from "react";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Cricket-specific reaction types
const reactionTypes = [
  { type: "like", emoji: "❤️", label: "Like" },
  { type: "six", emoji: "6️⃣", label: "Six!" },
  { type: "four", emoji: "4️⃣", label: "Four!" },
  { type: "howzat", emoji: "🏏", label: "Howzat!" },
  { type: "clap", emoji: "👏", label: "Clap" },
  { type: "wow", emoji: "🔥", label: "Wow" },
];

interface ReactionCounts {
  [key: string]: number;
}

interface StoryReactionsProps {
  storyId: number;
  currentUser: User | null;
  onReactionAdded?: () => void;
}

export default function StoryReactions({ storyId, currentUser, onReactionAdded }: StoryReactionsProps) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<ReactionCounts>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReactions();
  }, [storyId]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories/${storyId}/reactions`);
      
      if (response.ok) {
        const data = await response.json();
        setCounts(data.counts || {});
        setUserReaction(data.userReaction || null);
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
      toast({
        title: "Error",
        description: "Failed to load reactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to react to stories",
        variant: "default",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // If user already reacted with this type, remove the reaction
      if (userReaction === reactionType) {
        const response = await fetch(`/api/stories/${storyId}/react`, {
          method: "DELETE"
        });
        
        if (response.ok) {
          setUserReaction(null);
          setCounts(prev => ({
            ...prev,
            [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1)
          }));
          toast({
            title: "Reaction removed",
            description: "Your reaction has been removed",
            variant: "default",
          });
        }
      } else {
        // Add new reaction (will replace existing one if user already reacted)
        const response = await fetch(`/api/stories/${storyId}/react`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reactionType })
        });
        
        if (response.ok) {
          // If user already had a reaction, decrement that count
          if (userReaction) {
            setCounts(prev => ({
              ...prev,
              [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1)
            }));
          }
          
          // Update to new reaction
          setUserReaction(reactionType);
          setCounts(prev => ({
            ...prev,
            [reactionType]: (prev[reactionType] || 0) + 1
          }));
          
          toast({
            title: "Reaction added",
            description: `You reacted with ${reactionType}!`,
            variant: "default",
          });
          
          if (onReactionAdded) {
            onReactionAdded();
          }
        }
      }
    } catch (error) {
      console.error("Error submitting reaction:", error);
      toast({
        title: "Error",
        description: "Failed to submit your reaction",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {reactionTypes.map((reaction) => (
        <Button
          key={reaction.type}
          variant={userReaction === reaction.type ? "default" : "outline"}
          size="sm"
          onClick={() => handleReaction(reaction.type)}
          disabled={submitting}
          className="flex items-center gap-1 text-xs transition-all"
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.label}</span>
          {counts[reaction.type] && counts[reaction.type] > 0 ? (
            <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5">
              {counts[reaction.type]}
            </span>
          ) : null}
        </Button>
      ))}
    </div>
  );
}