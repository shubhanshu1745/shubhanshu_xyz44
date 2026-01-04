import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Heart, MessageCircle, Share, Eye, Trophy, Zap, Activity, Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    refetchInterval: 3000
  });

  useEffect(() => {
    if (recentActivities.length > 0) {
      setActivities(prev => {
        const newActivities = recentActivities.filter(
          activity => !prev.some(p => p.id === activity.id)
        );
        return [...newActivities, ...prev].slice(0, 50);
      });
    }
  }, [recentActivities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="h-3.5 w-3.5 text-blue-500" />;
      case 'share':
        return <Share className="h-3.5 w-3.5 text-green-500" />;
      case 'story_view':
        return <Eye className="h-3.5 w-3.5 text-purple-500" />;
      case 'match_score':
        return <Trophy className="h-3.5 w-3.5 text-amber-500" />;
      case 'achievement':
        return <Zap className="h-3.5 w-3.5 text-orange-500" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-red-50 border-red-100';
      case 'comment':
        return 'bg-blue-50 border-blue-100';
      case 'share':
        return 'bg-green-50 border-green-100';
      case 'story_view':
        return 'bg-purple-50 border-purple-100';
      case 'match_score':
        return 'bg-amber-50 border-amber-100';
      case 'achievement':
        return 'bg-orange-50 border-orange-100';
      default:
        return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <Card className={`border-0 shadow-lg bg-white overflow-hidden ${className}`}>
      <CardHeader className="pb-3 pt-5 px-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Live Activity</h3>
              <p className="text-xs text-slate-500">Real-time updates</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-700 border-0 animate-pulse font-semibold text-xs px-2.5 py-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 inline-block animate-pulse" />
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {activities.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Bell className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No recent activity</p>
              <p className="text-slate-400 text-sm mt-1">Activity from your network will appear here</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`p-3 rounded-xl border ${getActivityBg(activity.type)} ${
                    index < 3 ? 'animate-fadeIn' : ''
                  } transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm flex-shrink-0">
                      <AvatarImage 
                        src={activity.user.profileImage || ""} 
                        alt={activity.user.username} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold">
                        {activity.user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 rounded-md bg-white shadow-sm">
                          {getActivityIcon(activity.type)}
                        </div>
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {activity.user.fullName || activity.user.username}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-600 leading-snug line-clamp-2">
                        {activity.content}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                        
                        {activity.metadata && (
                          <div className="flex items-center gap-1.5">
                            {activity.metadata.score && (
                              <Badge variant="outline" className="text-xs py-0 h-5 bg-white">
                                {activity.metadata.score}
                              </Badge>
                            )}
                            {activity.metadata.streak && (
                              <Badge variant="outline" className="text-xs py-0 h-5 bg-white">
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
      </CardContent>
    </Card>
  );
}
