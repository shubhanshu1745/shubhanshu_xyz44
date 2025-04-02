import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import MatchScorecard from "@/components/match-scorecard";
import MatchHighlights from "@/components/match-highlights";
import { Share2, ArrowLeft, MessageCircle } from "lucide-react";
import { MatchDiscussionGroups } from "@/components/match-discussion-groups";
import { LiveMatchStreaming } from "@/components/live-match-streaming";

export default function MatchDetailsPage() {
  const [, params] = useRoute('/matches/:id');
  const matchId = params?.id;
  const [activeTab, setActiveTab] = useState('scorecard');
  
  // Fetch match details
  const { data: matchDetails, isLoading, error } = useQuery({
    queryKey: ['/api/match/details', matchId],
    enabled: !!matchId,
    staleTime: 60 * 1000, // Refresh every minute
  });
  
  if (!matchId) {
    return (
      <div className="container max-w-6xl mx-auto p-4 mt-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Match Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested match could not be found.</p>
          <Button asChild>
            <a href="/matches">Back to Matches</a>
          </Button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 mt-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <a href="/matches">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Skeleton className="h-12 w-full mb-6" />
        
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-6xl mx-auto p-4 mt-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Error Loading Match</h1>
          <p className="text-muted-foreground mb-6">There was an error loading the match details. Please try again later.</p>
          <Button asChild>
            <a href="/matches">Back to Matches</a>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto p-4 mt-4">
      {/* Header and back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <a href="/matches">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Button>
          <h1 className="text-2xl font-bold">{matchDetails?.title || 'Match Details'}</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setActiveTab('discussion')}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Join Discussion
          </Button>
        </div>
      </div>
      
      {/* Tabs for different match content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="stream">Live Stream</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scorecard" className="mt-6">
          <MatchScorecard matchId={matchId} />
        </TabsContent>
        
        <TabsContent value="stream" className="mt-6">
          <LiveMatchStreaming matchId={matchId} />
        </TabsContent>
        
        <TabsContent value="highlights" className="mt-6">
          <MatchHighlights />
        </TabsContent>
        
        <TabsContent value="discussion" className="mt-6">
          <MatchDiscussionGroups matchId={matchId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}