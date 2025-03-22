import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import MatchesPage from "@/pages/matches-page";
import TeamsPage from "@/pages/teams-page";
import ChatPage from "@/pages/chat-page";
import ReelsPage from "@/pages/reels-page";
import PlayerStatsPage from "@/pages/player-stats-page";
import { ProtectedRoute } from "./lib/protected-route";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { SocketProvider } from "./hooks/use-socket";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile/:username" component={ProfilePage} />
      <ProtectedRoute path="/matches" component={MatchesPage} />
      <ProtectedRoute path="/teams" component={TeamsPage} />
      <ProtectedRoute path="/reels" component={ReelsPage} />
      <ProtectedRoute path="/player-stats/:username" component={PlayerStatsPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/chat/:id" component={ChatPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router />
          <Toaster />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
