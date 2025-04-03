// IPL 2023 Teams data
export const ipl2023Teams = [
  {
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Roundbig/CSKroundbig.png",
    primaryColor: "#FFFF00",
    secondaryColor: "#0081E7"
  },
  {
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/Logos/Roundbig/MIroundbig.png",
    primaryColor: "#004BA0",
    secondaryColor: "#D1AB3E"
  },
  {
    name: "Royal Challengers Bangalore",
    shortName: "RCB",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/Logos/Roundbig/RCBroundbig.png",
    primaryColor: "#EC1C24",
    secondaryColor: "#000000"
  },
  {
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/Logos/Roundbig/KKRroundbig.png",
    primaryColor: "#3A225D",
    secondaryColor: "#F2C94C"
  },
  {
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/DC/Logos/Roundbig/DCroundbig.png",
    primaryColor: "#0078BC",
    secondaryColor: "#EF1C25"
  },
  {
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/PBKS/Logos/Roundbig/PBKSroundbig.png",
    primaryColor: "#ED1B24",
    secondaryColor: "#DCDDDF"
  },
  {
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RR/Logos/Roundbig/RRroundbig.png",
    primaryColor: "#EA1A85",
    secondaryColor: "#004BA0"
  },
  {
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/SRH/Logos/Roundbig/SRHroundbig.png",
    primaryColor: "#F26522",
    secondaryColor: "#000000"
  },
  {
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/GT/Logos/Roundbig/GTroundbig.png",
    primaryColor: "#1C1C1C",
    secondaryColor: "#0B4973"
  },
  {
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/LSG/Logos/Roundbig/LSGroundbig.png",
    primaryColor: "#A72056",
    secondaryColor: "#FFCC00"
  }
];

// IPL 2023 Venues
export const ipl2023Venues = [
  {
    name: "M. A. Chidambaram Stadium",
    city: "Chennai",
    country: "India",
    capacity: 50000,
    attributes: ["Spin-friendly", "Slow track", "Home to Chennai Super Kings"]
  },
  {
    name: "Wankhede Stadium",
    city: "Mumbai",
    country: "India",
    capacity: 33108,
    attributes: ["Good batting track", "Swing early on", "Home to Mumbai Indians"]
  },
  {
    name: "Eden Gardens",
    city: "Kolkata",
    country: "India",
    capacity: 68000,
    attributes: ["Historic venue", "Good pace and bounce", "Home to Kolkata Knight Riders"]
  },
  {
    name: "Arun Jaitley Stadium",
    city: "Delhi",
    country: "India",
    capacity: 41820,
    attributes: ["Batting-friendly", "Good for power hitters", "Home to Delhi Capitals"]
  },
  {
    name: "M. Chinnaswamy Stadium", 
    city: "Bengaluru",
    country: "India",
    capacity: 40000,
    attributes: ["Batting paradise", "High scoring", "Home to Royal Challengers Bangalore"]
  },
  {
    name: "Narendra Modi Stadium",
    city: "Ahmedabad",
    country: "India",
    capacity: 132000,
    attributes: ["Largest cricket stadium", "New venue", "Home to Gujarat Titans"]
  },
  {
    name: "Rajiv Gandhi International Stadium",
    city: "Hyderabad",
    country: "India",
    capacity: 39000,
    attributes: ["Balanced pitch", "Good for batsmen", "Home to Sunrisers Hyderabad"]
  },
  {
    name: "Sawai Mansingh Stadium",
    city: "Jaipur",
    country: "India",
    capacity: 30000,
    attributes: ["Batting-friendly", "Good outfield", "Home to Rajasthan Royals"]
  },
  {
    name: "Punjab Cricket Association Stadium",
    city: "Mohali",
    country: "India",
    capacity: 26000,
    attributes: ["Good pace and bounce", "Helpful for fast bowlers", "Home to Punjab Kings"]
  },
  {
    name: "BRSABV Ekana Cricket Stadium",
    city: "Lucknow",
    country: "India",
    capacity: 50000,
    attributes: ["Modern facilities", "New venue", "Home to Lucknow Super Giants"]
  }
];

// IPL 2023 Standings Data
export const ipl2023StandingsData = [
  {
    teamId: 1, // This will be mapped to Chennai Super Kings in the preloadIPL2023Tournament function
    position: 1,
    matches: 14,
    won: 8,
    lost: 5,
    tied: 0,
    noResult: 1,
    points: 17,
    nrr: 0.381
  },
  {
    teamId: 9, // Gujarat Titans
    position: 2,
    matches: 14,
    won: 8,
    lost: 6,
    tied: 0,
    noResult: 0,
    points: 16,
    nrr: 0.809
  },
  {
    teamId: 10, // Lucknow Super Giants
    position: 3,
    matches: 14,
    won: 7,
    lost: 7,
    tied: 0,
    noResult: 0,
    points: 15,
    nrr: 0.384
  },
  {
    teamId: 2, // Mumbai Indians
    position: 4,
    matches: 14,
    won: 8,
    lost: 6,
    tied: 0,
    noResult: 0,
    points: 16,
    nrr: -0.044
  },
  {
    teamId: 7, // Rajasthan Royals
    position: 5,
    matches: 14,
    won: 7,
    lost: 7,
    tied: 0,
    noResult: 0,
    points: 14,
    nrr: 0.148
  },
  {
    teamId: 3, // Royal Challengers Bangalore
    position: 6,
    matches: 14,
    won: 7,
    lost: 7,
    tied: 0,
    noResult: 0,
    points: 14,
    nrr: -0.225
  },
  {
    teamId: 4, // Kolkata Knight Riders
    position: 7,
    matches: 14,
    won: 6,
    lost: 8,
    tied: 0,
    noResult: 0,
    points: 12,
    nrr: 0.147
  },
  {
    teamId: 6, // Punjab Kings
    position: 8,
    matches: 14,
    won: 6,
    lost: 8,
    tied: 0,
    noResult: 0,
    points: 12,
    nrr: -0.304
  },
  {
    teamId: 5, // Delhi Capitals
    position: 9,
    matches: 14,
    won: 5,
    lost: 9,
    tied: 0,
    noResult: 0,
    points: 10,
    nrr: -0.605
  },
  {
    teamId: 8, // Sunrisers Hyderabad
    position: 10,
    matches: 14,
    won: 4,
    lost: 10,
    tied: 0,
    noResult: 0,
    points: 8,
    nrr: -0.590
  }
];

// IPL 2023 Top Performers Data
export const ipl2023TopPerformers = {
  battingStats: [
    {
      playerId: 101, // Note: These are placeholder IDs
      name: "Shubman Gill",
      teamId: 9, // Gujarat Titans
      matches: 16,
      runs: 890,
      average: 59.33,
      strikeRate: 157.80,
      fifties: 4,
      hundreds: 3
    },
    {
      playerId: 102,
      name: "Faf du Plessis",
      teamId: 3, // Royal Challengers Bangalore
      matches: 14,
      runs: 730,
      average: 56.15,
      strikeRate: 153.68,
      fifties: 8,
      hundreds: 0
    },
    {
      playerId: 103,
      name: "Virat Kohli",
      teamId: 3, // Royal Challengers Bangalore
      matches: 14,
      runs: 639,
      average: 53.25,
      strikeRate: 139.82,
      fifties: 2,
      hundreds: 2
    },
    {
      playerId: 104,
      name: "Devon Conway",
      teamId: 1, // Chennai Super Kings
      matches: 15,
      runs: 624,
      average: 44.57,
      strikeRate: 142.21,
      fifties: 6,
      hundreds: 0
    },
    {
      playerId: 105,
      name: "Yashasvi Jaiswal",
      teamId: 7, // Rajasthan Royals
      matches: 14,
      runs: 625,
      average: 48.08,
      strikeRate: 163.61,
      fifties: 5,
      hundreds: 1
    }
  ],
  bowlingStats: [
    {
      playerId: 201,
      name: "Mohammed Shami",
      teamId: 9, // Gujarat Titans
      matches: 17,
      wickets: 28,
      economy: 8.03,
      average: 18.64,
      bestBowling: "4/11"
    },
    {
      playerId: 202,
      name: "Rashid Khan",
      teamId: 9, // Gujarat Titans
      matches: 17,
      wickets: 27,
      economy: 8.23,
      average: 20.81,
      bestBowling: "4/30"
    },
    {
      playerId: 203,
      name: "Tushar Deshpande",
      teamId: 1, // Chennai Super Kings
      matches: 16,
      wickets: 21,
      economy: 9.92,
      average: 26.76,
      bestBowling: "3/45"
    },
    {
      playerId: 204,
      name: "Piyush Chawla",
      teamId: 2, // Mumbai Indians
      matches: 16,
      wickets: 22,
      economy: 8.11,
      average: 22.50,
      bestBowling: "3/22"
    },
    {
      playerId: 205,
      name: "Varun Chakaravarthy",
      teamId: 4, // Kolkata Knight Riders
      matches: 14,
      wickets: 20,
      economy: 8.15,
      average: 21.05,
      bestBowling: "4/15"
    }
  ]
};