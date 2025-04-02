import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GitCompare, Flame, Download, Filter } from "lucide-react";

interface PlayerMatchupProps {
  player1Id?: number;
  player2Id?: number;
  matchType?: string;
}

export default function PlayerMatchup({ player1Id, player2Id, matchType }: PlayerMatchupProps) {
  // Mock data for player matchup
  const player1 = {
    id: player1Id || 1,
    name: "Virat Kohli",
    imageUrl: "https://github.com/shadcn.png",
    role: "Batsman",
    team: "Royal Challengers Bangalore",
  };
  
  const player2 = {
    id: player2Id || 2,
    name: "Jasprit Bumrah",
    imageUrl: "https://github.com/shadcn.png",
    role: "Bowler",
    team: "Mumbai Indians",
  };
  
  const headToHeadData = {
    totalBalls: 48,
    runs: 62,
    dismissals: 2,
    boundaries: 7,
    sixes: 2,
    dotBalls: 18,
    strikeRate: 129.17,
    averageRuns: 31.0,
  };
  
  const deliveryData = [
    { name: 'Yorker', count: 12, successRate: 75 },
    { name: 'Bouncer', count: 8, successRate: 62.5 },
    { name: 'Length', count: 15, successRate: 40 },
    { name: 'Good Length', count: 8, successRate: 87.5 },
    { name: 'Full Toss', count: 5, successRate: 20 },
  ];
  
  const dismissalData = [
    { name: 'Bowled', value: 1 },
    { name: 'Caught', value: 1 },
    { name: 'LBW', value: 0 },
    { name: 'Stumped', value: 0 },
    { name: 'Run Out', value: 0 },
  ];
  
  const scoringZones = [
    { name: 'Fine Leg', value: 12 },
    { name: 'Square Leg', value: 8 },
    { name: 'Mid-wicket', value: 15 },
    { name: 'Mid-on', value: 5 },
    { name: 'Straight', value: 2 },
    { name: 'Mid-off', value: 4 },
    { name: 'Cover', value: 10 },
    { name: 'Point', value: 6 },
    { name: 'Third Man', value: 0 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  const matchupByVenue = [
    { name: 'M. Chinnaswamy Stadium', strikeRate: 142.8, average: 35.0, economy: 8.2 },
    { name: 'Wankhede Stadium', strikeRate: 121.4, average: 28.0, economy: 7.1 },
    { name: 'Eden Gardens', strikeRate: 132.6, average: 32.0, economy: 7.8 },
    { name: 'Arun Jaitley Stadium', strikeRate: 118.2, average: 24.0, economy: 6.9 },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Player Matchup Analysis
              </CardTitle>
              <CardDescription>
                Historical performance statistics between players
              </CardDescription>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={player1.imageUrl} />
                  <AvatarFallback>VK</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{player1.name}</div>
                  <div className="text-sm text-muted-foreground">{player1.role}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <GitCompare className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={player2.imageUrl} />
                  <AvatarFallback>JB</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{player2.name}</div>
                  <div className="text-sm text-muted-foreground">{player2.role}</div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="summary">Head-to-Head</TabsTrigger>
              <TabsTrigger value="deliveries">Delivery Analysis</TabsTrigger>
              <TabsTrigger value="scoring">Scoring Zones</TabsTrigger>
              <TabsTrigger value="venues">By Venue</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Balls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{headToHeadData.totalBalls}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Runs Scored</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{headToHeadData.runs}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Strike Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{headToHeadData.strikeRate}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Dismissals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{headToHeadData.dismissals}</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Boundary Percentage</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Boundaries', value: headToHeadData.boundaries * 4 + headToHeadData.sixes * 6 },
                            { name: 'Others', value: headToHeadData.runs - (headToHeadData.boundaries * 4 + headToHeadData.sixes * 6) }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#1F3B4D" />
                          <Cell fill="#E5E7EB" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dismissal Types</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dismissalData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#2E8B57" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="deliveries" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Delivery Type Analysis</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deliveryData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="Number of Deliveries" fill="#1F3B4D" />
                      <Bar yAxisId="right" dataKey="successRate" name="Success Rate (%)" fill="#2E8B57" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="scoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scoring Zone Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoringZones}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {scoringZones.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="venues" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance by Venue</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={matchupByVenue}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="strikeRate" name="Strike Rate" fill="#1F3B4D" />
                      <Bar dataKey="average" name="Average" fill="#2E8B57" />
                      <Bar dataKey="economy" name="Economy" fill="#FFC107" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end">
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground">
                <Flame className="h-3 w-3 inline mr-1" />
                Based on {headToHeadData.totalBalls} balls faced over {Math.ceil(headToHeadData.totalBalls / 6)} overs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}