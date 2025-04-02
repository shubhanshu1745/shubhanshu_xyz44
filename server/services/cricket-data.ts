import { z } from "zod";

// Match Schema
export const matchSchema = z.object({
  id: z.string(),
  title: z.string(),
  teams: z.object({
    team1: z.object({
      name: z.string(),
      logo: z.string(),
      score: z.string().optional()
    }),
    team2: z.object({
      name: z.string(),
      logo: z.string(),
      score: z.string().optional()
    })
  }),
  status: z.enum(["upcoming", "live", "completed"]),
  result: z.string().optional(),
  date: z.string(),
  time: z.string(),
  venue: z.string(),
  type: z.string(),
  imageUrl: z.string().optional()
});

export type Match = z.infer<typeof matchSchema>;

// Team Schema
export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  logo: z.string(),
  country: z.string(),
  type: z.enum(["international", "franchise", "domestic"]),
  founded: z.string(),
  homeGround: z.string(),
  captain: z.string(),
  coach: z.string(),
  achievements: z.array(z.string()),
  players: z.array(z.string()),
  ranking: z.object({
    test: z.number().optional(),
    odi: z.number().optional(),
    t20: z.number().optional()
  }).optional(),
  recentForm: z.string()
});

export type Team = z.infer<typeof teamSchema>;

// Match Data
const matchesData: Match[] = [
  {
    id: "m1",
    title: "T20 World Cup 2023",
    teams: {
      team1: { 
        name: "India", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png",
        score: "184/6" 
      },
      team2: { 
        name: "Australia", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/1200px-Flag_of_Australia_%28converted%29.svg.png",
        score: "185/4" 
      }
    },
    status: "completed",
    result: "Australia won by 6 wickets",
    date: "2023-06-15",
    time: "19:00",
    venue: "Melbourne Cricket Ground",
    type: "T20I",
    imageUrl: "https://resources.pulse.icc-cricket.com/ICC/photo/2023/11/19/1c246730-8321-465a-b390-1118ac859254/Travis-Head.png"
  },
  {
    id: "m2",
    title: "IPL 2023",
    teams: {
      team1: { 
        name: "RCB", 
        logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/logos/Roundbig/RCBroundbig.png"
      },
      team2: { 
        name: "CSK", 
        logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png" 
      }
    },
    status: "upcoming",
    date: "2023-06-20",
    time: "19:30",
    venue: "M. Chinnaswamy Stadium, Bangalore",
    type: "T20"
  },
  {
    id: "m3",
    title: "India vs England Test Series",
    teams: {
      team1: { 
        name: "India", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png",
        score: "245/3" 
      },
      team2: { 
        name: "England", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/1200px-Flag_of_England.svg.png",
        score: "467" 
      }
    },
    status: "live",
    date: "2023-06-18",
    time: "10:00",
    venue: "Lord's Cricket Ground, London",
    type: "Test"
  },
  {
    id: "m4",
    title: "The Ashes 2023",
    teams: {
      team1: { 
        name: "England", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/1200px-Flag_of_England.svg.png",
        score: "325/7" 
      },
      team2: { 
        name: "Australia", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/1200px-Flag_of_Australia_%28converted%29.svg.png",
        score: "295" 
      }
    },
    status: "live",
    date: "2023-07-14",
    time: "11:00",
    venue: "Edgbaston, Birmingham",
    type: "Test"
  },
  {
    id: "m5",
    title: "Pakistan vs New Zealand ODI",
    teams: {
      team1: { 
        name: "Pakistan", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Pakistan.svg/1200px-Flag_of_Pakistan.svg.png",
        score: "289/8" 
      },
      team2: { 
        name: "New Zealand", 
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Flag_of_New_Zealand.svg/1200px-Flag_of_New_Zealand.svg.png",
        score: "241/10" 
      }
    },
    status: "completed",
    result: "Pakistan won by 48 runs",
    date: "2023-06-10",
    time: "14:30",
    venue: "National Stadium, Karachi",
    type: "ODI"
  }
];

// Team Data
const teamsData: Team[] = [
  {
    id: "t1",
    name: "India",
    fullName: "Indian Cricket Team",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png",
    country: "India",
    type: "international",
    founded: "1932",
    homeGround: "Multiple venues across India",
    captain: "Rohit Sharma",
    coach: "Rahul Dravid",
    achievements: ["T20 World Cup (2007)", "Cricket World Cup (1983, 2011)", "ICC Champions Trophy (2013)"],
    players: ["Rohit Sharma", "Virat Kohli", "Jasprit Bumrah", "Ravindra Jadeja", "KL Rahul"],
    ranking: {
      test: 1,
      odi: 2,
      t20: 1
    },
    recentForm: "W-W"
  },
  {
    id: "t2",
    name: "Australia",
    fullName: "Australian Cricket Team",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Flag_of_Australia_%28converted%29.svg/1200px-Flag_of_Australia_%28converted%29.svg.png",
    country: "Australia",
    type: "international",
    founded: "1877",
    homeGround: "Melbourne Cricket Ground",
    captain: "Pat Cummins",
    coach: "Andrew McDonald",
    achievements: ["Cricket World Cup (1987, 1999, 2003, 2007, 2015, 2023)", "ICC Champions Trophy (2006, 2009)"],
    players: ["Pat Cummins", "Steve Smith", "Mitchell Starc", "Josh Hazlewood", "David Warner"],
    ranking: {
      test: 2,
      odi: 1,
      t20: 3
    },
    recentForm: "W"
  },
  {
    id: "t3",
    name: "CSK",
    fullName: "Chennai Super Kings",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png",
    country: "India",
    type: "franchise",
    founded: "2008",
    homeGround: "M. A. Chidambaram Stadium, Chennai",
    captain: "MS Dhoni",
    coach: "Stephen Fleming",
    achievements: ["IPL Champions (2010, 2011, 2018, 2021, 2023)", "Champions League T20 (2010, 2014)"],
    players: ["MS Dhoni", "Ravindra Jadeja", "Ruturaj Gaikwad", "Devon Conway", "Deepak Chahar"],
    recentForm: "W"
  },
  {
    id: "t4",
    name: "England",
    fullName: "England Cricket Team",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Flag_of_England.svg/1200px-Flag_of_England.svg.png",
    country: "England",
    type: "international",
    founded: "1877",
    homeGround: "Lord's Cricket Ground",
    captain: "Jos Buttler",
    coach: "Brendon McCullum",
    achievements: ["Cricket World Cup (2019)", "T20 World Cup (2022)"],
    players: ["Jos Buttler", "Joe Root", "Ben Stokes", "James Anderson", "Jonny Bairstow"],
    ranking: {
      test: 3,
      odi: 3,
      t20: 2
    },
    recentForm: "L-W"
  },
  {
    id: "t5",
    name: "RCB",
    fullName: "Royal Challengers Bangalore",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/logos/Roundbig/RCBroundbig.png",
    country: "India",
    type: "franchise",
    founded: "2008",
    homeGround: "M. Chinnaswamy Stadium, Bangalore",
    captain: "Faf du Plessis",
    coach: "Andy Flower",
    achievements: ["IPL Runners-up (2009, 2011, 2016)"],
    players: ["Virat Kohli", "Faf du Plessis", "Glenn Maxwell", "Mohammed Siraj", "Dinesh Karthik"],
    recentForm: "L"
  },
  {
    id: "t6",
    name: "Pakistan",
    fullName: "Pakistan Cricket Team",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Pakistan.svg/1200px-Flag_of_Pakistan.svg.png",
    country: "Pakistan",
    type: "international",
    founded: "1952",
    homeGround: "Gaddafi Stadium, Lahore",
    captain: "Babar Azam",
    coach: "Gary Kirsten",
    achievements: ["Cricket World Cup (1992)", "T20 World Cup (2009)", "ICC Champions Trophy (2017)"],
    players: ["Babar Azam", "Mohammad Rizwan", "Shaheen Afridi", "Shadab Khan", "Fakhar Zaman"],
    ranking: {
      test: 6,
      odi: 5,
      t20: 4
    },
    recentForm: "L-L"
  }
];

const CRICKET_API_BASE = 'https://api.cricketdata.org/v1';
const API_KEY = process.env.CRICKET_API_KEY || 'free_tier_key';

// Service Functions
export const CricketDataService = {
  // Matches
  getAllMatches: async (): Promise<Match[]> => {
    try {
      const response = await fetch(`${CRICKET_API_BASE}/matches?apikey=${API_KEY}`);
      const data = await response.json();
      
      // Transform API data to match our schema
      return data.matches.map((match: any) => ({
        id: match.matchId.toString(),
        title: match.seriesName,
        teams: {
          team1: { 
            name: match.team1.name,
            logo: match.team1.logoUrl || '',
            score: match.team1.score
          },
          team2: { 
            name: match.team2.name,
            logo: match.team2.logoUrl || '',
            score: match.team2.score
          }
        },
        status: match.status.toLowerCase(),
        result: match.result || undefined,
        date: match.startDate,
        time: match.startTime,
        venue: match.venue,
        type: match.matchType,
      }));
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      return matchesData; // Fallback to local data if API fails
    }
  },
  
  getMatchById: (id: string): Match | undefined => {
    return matchesData.find(match => match.id === id);
  },
  
  getMatchesByStatus: (status: Match["status"]): Match[] => {
    return matchesData.filter(match => match.status === status);
  },
  
  getRecentMatches: (limit: number = 3): Match[] => {
    return [...matchesData]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },
  
  // Teams
  getAllTeams: (): Team[] => {
    return teamsData;
  },
  
  getTeamById: (id: string): Team | undefined => {
    return teamsData.find(team => team.id === id);
  },
  
  getTeamsByType: (type: Team["type"]): Team[] => {
    return teamsData.filter(team => team.type === type);
  },
  
  searchTeams: (query: string): Team[] => {
    const searchLower = query.toLowerCase();
    return teamsData.filter(team => 
      team.name.toLowerCase().includes(searchLower) || 
      team.fullName.toLowerCase().includes(searchLower) ||
      team.country.toLowerCase().includes(searchLower)
    );
  }
};