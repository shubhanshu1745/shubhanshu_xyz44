import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle } from "lucide-react";
import StoryReactions from "./story-reactions";
import StoryComments from "./story-comments";

interface StoryUser {
  id: number;
  username: string;
  profileImage: string | null;
}

interface StoryData {
  id: number;
  userId: number;
  imageUrl: string;
  caption: string | null;
  filterId: string | null;
  effectIds: string | null;
  mediaType: string;
  videoUrl: string | null;
  musicTrackId: string | null;
  matchId: number | null;
  isHighlight: boolean;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  user: StoryUser;
}

interface StoryCardProps {
  story: StoryData;
  onViewStory?: () => void;
}

export default function StoryCard({ story, onViewStory }: StoryCardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  
  const handleView = () => {
    if (onViewStory) {
      onViewStory();
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={story.user.profileImage || undefined} alt={story.user.username} />
              <AvatarFallback>{getInitials(story.user.username)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{story.user.username}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(story.createdAt)}
              </div>
            </div>
          </div>
          {story.isHighlight && <Badge variant="secondary">Highlight</Badge>}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {story.caption && (
          <p className="mb-3 text-sm">{story.caption}</p>
        )}
        
        <div className="relative w-full overflow-hidden rounded-md" onClick={handleView}>
          {story.mediaType === "image" ? (
            <img 
              src={story.imageUrl} 
              alt="Story" 
              className="w-full object-cover cursor-pointer transition-opacity hover:opacity-90"
              style={{ maxHeight: "500px" }}
            />
          ) : (
            <video 
              src={story.videoUrl || undefined} 
              controls
              className="w-full h-auto cursor-pointer"
              style={{ maxHeight: "500px" }}
            />
          )}
          
          <div className="absolute bottom-2 right-2 flex items-center space-x-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
            <Eye size={14} />
            <span>{story.viewCount}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-col items-start gap-2">
        <StoryReactions storyId={story.id} currentUser={user} />
        
        <div className="flex items-center mt-2 w-full">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs"
            onClick={toggleComments}
          >
            <MessageCircle className="h-4 w-4" />
            {showComments ? "Hide comments" : "Show comments"}
          </Button>
        </div>
        
        {showComments && (
          <div className="w-full mt-2">
            <StoryComments storyId={story.id} currentUser={user} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}