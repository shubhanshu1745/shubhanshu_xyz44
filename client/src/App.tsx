import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import MatchesPage from "@/pages/matches-page";
import MatchDetailsPage from "@/pages/match-details-page";
import TeamsPage from "@/pages/teams-page";
import ChatPage from "@/pages/chat-page";
import ReelsPage from "@/pages/reels-page";
import PlayerStatsPage from "@/pages/player-stats-page";
import StatsPage from "@/pages/stats-page-simplified";
import LiveScoring from "@/pages/live-scoring";
import LiveScoringEnhanced from "@/pages/live-scoring-enhanced";
import LiveScoringAdvanced from "@/pages/live-scoring-advanced";
import SuggestionsPage from "@/pages/suggestions-page";
import SettingsPage from "@/pages/settings-page";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import TournamentManager from "@/pages/tournament-manager";
import CricketCoaching from "@/pages/cricket-coaching";
import MatchHighlights from "@/pages/match-highlights";
import StoryFilters from "@/pages/story-filters";
import VenueDiscovery from "@/pages/venue-discovery";
import PollsPage from "@/pages/polls";
import { ProtectedRoute } from "./lib/protected-route";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { SocketProvider } from "./hooks/use-socket";
import { ThemeProvider } from "./hooks/use-theme";
import { UserProvider } from "./hooks/use-user";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile/:username" component={ProfilePage} />
      <ProtectedRoute path="/matches" component={MatchesPage} />
      <ProtectedRoute path="/matches/:id" component={MatchDetailsPage} />
      <ProtectedRoute path="/teams" component={TeamsPage} />
      <ProtectedRoute path="/reels" component={ReelsPage} />
      <ProtectedRoute path="/stats" component={StatsPage} />
      <ProtectedRoute path="/player-stats/:username" component={PlayerStatsPage} />
      <ProtectedRoute path="/suggestions" component={SuggestionsPage} />
      <ProtectedRoute path="/scoring" component={LiveScoring} />
      <ProtectedRoute path="/scoring/:matchId" component={LiveScoring} />
      <ProtectedRoute path="/enhanced-scoring" component={LiveScoringEnhanced} />
      <ProtectedRoute path="/enhanced-scoring/:matchId" component={LiveScoringEnhanced} />
      <ProtectedRoute path="/advanced-scoring" component={LiveScoringAdvanced} />
      <ProtectedRoute path="/advanced-scoring/:matchId" component={LiveScoringAdvanced} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboard} />
      <ProtectedRoute path="/tournaments" component={TournamentManager} />
      <ProtectedRoute path="/coaching" component={CricketCoaching} />
      <ProtectedRoute path="/highlights" component={MatchHighlights} />
      <ProtectedRoute path="/story-filters" component={StoryFilters} />
      <ProtectedRoute path="/venues" component={VenueDiscovery} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/chat/:id" component={ChatPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <SocketProvider>
            <Router />
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
