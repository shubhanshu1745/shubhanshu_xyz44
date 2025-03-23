
import { format } from 'date-fns';

interface Team {
  name: string;
  score?: string;
}

interface Match {
  id: string;
  title?: string;
  date?: string;
  venue?: string;
  result?: string;
  status?: string;
  teams?: {
    team1: Team;
    team2: Team;
  };
}

interface MatchHistoryProps {
  matches: Match[];
}

export function MatchHistory({ matches = [] }: MatchHistoryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Match History</h2>
      {matches.map((match) => (
        <div key={match.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{match.title || 'Cricket Match'}</h3>
            <span className={`px-2 py-1 rounded text-sm ${
              match.result?.includes('won') ? 'bg-green-100 text-green-800' :
              match.result?.includes('lost') ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {match.result || match.status || 'Pending'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">
                {match.date ? format(new Date(match.date), 'PPP') : 'Date not available'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Venue</p>
              <p className="font-medium">{match.venue || 'Venue not specified'}</p>
            </div>
            {match.teams && (
              <>
                <div>
                  <p className="text-sm text-gray-600">{match.teams.team1?.name || 'Team 1'}</p>
                  <p className="font-medium">{match.teams.team1?.score || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{match.teams.team2?.name || 'Team 2'}</p>
                  <p className="font-medium">{match.teams.team2?.score || '-'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
