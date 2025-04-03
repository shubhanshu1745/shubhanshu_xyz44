import { storage } from "./storage";
import { hashPassword } from "./auth";
import { 
  InsertPost, 
  InsertFollow, 
  InsertComment, 
  InsertLike, 
  InsertStory, 
  InsertPlayerStats, 
  InsertPlayerMatch, 
  InsertPlayerMatchPerformance 
} from "@shared/schema";

export async function seedDatabase() {
  console.log("🌱 Seeding database with sample data...");

  // Create demo users
  const demoUser1 = await storage.createUser({
    username: "crickfan",
    email: "crickfan@example.com",
    password: await hashPassword("password123"),
    fullName: "Cricket Fan",
    bio: "Cricket enthusiast | Follow for match updates and highlights",
    location: "Mumbai, India",
    profileImage: "https://i.pravatar.cc/150?img=1",
    isPlayer: false
  });
  
  const demoUser2 = await storage.createUser({
    username: "teamIndia",
    email: "teamIndia@example.com",
    password: await hashPassword("password123"),
    fullName: "Team India Fans",
    bio: "Official fan page for Team India | Cricket news and updates",
    location: "Delhi, India",
    profileImage: "https://i.pravatar.cc/150?img=2",
    isPlayer: false
  });

  const demoUser3 = await storage.createUser({
    username: "cricketLegend",
    email: "legend@example.com",
    password: await hashPassword("password123"),
    fullName: "Cricket Legend",
    bio: "Former international cricket player | Coach | Analyst",
    location: "London, UK",
    profileImage: "https://i.pravatar.cc/150?img=3",
    isPlayer: true
  });
  
  const demoUser4 = await storage.createUser({
    username: "cricNews",
    email: "cricnews@example.com",
    password: await hashPassword("password123"),
    fullName: "Cricket News Network",
    bio: "Breaking cricket news | Live match updates | Player interviews",
    location: "Melbourne, Australia",
    profileImage: "https://i.pravatar.cc/150?img=4",
    isPlayer: false
  });

  const demoUser5 = await storage.createUser({
    username: "playerOne",
    email: "player1@example.com",
    password: await hashPassword("password123"),
    fullName: "Professional Player",
    bio: "Professional cricket player | Batsman | Current national team player",
    location: "Chennai, India",
    profileImage: "https://i.pravatar.cc/150?img=5",
    isPlayer: true
  });

  console.log("👤 Created demo users");

  // Create follow relationships
  const followRelationships: InsertFollow[] = [
    { followerId: demoUser1.id, followingId: demoUser2.id },
    { followerId: demoUser1.id, followingId: demoUser3.id },
    { followerId: demoUser2.id, followingId: demoUser1.id },
    { followerId: demoUser3.id, followingId: demoUser1.id },
    { followerId: demoUser3.id, followingId: demoUser2.id },
    { followerId: demoUser4.id, followingId: demoUser1.id },
    { followerId: demoUser4.id, followingId: demoUser2.id },
    { followerId: demoUser4.id, followingId: demoUser3.id }
  ];
  
  for (const follow of followRelationships) {
    await storage.followUser(follow);
  }

  console.log("👥 Created follow relationships");

  // Create posts
  const posts: InsertPost[] = [
    {
      userId: demoUser1.id,
      content: "What an incredible match between India and Australia! The last over was a nail-biter 🏏",
      category: "match_discussion",
      matchId: "ind-vs-aus-2025",
      teamId: "india",
      imageUrl: "https://picsum.photos/seed/cricket1/640/480"
    },
    {
      userId: demoUser2.id,
      content: "Team India's recent performance has been outstanding. The bowling attack is looking stronger than ever!",
      category: "team_news",
      teamId: "india",
      imageUrl: "https://picsum.photos/seed/cricket2/640/480"
    },
    {
      userId: demoUser3.id,
      content: "Here's my analysis of the recent IPL auction. Some surprising picks this year! What do you think?",
      category: "opinion",
      imageUrl: "https://picsum.photos/seed/cricket3/640/480"
    },
    {
      userId: demoUser4.id,
      content: "BREAKING: England announces squad for the upcoming Test series against New Zealand.",
      category: "team_news",
      teamId: "england",
      imageUrl: "https://picsum.photos/seed/cricket4/640/480"
    },
    {
      userId: demoUser1.id,
      content: "This shot by Virat Kohli is absolutely magnificent! Perfect technique and timing.",
      category: "player_highlight",
      playerId: "virat-kohli",
      teamId: "india",
      imageUrl: "https://picsum.photos/seed/cricket5/640/480"
    },
    {
      userId: demoUser3.id,
      content: "The pitch conditions at Lords today are perfect for fast bowlers. Expect some quick wickets!",
      category: "match_discussion",
      location: "Lords Cricket Ground, London",
      imageUrl: "https://picsum.photos/seed/cricket6/640/480"
    },
    {
      userId: demoUser2.id,
      content: "Throwback to when India won the World Cup in 2011. What a moment in cricket history!",
      category: "highlights",
      teamId: "india",
      matchId: "world-cup-2011-final",
      imageUrl: "https://picsum.photos/seed/cricket7/640/480"
    },
    {
      userId: demoUser4.id,
      content: "The upcoming T20 World Cup schedule has been announced! Mark your calendars cricket fans!",
      category: "news",
      imageUrl: "https://picsum.photos/seed/cricket8/640/480"
    }
  ];
  
  const createdPosts = [];
  for (const post of posts) {
    const createdPost = await storage.createPost(post);
    createdPosts.push(createdPost);
  }

  console.log("📝 Created demo posts");

  // Create likes
  const likes: InsertLike[] = [
    { userId: demoUser1.id, postId: createdPosts[1].id },
    { userId: demoUser1.id, postId: createdPosts[2].id },
    { userId: demoUser1.id, postId: createdPosts[3].id },
    { userId: demoUser2.id, postId: createdPosts[0].id },
    { userId: demoUser2.id, postId: createdPosts[2].id },
    { userId: demoUser2.id, postId: createdPosts[5].id },
    { userId: demoUser3.id, postId: createdPosts[0].id },
    { userId: demoUser3.id, postId: createdPosts[1].id },
    { userId: demoUser3.id, postId: createdPosts[6].id },
    { userId: demoUser4.id, postId: createdPosts[0].id },
    { userId: demoUser4.id, postId: createdPosts[4].id },
    { userId: demoUser4.id, postId: createdPosts[6].id }
  ];
  
  for (const like of likes) {
    await storage.likePost(like);
  }

  console.log("👍 Created likes");

  // Create comments
  const comments: InsertComment[] = [
    { userId: demoUser2.id, postId: createdPosts[0].id, content: "That last-ball six was incredible!" },
    { userId: demoUser3.id, postId: createdPosts[0].id, content: "One of the best matches I've seen in years." },
    { userId: demoUser1.id, postId: createdPosts[1].id, content: "The bowling lineup is looking really promising!" },
    { userId: demoUser4.id, postId: createdPosts[1].id, content: "Can't wait to see them in action in the next series." },
    { userId: demoUser1.id, postId: createdPosts[2].id, content: "Interesting analysis! I think team Chennai got some great value picks." },
    { userId: demoUser2.id, postId: createdPosts[3].id, content: "Strong squad selection. They've got a good mix of experience and youth." },
    { userId: demoUser4.id, postId: createdPosts[4].id, content: "That cover drive is Kohli's signature shot!" },
    { userId: demoUser1.id, postId: createdPosts[5].id, content: "Anderson is going to be lethal in these conditions!" },
    { userId: demoUser3.id, postId: createdPosts[6].id, content: "Dhoni's winning six is etched in every Indian cricket fan's memory!" },
    { userId: demoUser2.id, postId: createdPosts[7].id, content: "Looking forward to seeing how India performs in this World Cup." }
  ];
  
  for (const comment of comments) {
    await storage.createComment(comment);
  }

  console.log("💬 Created comments");

  // Create reels (video posts)
  const reels: InsertPost[] = [
    {
      userId: demoUser3.id,
      content: "My analysis of the perfect bowling technique. Watch and learn!",
      category: "reel",
      videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnailUrl: "https://picsum.photos/seed/reel1/640/1280",
      duration: 30
    },
    {
      userId: demoUser5.id,
      content: "Practicing my cover drive. What do you think of the technique?",
      category: "reel",
      videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnailUrl: "https://picsum.photos/seed/reel2/640/1280",
      duration: 15
    },
    {
      userId: demoUser2.id,
      content: "Highlights from yesterday's match. What a game!",
      category: "reel",
      videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      thumbnailUrl: "https://picsum.photos/seed/reel3/640/1280",
      duration: 45,
      matchId: "ind-vs-aus-2025"
    }
  ];

  for (const reel of reels) {
    await storage.createPost(reel);
  }

  console.log("🎬 Created reels");

  // Create stories 
  const stories: InsertStory[] = [
    {
      userId: demoUser1.id,
      imageUrl: "https://picsum.photos/seed/story1/1080/1920",
      caption: "At the stadium for the big match today!"
    },
    {
      userId: demoUser2.id,
      imageUrl: "https://picsum.photos/seed/story2/1080/1920",
      caption: "Team India jerseys for the new season just dropped!"
    },
    {
      userId: demoUser3.id,
      imageUrl: "https://picsum.photos/seed/story3/1080/1920",
      caption: "Morning practice session. Rise and grind!"
    },
    {
      userId: demoUser5.id,
      imageUrl: "https://picsum.photos/seed/story4/1080/1920",
      caption: "Match day! Ready to give it my all."
    }
  ];

  for (const story of stories) {
    await storage.createStory(story);
  }

  console.log("📸 Created stories");

  // Create player stats
  const playerStats: InsertPlayerStats[] = [
    {
      userId: demoUser3.id,
      position: "All-rounder",
      battingStyle: "Right-handed",
      bowlingStyle: "Right-arm medium",
      totalMatches: 245,
      totalRuns: 8432,
      totalWickets: 293,
      totalCatches: 87,
      totalSixes: 142,
      totalFours: 756,
      highestScore: 156,
      bestBowling: "6/42",
      battingAverage: "38.62",
      bowlingAverage: "26.34",
      // Extended stats for UI display
      innings: 240,
      notOuts: 22,
      ballsFaced: 9856,
      oversBowled: "2156.3",
      runsConceded: 7823,
      maidens: 89,
      fifties: 42,
      hundreds: 18,
      totalRunOuts: 15
    },
    {
      userId: demoUser5.id,
      position: "Batsman",
      battingStyle: "Right-handed",
      bowlingStyle: "Right-arm off-spin",
      totalMatches: 76,
      totalRuns: 3428,
      totalWickets: 12,
      totalCatches: 32,
      totalSixes: 65,
      totalFours: 321,
      highestScore: 183,
      bestBowling: "2/17",
      battingAverage: "45.12",
      bowlingAverage: "42.75",
      // Extended stats for UI display
      innings: 72,
      notOuts: 10,
      ballsFaced: 3984,
      oversBowled: "44.0",
      runsConceded: 513,
      maidens: 2,
      fifties: 16,
      hundreds: 8,
      totalRunOuts: 7
    }
  ];

  for (const stats of playerStats) {
    await storage.createPlayerStats(stats);
  }

  console.log("📊 Created player stats");

  // Create player matches
  const playerMatches: InsertPlayerMatch[] = [
    {
      userId: demoUser3.id,
      matchName: "India vs Australia, 3rd Test",
      matchDate: new Date("2025-01-15"),
      venue: "Melbourne Cricket Ground",
      opponent: "Australia",
      matchType: "Test",
      teamScore: "342/8 & 285/5",
      opponentScore: "298 & 215",
      result: "Won by 114 runs"
    },
    {
      userId: demoUser3.id,
      matchName: "IPL 2024: Chennai vs Mumbai",
      matchDate: new Date("2024-04-18"),
      venue: "Wankhede Stadium",
      opponent: "Mumbai",
      matchType: "T20",
      teamScore: "187/5",
      opponentScore: "184/8",
      result: "Won by 3 runs"
    },
    {
      userId: demoUser5.id,
      matchName: "India vs England, 2nd ODI",
      matchDate: new Date("2025-02-24"),
      venue: "Lords Cricket Ground",
      opponent: "England",
      matchType: "ODI",
      teamScore: "324/6",
      opponentScore: "276",
      result: "Won by 48 runs"
    }
  ];

  const createdMatches = [];
  for (const match of playerMatches) {
    const createdMatch = await storage.createPlayerMatch(match);
    createdMatches.push(createdMatch);
  }

  console.log("🏏 Created player matches");

  // Create player match performances
  const matchPerformances: InsertPlayerMatchPerformance[] = [
    {
      userId: demoUser3.id,
      matchId: createdMatches[0].id,
      runsScored: 87,
      ballsFaced: 142,
      fours: 9,
      sixes: 2,
      battingStatus: "Caught",
      oversBowled: "22.4",
      runsConceded: 78,
      wicketsTaken: 4,
      maidens: 3,
      catches: 1,
      runOuts: 0,
      stumpings: 0
    },
    {
      userId: demoUser3.id,
      matchId: createdMatches[1].id,
      runsScored: 42,
      ballsFaced: 28,
      fours: 5,
      sixes: 3,
      battingStatus: "Not Out",
      oversBowled: "4",
      runsConceded: 32,
      wicketsTaken: 2,
      maidens: 0,
      catches: 1,
      runOuts: 1,
      stumpings: 0
    },
    {
      userId: demoUser5.id,
      matchId: createdMatches[2].id,
      runsScored: 124,
      ballsFaced: 118,
      fours: 14,
      sixes: 3,
      battingStatus: "Not Out",
      oversBowled: "5",
      runsConceded: 28,
      wicketsTaken: 0,
      maidens: 0,
      catches: 1,
      runOuts: 0,
      stumpings: 0
    }
  ];

  for (const performance of matchPerformances) {
    await storage.createPlayerMatchPerformance(performance);
  }

  console.log("📝 Created match performances");

  // Create IPL 2023 tournament
  try {
    // Import IPL 2023 data and tournament services
    const { ipl2023Teams, ipl2023Venues } = await import('./data/ipl-2023-teams');
    const { enhancedFixtureGenerator } = await import('./services/tournament');
    
    // Create IPL 2023 completed tournament
    const ipl2023 = await storage.createTournament({
      name: "Indian Premier League 2023",
      shortName: "IPL 2023",
      organizerId: demoUser1.id,
      description: "The 16th season of the Indian Premier League, featuring 10 teams in a double round-robin format followed by playoffs.",
      startDate: new Date("2023-03-31"),
      endDate: new Date("2023-05-28"),
      format: "T20",
      tournamentType: "league",
      status: "completed",
      overs: 20,
      pointsPerWin: 2,
      pointsPerTie: 1,
      pointsPerNoResult: 1,
      rules: "Top 4 teams qualify for playoffs. Qualifier 1: 1st vs 2nd, Eliminator: 3rd vs 4th, Qualifier 2: Loser of Q1 vs Winner of Eliminator, Final: Winner of Q1 vs Winner of Q2."
    });

    // Register teams for the tournament
    for (const team of ipl2023Teams) {
      // Create the team if it doesn't exist
      let teamRecord = await storage.getTeamByNameOrCreate({
        name: team.name,
        shortName: team.shortName,
        logo: team.logo || "",
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor
      });
      
      // Register team for the tournament
      await storage.createTournamentTeam({
        tournamentId: ipl2023.id,
        teamId: teamRecord.id
      });
    }

    // Create IPL venues if they don't exist
    for (const venue of ipl2023Venues) {
      await storage.createVenue({
        name: venue.name,
        address: `${venue.name}, ${venue.city}`,
        city: venue.city,
        country: venue.country,
        capacity: venue.capacity,
        createdBy: demoUser1.id,
        description: venue.attributes.join(", "),
        facilities: ["Parking", "Food & Beverages", "Media Box"]
      });
    }

    // Use enhancedFixtureGenerator to preload IPL 2023 data
    if (enhancedFixtureGenerator) {
      await enhancedFixtureGenerator.preloadIPL2023Tournament(ipl2023.id);
      console.log("🏆 Created IPL 2023 tournament with data");
    }
  } catch (error) {
    console.error("Error creating IPL 2023 tournament:", error);
  }

  console.log("✅ Database seeding complete!");
  console.log("🚀 SERVER IS FULLY INITIALIZED AND READY");
}