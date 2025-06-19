import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { TrendingUp, Users, Heart, MessageCircle, Share, Eye, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface EngagementMetrics {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  totalFollowers: number;
  totalPosts: number;
  engagementRate: number;
  growthRate: number;
}

interface DailyStats {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  newFollowers: number;
}

interface TopPost {
  id: number;
  content: string;
  imageUrl: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  createdAt: string;
}

interface SocialAnalyticsProps {
  userId?: number;
  className?: string;
}

export function SocialAnalytics({ userId, className = "" }: SocialAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d");

  const { data: metrics } = useQuery<EngagementMetrics>({
    queryKey: ["/api/analytics/metrics", userId, timeRange],
    queryFn: getQueryFn()
  });

  const { data: dailyStats = [] } = useQuery<DailyStats[]>({
    queryKey: ["/api/analytics/daily", userId, timeRange],
    queryFn: getQueryFn()
  });

  const { data: topPosts = [] } = useQuery<TopPost[]>({
    queryKey: ["/api/analytics/top-posts", userId, timeRange],
    queryFn: getQueryFn()
  });

  const { data: audienceInsights } = useQuery({
    queryKey: ["/api/analytics/audience", userId],
    queryFn: getQueryFn()
  });

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  const engagementData = dailyStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    likes: stat.likes,
    comments: stat.comments,
    shares: stat.shares,
    total: stat.likes + stat.comments + stat.shares
  }));

  const growthData = dailyStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    followers: stat.newFollowers,
    views: stat.views
  }));

  const engagementBreakdown = [
    { name: 'Likes', value: metrics?.totalLikes || 0, color: '#EF4444' },
    { name: 'Comments', value: metrics?.totalComments || 0, color: '#3B82F6' },
    { name: 'Shares', value: metrics?.totalShares || 0, color: '#10B981' },
    { name: 'Views', value: metrics?.totalViews || 0, color: '#F59E0B' }
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Social Analytics</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">{metrics?.totalFollowers?.toLocaleString() || 0}</div>
                    <p className="text-sm text-gray-500">Followers</p>
                    {metrics?.growthRate && (
                      <Badge variant={metrics.growthRate > 0 ? "default" : "secondary"} className="mt-1">
                        {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate}%
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold">{metrics?.totalLikes?.toLocaleString() || 0}</div>
                    <p className="text-sm text-gray-500">Total Likes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">{metrics?.totalComments?.toLocaleString() || 0}</div>
                    <p className="text-sm text-gray-500">Comments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics?.engagementRate ? `${metrics.engagementRate.toFixed(1)}%` : '0%'}
                    </div>
                    <p className="text-sm text-gray-500">Engagement Rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Growth Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="followers" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="New Followers"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Views"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Engagement Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engagement Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="likes" stackId="a" fill="#EF4444" name="Likes" />
                        <Bar dataKey="comments" stackId="a" fill="#3B82F6" name="Comments" />
                        <Bar dataKey="shares" stackId="a" fill="#10B981" name="Shares" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Engagement Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engagement Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={engagementBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {engagementBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Goals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Follower Growth</span>
                      <span className="text-sm text-gray-500">750 / 1000</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Engagement Rate</span>
                      <span className="text-sm text-gray-500">4.2% / 5.0%</span>
                    </div>
                    <Progress value={84} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Total Likes</span>
                      <span className="text-sm text-gray-500">2,850 / 3,000</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Performing Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPosts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No top posts data available</p>
                      </div>
                    ) : (
                      topPosts.slice(0, 5).map((post, index) => (
                        <div key={post.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          
                          {post.imageUrl && (
                            <img 
                              src={post.imageUrl} 
                              alt="" 
                              className="h-12 w-12 object-cover rounded"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2 mb-1">
                              {post.content}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                {post.likes}
                              </span>
                              <span className="flex items-center">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {post.comments}
                              </span>
                              <span className="flex items-center">
                                <Share className="h-3 w-3 mr-1" />
                                {post.shares}
                              </span>
                            </div>
                          </div>
                          
                          <Badge variant="secondary">
                            {post.engagementRate.toFixed(1)}%
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Content Performance Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Best posting time</p>
                        <p className="text-xs text-gray-600">Your audience is most active between 6-8 PM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <Heart className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">High engagement content</p>
                        <p className="text-xs text-gray-600">Posts with images get 3x more engagement</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Improve engagement</p>
                        <p className="text-xs text-gray-600">Ask questions to increase comments by 40%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Audience Demographics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Cricket Fans</span>
                          <span className="text-sm font-medium">65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Sports Enthusiasts</span>
                          <span className="text-sm font-medium">45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Casual Viewers</span>
                          <span className="text-sm font-medium">30%</span>
                        </div>
                        <Progress value={30} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Geographic Reach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">India</span>
                        <Badge variant="secondary">42%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Australia</span>
                        <Badge variant="secondary">18%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">England</span>
                        <Badge variant="secondary">15%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">South Africa</span>
                        <Badge variant="secondary">12%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Others</span>
                        <Badge variant="secondary">13%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Activity pattern data coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}