
export interface CricketMatch {
  id: string;
  title: string;
  date: string;
  venue: string;
  result: string;
  teams: {
    team1: { name: string; score?: string };
    team2: { name: string; score?: string };
  };
  status: 'upcoming' | 'live' | 'completed';
}

export interface Cricket {
  Match: CricketMatch;
}
