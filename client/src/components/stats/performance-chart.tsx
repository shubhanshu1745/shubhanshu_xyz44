
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleDot, Target, TrendingUp } from "lucide-react";

interface PerformanceDataPoint {
  date: string;
  runs: number;
  wickets: number;
  [key: string]: any; // For any additional properties
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded p-2 shadow-sm">
        <p className="text-xs font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-xs" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}: </span>
            {entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Process data to calculate additional metrics
  const processedData = data.map(item => {
    // Calculate strike rate if balls faced is available
    const strikeRate = item.ballsFaced ? ((item.runs / item.ballsFaced) * 100).toFixed(1) : null;
    
    // Calculate economy if overs bowled is available
    const oversBowled = parseFloat(item.oversBowled || '0');
    const economy = oversBowled > 0 ? (item.runsConceded / oversBowled).toFixed(2) : null;
    
    return {
      ...item,
      strikeRate: strikeRate ? parseFloat(strikeRate) : 0,
      economy: economy ? parseFloat(economy) : 0
    };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Performance Analysis</CardTitle>
        </div>
        <CardDescription>
          Track your cricket performance trends over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="batting">
          <TabsList className="mb-4">
            <TabsTrigger value="batting" className="flex items-center gap-1">
              <CircleDot className="h-4 w-4" />
              Batting
            </TabsTrigger>
            <TabsTrigger value="bowling" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Bowling
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="batting" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E8B57" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2E8B57" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#888' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#888' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="runs" 
                    stroke="#2E8B57" 
                    fillOpacity={1} 
                    fill="url(#colorRuns)" 
                    name="Runs Scored"
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="strikeRate" 
                    stroke="#1F3B4D" 
                    name="Strike Rate" 
                    dot={{ r: 3 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="fours" fill="#3B82F6" name="Fours" />
                  <Bar dataKey="sixes" fill="#8B5CF6" name="Sixes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="bowling" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#888' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#888' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#888' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="wicketsTaken" 
                    stroke="#1F3B4D" 
                    strokeWidth={2}
                    name="Wickets" 
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="economy" 
                    stroke="#2E8B57" 
                    strokeWidth={2}
                    name="Economy" 
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <ReferenceLine y={6} yAxisId="right" stroke="#FF8C00" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="maidens" fill="#3B82F6" name="Maidens" />
                  <Bar dataKey="runsConceded" fill="#EF4444" name="Runs Conceded" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
