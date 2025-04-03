/**
 * IPL 2023 Teams Data
 * This file contains data for the 10 teams that participated in IPL 2023
 */

export const ipl2023Teams = [
  {
    id: 1,
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "/assets/teams/csk.png",
    primaryColor: "#FFFF00", // Yellow
    secondaryColor: "#0081E9", // Blue
    captain: "MS Dhoni",
    homeVenue: "M.A. Chidambaram Stadium, Chennai",
    championships: [2010, 2011, 2018, 2021, 2023]
  },
  {
    id: 2,
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "/assets/teams/mi.png",
    primaryColor: "#004BA0", // Blue
    secondaryColor: "#D1AB3E", // Gold
    captain: "Rohit Sharma",
    homeVenue: "Wankhede Stadium, Mumbai",
    championships: [2013, 2015, 2017, 2019, 2020]
  },
  {
    id: 3,
    name: "Royal Challengers Bangalore",
    shortName: "RCB",
    logo: "/assets/teams/rcb.png",
    primaryColor: "#EC1C24", // Red
    secondaryColor: "#000000", // Black
    captain: "Faf du Plessis",
    homeVenue: "M. Chinnaswamy Stadium, Bangalore",
    championships: []
  },
  {
    id: 4, 
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "/assets/teams/kkr.png",
    primaryColor: "#3A225D", // Purple
    secondaryColor: "#FDB61D", // Gold
    captain: "Shreyas Iyer",
    homeVenue: "Eden Gardens, Kolkata",
    championships: [2012, 2014]
  },
  {
    id: 5,
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "/assets/teams/rr.png",
    primaryColor: "#EA1A85", // Pink
    secondaryColor: "#254AA5", // Blue
    captain: "Sanju Samson",
    homeVenue: "Sawai Mansingh Stadium, Jaipur",
    championships: [2008]
  },
  {
    id: 6,
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "/assets/teams/dc.png",
    primaryColor: "#0078BC", // Blue
    secondaryColor: "#EF1C25", // Red
    captain: "David Warner",
    homeVenue: "Arun Jaitley Stadium, Delhi",
    championships: []
  },
  {
    id: 7,
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "/assets/teams/pbks.png",
    primaryColor: "#ED1B24", // Red
    secondaryColor: "#DCDDDF", // Silver
    captain: "Shikhar Dhawan",
    homeVenue: "PCA Stadium, Mohali",
    championships: []
  },
  {
    id: 8,
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "/assets/teams/srh.png",
    primaryColor: "#F26522", // Orange
    secondaryColor: "#000000", // Black
    captain: "Aiden Markram",
    homeVenue: "Rajiv Gandhi Intl. Cricket Stadium, Hyderabad",
    championships: [2016]
  },
  {
    id: 9,
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "/assets/teams/gt.png",
    primaryColor: "#1C1C1C", // Dark Grey
    secondaryColor: "#0093DD", // Blue
    captain: "Hardik Pandya",
    homeVenue: "Narendra Modi Stadium, Ahmedabad",
    championships: [2022]
  },
  {
    id: 10,
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "/assets/teams/lsg.png",
    primaryColor: "#A1CCA5", // Light Teal
    secondaryColor: "#4A90E2", // Blue
    captain: "KL Rahul",
    homeVenue: "BRSABV Ekana Cricket Stadium, Lucknow",
    championships: []
  }
];

export const ipl2023Venues = [
  {
    id: 1,
    name: "M.A. Chidambaram Stadium",
    city: "Chennai",
    country: "India", 
    capacity: 50000,
    attributes: ["Spinner-friendly", "Slow track"]
  },
  {
    id: 2, 
    name: "Wankhede Stadium",
    city: "Mumbai",
    country: "India",
    capacity: 33108,
    attributes: ["Good batting track", "Helps seam bowlers"]
  },
  {
    id: 3,
    name: "M. Chinnaswamy Stadium",
    city: "Bangalore",
    country: "India",
    capacity: 40000,
    attributes: ["Batting paradise", "Small boundaries", "High-scoring"]
  },
  {
    id: 4,
    name: "Eden Gardens",
    city: "Kolkata",
    country: "India",
    capacity: 68000,
    attributes: ["Assists spinners", "Balanced track"]
  },
  {
    id: 5,
    name: "Sawai Mansingh Stadium",
    city: "Jaipur",
    country: "India",
    capacity: 30000,
    attributes: ["Balanced wicket", "Good for batting"]
  },
  {
    id: 6,
    name: "Arun Jaitley Stadium",
    city: "Delhi",
    country: "India",
    capacity: 41000,
    attributes: ["Batting-friendly", "Slow track"]
  },
  {
    id: 7,
    name: "PCA Stadium",
    city: "Mohali",
    country: "India",
    capacity: 26000,
    attributes: ["Good bounce", "Assists fast bowlers"]
  },
  {
    id: 8,
    name: "Rajiv Gandhi International Cricket Stadium",
    city: "Hyderabad",
    country: "India",
    capacity: 39000,
    attributes: ["Balanced track", "Good for batting"]
  },
  {
    id: 9,
    name: "Narendra Modi Stadium",
    city: "Ahmedabad",
    country: "India",
    capacity: 132000,
    attributes: ["Largest cricket stadium", "Good batting surface"]
  },
  {
    id: 10,
    name: "BRSABV Ekana Cricket Stadium",
    city: "Lucknow",
    country: "India",
    capacity: 50000,
    attributes: ["Slow pitch", "Assists spinners"]
  }
];

export const ipl2023StandingsData = [
  { teamId: 1, position: 1, matches: 14, won: 8, lost: 5, tied: 0, noResult: 1, points: 17, nrr: 0.652 }, // CSK - Champions
  { teamId: 9, position: 2, matches: 14, won: 7, lost: 5, tied: 0, noResult: 2, points: 16, nrr: 0.809 }, // GT
  { teamId: 10, position: 3, matches: 14, won: 7, lost: 5, tied: 0, noResult: 2, points: 16, nrr: 0.284 }, // LSG
  { teamId: 4, position: 4, matches: 14, won: 6, lost: 7, tied: 0, noResult: 1, points: 13, nrr: 0.256 }, // KKR
  { teamId: 3, position: 5, matches: 14, won: 6, lost: 7, tied: 0, noResult: 1, points: 13, nrr: 0.166 }, // RCB
  { teamId: 2, position: 6, matches: 14, won: 5, lost: 8, tied: 0, noResult: 1, points: 11, nrr: -0.146 }, // MI 
  { teamId: 5, position: 7, matches: 14, won: 5, lost: 8, tied: 0, noResult: 1, points: 11, nrr: -0.298 }, // RR
  { teamId: 7, position: 8, matches: 14, won: 5, lost: 9, tied: 0, noResult: 0, points: 10, nrr: -0.304 }, // PBKS
  { teamId: 6, position: 9, matches: 14, won: 5, lost: 9, tied: 0, noResult: 0, points: 10, nrr: -0.521 }, // DC
  { teamId: 8, position: 10, matches: 14, won: 4, lost: 9, tied: 0, noResult: 1, points: 9, nrr: -0.590 } // SRH
];

// IPL 2023 Top Performers
export const ipl2023TopPerformers = {
  battingStats: [
    { playerId: 101, playerName: "Shubman Gill", teamId: 9, matches: 17, runs: 890, average: 59.33, strikeRate: 157.80, fifties: 4, hundreds: 3 },
    { playerId: 102, playerName: "Faf du Plessis", teamId: 3, matches: 14, runs: 730, average: 56.15, strikeRate: 153.68, fifties: 8, hundreds: 0 },
    { playerId: 103, playerName: "Devon Conway", teamId: 1, matches: 16, runs: 672, average: 51.69, strikeRate: 139.70, fifties: 6, hundreds: 0 },
    { playerId: 104, playerName: "Virat Kohli", teamId: 3, matches: 14, runs: 639, average: 53.25, strikeRate: 139.25, fifties: 6, hundreds: 2 },
    { playerId: 105, playerName: "Yashasvi Jaiswal", teamId: 5, matches: 14, runs: 625, average: 48.08, strikeRate: 163.61, fifties: 5, hundreds: 1 }
  ],
  bowlingStats: [
    { playerId: 201, playerName: "Mohammed Shami", teamId: 9, matches: 17, wickets: 28, economy: 8.03, average: 18.64, bestBowling: "4/11" },
    { playerId: 202, playerName: "Tushar Deshpande", teamId: 1, matches: 16, wickets: 21, economy: 9.92, average: 26.52, bestBowling: "3/45" },
    { playerId: 203, playerName: "Piyush Chawla", teamId: 2, matches: 16, wickets: 22, economy: 8.11, average: 24.36, bestBowling: "3/22" },
    { playerId: 204, playerName: "Rashid Khan", teamId: 9, matches: 17, wickets: 27, economy: 8.24, average: 20.85, bestBowling: "4/30" },
    { playerId: 205, playerName: "Varun Chakravarthy", teamId: 4, matches: 14, wickets: 20, economy: 8.09, average: 21.55, bestBowling: "4/15" }
  ]
};

// IPL 2023 Playoff Matches
export const ipl2023PlayoffMatches = [
  {
    id: 101,
    type: "Qualifier 1",
    team1Id: 9, // GT
    team2Id: 1, // CSK
    winner: 1, // CSK
    venue: 1, // MA Chidambaram Stadium
    date: "2023-05-23",
    team1Score: "172/7",
    team2Score: "173/3",
    result: "CSK won by 15 runs"
  },
  {
    id: 102,
    type: "Eliminator",
    team1Id: 10, // LSG
    team2Id: 2, // MI
    winner: 2, // MI
    venue: 2, // Wankhede Stadium
    date: "2023-05-24",
    team1Score: "182/8",
    team2Score: "185/5",
    result: "MI won by 5 wickets"
  },
  {
    id: 103,
    type: "Qualifier 2",
    team1Id: 9, // GT
    team2Id: 2, // MI
    winner: 9, // GT
    venue: 9, // Narendra Modi Stadium
    date: "2023-05-26",
    team1Score: "233/3",
    team2Score: "171/10",
    result: "GT won by 62 runs"
  },
  {
    id: 104,
    type: "Final",
    team1Id: 1, // CSK
    team2Id: 9, // GT
    winner: 1, // CSK
    venue: 9, // Narendra Modi Stadium
    date: "2023-05-29",
    team1Score: "240/8",
    team2Score: "214/4",
    result: "CSK won by 5 wickets (DLS)"
  }
];