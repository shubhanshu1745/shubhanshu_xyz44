import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import { PlayerStats, PlayerMatch, PlayerMatchPerformance, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { Calendar, Trophy, Award, TrendingUp } from "lucide-react";

type PlayerWithStats = {
  user: User;
  stats: PlayerStats;
};

type MatchWithPerformances = PlayerMatch & {
  performance?: PlayerMatchPerformance;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PlayerStatsPage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth() || {};
  const defaultTab = "overview";

  const { data: playerData, isLoading: isPlayerLoading } = useQuery<PlayerWithStats>({
    queryKey: [`/api/users/${username}/player-stats`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!username && !!currentUser,
  });

  const { data: matches, isLoading: isMatchesLoading } = useQuery<MatchWithPerformances[]>({
    queryKey: [`/api/users/${username}/matches`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!username && !!currentUser,
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view player statistics</p>
      </div>
    );
  }

  if (isPlayerLoading || isMatchesLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Skeleton className="h-[400px] mb-6" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!playerData || !playerData.stats) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg">Player statistics not available</p>
            <p className="text-muted-foreground">This user does not have cricket player statistics available.</p>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats } = playerData;

  // Prepare data for batting chart
  const battingData = [
    {
      name: "Runs",
      value: stats.totalRuns,
    },
    {
      name: "4s",
      value: stats.totalFours,
    },
    {
      name: "6s",
      value: stats.totalSixes,
    },
  ];

  // Prepare data for bowling and fielding pie chart
  const bowlingFieldingData = [
    {
      name: "Wickets",
      value: stats.totalWickets,
    },
    {
      name: "Catches",
      value: stats.totalCatches,
    },
  ];

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Player Info Header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.profileImage || ""} alt={user.username} />
          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.fullName || user.username}</h1>
          <p className="text-muted-foreground">@{user.username} • {stats.position || "Cricket Player"}</p>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Trophy className="mr-2 h-4 w-4" /> Career
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches} Matches</div>
            <p className="text-xs text-muted-foreground mt-1">
              Batting Avg: {stats.battingAverage} | Bowling Avg: {stats.bowlingAverage}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Award className="mr-2 h-4 w-4" /> Batting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRuns} Runs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Highest Score: {stats.highestScore} | Style: {stats.battingStyle || "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" /> Bowling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWickets} Wickets</div>
            <p className="text-xs text-muted-foreground mt-1">
              Best Bowling: {stats.bestBowling || "N/A"} | Style: {stats.bowlingStyle || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different stat categories */}
      <Tabs defaultValue={defaultTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batting">Batting</TabsTrigger>
          <TabsTrigger value="bowling">Bowling</TabsTrigger>
          <TabsTrigger value="matches">Recent Matches</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Career Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Performance Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Matches</span>
                      <span className="font-medium">{stats.totalMatches}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Total Runs</span>
                      <span className="font-medium">{stats.totalRuns}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Total Wickets</span>
                      <span className="font-medium">{stats.totalWickets}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Highest Score</span>
                      <span className="font-medium">{stats.highestScore}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Best Bowling</span>
                      <span className="font-medium">{stats.bestBowling || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Total Catches</span>
                      <span className="font-medium">{stats.totalCatches}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Batting & Bowling Summary</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={battingData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {battingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batting Tab */}
        <TabsContent value="batting">
          <Card>
            <CardHeader>
              <CardTitle>Batting Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Batting Style</span>
                      <span className="font-medium">{stats.battingStyle || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Total Runs</span>
                      <span className="font-medium">{stats.totalRuns}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Batting Average</span>
                      <span className="font-medium">{stats.battingAverage}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Highest Score</span>
                      <span className="font-medium">{stats.highestScore}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">4s</span>
                      <span className="font-medium">{stats.totalFours}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">6s</span>
                      <span className="font-medium">{stats.totalSixes}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Batting Performance</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={battingData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bowling Tab */}
        <TabsContent value="bowling">
          <Card>
            <CardHeader>
              <CardTitle>Bowling Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Bowling Style</span>
                      <span className="font-medium">{stats.bowlingStyle || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Total Wickets</span>
                      <span className="font-medium">{stats.totalWickets}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Bowling Average</span>
                      <span className="font-medium">{stats.bowlingAverage}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Best Bowling</span>
                      <span className="font-medium">{stats.bestBowling || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Total Catches</span>
                      <span className="font-medium">{stats.totalCatches}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Bowling & Fielding</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={bowlingFieldingData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {bowlingFieldingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {matches && matches.length > 0 ? (
                <Table>
                  <TableCaption>Recent matches played by {user.username}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Runs</TableHead>
                      <TableHead>Wickets</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(match.matchDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{match.matchName}</TableCell>
                        <TableCell>{match.opponent}</TableCell>
                        <TableCell>{match.performance?.runsScored || "-"}</TableCell>
                        <TableCell>{match.performance?.wicketsTaken || "-"}</TableCell>
                        <TableCell>
                          <span className={
                            match.result?.includes("Won") 
                              ? "text-green-600 font-medium" 
                              : match.result?.includes("Lost")
                                ? "text-red-600"
                                : ""
                          }>
                            {match.result || "N/A"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p>No recent matches found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}