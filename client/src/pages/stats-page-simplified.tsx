import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { PlayerStats, PlayerMatch, PlayerMatchPerformance, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Award, Calendar, Clock, Flag, MapPin } from "lucide-react";

type PlayerWithStats = {
  user: User;
  stats: PlayerStats;
};

type MatchWithPerformances = PlayerMatch & {
  performance?: PlayerMatchPerformance;
};

export default function StatsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddMatchDialogOpen, setIsAddMatchDialogOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p>Please login to view stats</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 relative">
      {/* Cricket field background - purely decorative */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-b from-[#2E8B57]/5 to-[#2E8B57]/20 opacity-50 rounded-lg"></div>
        <div className="absolute w-[80%] h-[80%] border-[10px] border-[#2E8B57]/20 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-[60%] h-[10px] bg-[#2E8B57]/20 top-1/2 left-1/2 transform -translate-x-1/2"></div>
        <div className="absolute w-[10px] h-[60%] bg-[#2E8B57]/20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Player Header */}
        <div className="flex flex-col md:flex-row items-center mb-8 bg-white p-6 rounded-lg shadow-md">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-[#2E8B57] mb-4 md:mb-0 md:mr-6">
            <AvatarImage 
              src={user.profileImage || "https://github.com/shadcn.png"} 
              alt={user.username} 
            />
            <AvatarFallback className="bg-[#2E8B57] text-white text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold cricket-primary mb-1">{user.fullName || user.username}</h1>
            <p className="text-[#2E8B57] font-medium mb-3">@{user.username}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center">
                <Award className="w-5 h-5 text-[#2E8B57] mr-2" />
                <span className="text-sm font-medium">Batsman</span>
              </div>
              <div className="flex items-center">
                <Award className="w-5 h-5 text-[#2E8B57] mr-2" />
                <span className="text-sm font-medium">All-rounder</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-[#2E8B57] mr-2" />
                <span className="text-sm font-medium">{user.location || "Location not specified"}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="default"
            className="mt-4 md:mt-0 bg-[#2E8B57] hover:bg-[#1F3B4D]"
            onClick={() => setIsAddMatchDialogOpen(true)}
          >
            Add Match
          </Button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Batting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Matches</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Runs</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average</span>
                  <span className="font-semibold">0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Strike Rate</span>
                  <span className="font-semibold">0.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Bowling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wickets</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Economy</span>
                  <span className="font-semibold">0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average</span>
                  <span className="font-semibold">0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Best Figures</span>
                  <span className="font-semibold">0/0</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Batting Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">50s</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">100s</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">4s</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">6s</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#2E8B57]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg cricket-primary">Fielding & More</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Catches</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Run Outs</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Player of Match</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Highest Score</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for Recent Matches and Stats */}
        <Tabs defaultValue="recent-matches" className="bg-white rounded-lg shadow-md">
          <TabsList className="w-full border-b p-0 h-auto">
            <TabsTrigger 
              value="recent-matches" 
              className="flex-1 py-3 rounded-none rounded-tl-lg data-[state=active]:border-b-2 data-[state=active]:border-[#2E8B57]"
            >
              Recent Matches
            </TabsTrigger>
            <TabsTrigger 
              value="performance-trends" 
              className="flex-1 py-3 rounded-none rounded-tr-lg data-[state=active]:border-b-2 data-[state=active]:border-[#2E8B57]"
            >
              Performance Trends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent-matches" className="p-4">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">No match data available</h3>
              <p className="text-muted-foreground mb-4">Add your match details to start tracking your cricket performance</p>
              <Button 
                variant="default"
                className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
                onClick={() => setIsAddMatchDialogOpen(true)}
              >
                Add Your First Match
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="performance-trends" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 border-[#2E8B57]/20">
                <CardTitle className="text-lg cricket-primary mb-4">Batting Performance</CardTitle>
                <CardDescription className="mb-4">
                  Your batting performance will be tracked across all your matches
                </CardDescription>
                
                <div className="h-64 flex items-center justify-center bg-[#2E8B57]/5 rounded-md">
                  <p className="text-center text-muted-foreground">
                    Batting performance chart will appear here as you add matches
                  </p>
                </div>
              </Card>
              
              <Card className="p-4 border-[#2E8B57]/20">
                <CardTitle className="text-lg cricket-primary mb-4">Bowling Analysis</CardTitle>
                <CardDescription className="mb-4">
                  Your bowling statistics and economy rate across matches
                </CardDescription>
                
                <div className="h-64 flex items-center justify-center bg-[#2E8B57]/5 rounded-md">
                  <p className="text-center text-muted-foreground">
                    Bowling analysis chart will appear here as you add matches
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Match Dialog */}
      <Dialog open={isAddMatchDialogOpen} onOpenChange={setIsAddMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Match</DialogTitle>
            <DialogDescription>
              This feature will be available soon. You'll be able to track your cricket match performance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => setIsAddMatchDialogOpen(false)}
              className="bg-[#2E8B57] hover:bg-[#1F3B4D]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}