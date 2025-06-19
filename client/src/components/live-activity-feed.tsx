import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Heart, MessageCircle, Share, Eye, Trophy, Zap } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: number;
  type: 'like' | 'comment' | 'share' | 'story_view' | 'match_score' | 'achievement';
  userId: number;
  user: {
    username: string;
    fullName: string;
    profileImage: string;
  };
  targetId?: number;
  targetType?: 'post' | 'story' | 'reel';
  content: string;
  metadata?: any;
  createdAt: string;
}

interface LiveActivityFeedProps {
  className?: string;
}

export function LiveActivityFeed({ className = "" }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  const { data: recentActivities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities/live"],
    queryFn: getQueryFn(),
    refetchInterval: 3000 // Update every 3 seconds for live feel
  });

  useEffect(() => {
    if (recentActivities.length > 0) {
      setActivities(prev => {
        const newActivities = recentActivities.filter(
          activity => !prev.some(p => p.id === activity.id)
        );
        return [...newActivities, ...prev].slice(0, 50); // Keep only latest 50
      });
    }
  }, [recentActivities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'share':
        return <Share className="h-4 w-4 text-green-500" />;
      case 'story_view':
        return <Eye className="h-4 w-4 text-purple-500" />;
      case 'match_score':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'achievement':
        return <Zap className="h-4 w-4 text-orange-500" />;
      default:
        return <Zap className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-red-50 border-red-200';
      case 'comment':
        return 'bg-blue-50 border-blue-200';
      case 'share':
        return 'bg-green-50 border-green-200';
      case 'story_view':
        return 'bg-purple-50 border-purple-200';
      case 'match_score':
        return 'bg-yellow-50 border-yellow-200';
      case 'achievement':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Live Activity</h3>
          <Badge variant="secondary" className="animate-pulse">
            Live
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-80">
        {activities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Zap className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`p-3 rounded-lg border ${getActivityColor(activity.type)} ${
                  index < 3 ? 'animate-fadeIn' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={activity.user.profileImage || ""} 
                      alt={activity.user.username} 
                    />
                    <AvatarFallback className="text-xs">
                      {activity.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <span className="text-sm font-medium truncate">
                        {activity.user.fullName || activity.user.username}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 leading-tight">
                      {activity.content}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                      
                      {activity.metadata && (
                        <div className="flex items-center space-x-1">
                          {activity.metadata.score && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.score}
                            </Badge>
                          )}
                          {activity.metadata.streak && (
                            <Badge variant="outline" className="text-xs">
                              🔥 {activity.metadata.streak}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}