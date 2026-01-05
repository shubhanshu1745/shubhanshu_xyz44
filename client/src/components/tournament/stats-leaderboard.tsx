import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, Award, Zap } from "lucide-react";

interface Player {
  id: number;
  username: string;
  fullName?: string;
  profileImage?: string;
}

interface PlayerStat {
  userId: number;
  user?: Player;
  runs?: number;
  wickets?: number;
  matches?: number;
  average?: string;
  strikeRate?: string;
  economyRate?: string;
  catches?: number;
  rank?: number;
}

interface SummaryStats {
  orangeCap?: {
    player?: Player;
    runs: number;
    matches: number;
    average?: string;
    strikeRate?: string;
  };
  purpleCap?: {
    player?: Player;
    wickets: number;
    matches: number;
    economy?: string;
  };
  mvp?: {
    player?: Player;
    score: number;
    runs: number;
    wickets: number;
    catches: number;
  };
}

interface StatsLeaderboardProps {
  tournamentId: number;
}

export function StatsLeaderboard({ tournamentId }: StatsLeaderboardProps) {
  const { data: summaryStats, isLoading } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/summary-stats`],
    queryFn: async () => {
      return await apiRequest('GET', `/api/tournaments/${tournamentId}/summary-stats`);
    },
    enabled: !!tournamentId
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  const stats = summaryStats as SummaryStats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Orange Cap - Most Runs */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <div className="p-2 bg-orange-500 rounded-full">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            Orange Cap
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.orangeCap?.player ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {stats.orangeCap.player.profileImage ? (
                  <img 
                    src={stats.orangeCap.player.profileImage} 
                    alt={stats.orangeCap.player.fullName || stats.orangeCap.player.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-orange-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center text-lg font-bold text-orange-700 dark:text-orange-300">
                    {(stats.orangeCap.player.fullName || stats.orangeCap.player.username)?.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-orange-900 dark:text-orange-100">
                    {stats.orangeCap.player.fullName || stats.orangeCap.player.username}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    {stats.orangeCap.matches} matches
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {stats.orangeCap.runs}
                </span>
                <span className="text-orange-600 dark:text-orange-400">runs</span>
              </div>
              <div className="flex gap-4 text-sm text-orange-600 dark:text-orange-400">
                {stats.orangeCap.average && (
                  <span>Avg: {parseFloat(stats.orangeCap.average).toFixed(2)}</span>
                )}
                {stats.orangeCap.strikeRate && (
                  <span>SR: {parseFloat(stats.orangeCap.strikeRate).toFixed(2)}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-orange-600 dark:text-orange-400">
              No data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purple Cap - Most Wickets */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <div className="p-2 bg-purple-500 rounded-full">
              <Target className="h-4 w-4 text-white" />
            </div>
            Purple Cap
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.purpleCap?.player ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {stats.purpleCap.player.profileImage ? (
                  <img 
                    src={stats.purpleCap.player.profileImage} 
                    alt={stats.purpleCap.player.fullName || stats.purpleCap.player.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-lg font-bold text-purple-700 dark:text-purple-300">
                    {(stats.purpleCap.player.fullName || stats.purpleCap.player.username)?.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-purple-900 dark:text-purple-100">
                    {stats.purpleCap.player.fullName || stats.purpleCap.player.username}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    {stats.purpleCap.matches} matches
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {stats.purpleCap.wickets}
                </span>
                <span className="text-purple-600 dark:text-purple-400">wickets</span>
              </div>
              {stats.purpleCap.economy && (
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  Economy: {parseFloat(stats.purpleCap.economy).toFixed(2)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-purple-600 dark:text-purple-400">
              No data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* MVP */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <div className="p-2 bg-yellow-500 rounded-full">
              <Award className="h-4 w-4 text-white" />
            </div>
            MVP
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.mvp?.player ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {stats.mvp.player.profileImage ? (
                  <img 
                    src={stats.mvp.player.profileImage} 
                    alt={stats.mvp.player.fullName || stats.mvp.player.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-lg font-bold text-yellow-700 dark:text-yellow-300">
                    {(stats.mvp.player.fullName || stats.mvp.player.username)?.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                    {stats.mvp.player.fullName || stats.mvp.player.username}
                  </div>
                  <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-300">
                    <Zap className="h-3 w-3 mr-1" />
                    {stats.mvp.score} pts
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-2">
                  <div className="font-bold text-yellow-800 dark:text-yellow-200">{stats.mvp.runs}</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">Runs</div>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-2">
                  <div className="font-bold text-yellow-800 dark:text-yellow-200">{stats.mvp.wickets}</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">Wickets</div>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-2">
                  <div className="font-bold text-yellow-800 dark:text-yellow-200">{stats.mvp.catches}</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">Catches</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-yellow-600 dark:text-yellow-400">
              No data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StatsLeaderboard;
