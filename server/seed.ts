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

// Local avatar images stored in public/profiles
const profileImages = [
  "/profiles/avatar-1.png",
  "/profiles/avatar-2.png",
  "/profiles/avatar-3.png",
  "/profiles/avatar-4.png",
  "/profiles/avatar-5.png",
  "/profiles/avatar-6.png",
  "/profiles/avatar-7.png",
  "/profiles/avatar-8.png",
  "/profiles/avatar-9.png",
  "/profiles/avatar-10.png",
  "/profiles/avatar-11.png",
  "/profiles/avatar-12.png",
  "/profiles/avatar-13.png",
  "/profiles/avatar-14.png",
  "/profiles/avatar-15.png",
  "/profiles/avatar-16.png",
  "/profiles/avatar-17.png",
  "/profiles/avatar-18.png",
  "/profiles/avatar-19.png",
  "/profiles/avatar-20.png",
  "/profiles/avatar-21.png",
  "/profiles/avatar-22.png",
  "/profiles/avatar-23.png",
  "/profiles/avatar-24.png",
  "/profiles/avatar-25.png",
];

// Cricket-themed post images
const postImages = [
  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1593766788306-28561086694e?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1629285483773-6b5cde2171d7?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1594470117722-de4b9a02ebed?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=640&h=640&fit=crop",
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=640&h=640&fit=crop",
];

export async function seedDatabase(force: boolean = false) {
  console.log("🌱 Seeding database with sample data...");

  // Check if database is already seeded (avoid duplicates)
  const existingUser = await storage.getUserByUsername("crickfan");
  if (existingUser && !force) {
    console.log("✅ Database already seeded, skipping...");
    return;
  }

  // If force is true, we'll add new users with different usernames
  // In a real app, you'd clear the database first

  const hashedPassword = await hashPassword("password123");

  // Create 25 demo users with cricket-themed profiles
  const demoUsers = [
    { username: "crickfan", fullName: "Cricket Fan", bio: "Cricket enthusiast | Follow for match updates and highlights 🏏", location: "Mumbai, India", isPlayer: false },
    { username: "teamIndia", fullName: "Team India Fans", bio: "Official fan page for Team India | Cricket news and updates 🇮🇳", location: "Delhi, India", isPlayer: false },
    { username: "cricketLegend", fullName: "Cricket Legend", bio: "Former international cricket player | Coach | Analyst 🏆", location: "London, UK", isPlayer: true },
    { username: "cricNews", fullName: "Cricket News Network", bio: "Breaking cricket news | Live match updates | Player interviews 📰", location: "Melbourne, Australia", isPlayer: false },
    { username: "playerOne", fullName: "Professional Player", bio: "Professional cricket player | Batsman | Current national team player ⭐", location: "Chennai, India", isPlayer: true },
    { username: "iplFanatic", fullName: "IPL Fanatic", bio: "IPL superfan | All teams coverage | Fantasy cricket expert 🎯", location: "Bangalore, India", isPlayer: false },
    { username: "cricketCoach", fullName: "Coach Sharma", bio: "Level 3 certified cricket coach | Youth development specialist 🎓", location: "Kolkata, India", isPlayer: false },
    { username: "sixHitter", fullName: "Power Hitter", bio: "T20 specialist | 200+ sixes in career | Entertainment guaranteed 💥", location: "Hyderabad, India", isPlayer: true },
    { username: "spinWizard", fullName: "Spin Master", bio: "Leg spinner | 300+ wickets | Turning the ball since 2010 🌀", location: "Lahore, Pakistan", isPlayer: true },
    { username: "fastBowler", fullName: "Speed Demon", bio: "Fast bowler | 150+ kmph | Fear the pace 🔥", location: "Perth, Australia", isPlayer: true },
    { username: "wicketKeeper", fullName: "Glove Master", bio: "Wicket keeper batsman | Lightning reflexes | Team captain 🧤", location: "Johannesburg, South Africa", isPlayer: true },
    { username: "cricketAnalyst", fullName: "Stats Guru", bio: "Cricket statistician | Data analyst | Numbers tell the story 📊", location: "Auckland, New Zealand", isPlayer: false },
    { username: "matchReporter", fullName: "Live Reporter", bio: "On-ground match reporter | Ball by ball updates | Stadium vibes 🎤", location: "Dubai, UAE", isPlayer: false },
    { username: "cricketMemes", fullName: "Cricket Memes", bio: "Best cricket memes | Daily laughs | Tag your cricket buddies 😂", location: "Toronto, Canada", isPlayer: false },
    { username: "youngTalent", fullName: "Rising Star", bio: "U19 World Cup winner | Future of cricket | Dream big 🌟", location: "Dhaka, Bangladesh", isPlayer: true },
    { username: "allRounder", fullName: "Complete Player", bio: "All-rounder | Bat, bowl, field | Jack of all trades 🎪", location: "Colombo, Sri Lanka", isPlayer: true },
    { username: "cricketHistory", fullName: "Cricket Archives", bio: "Cricket history | Legendary moments | Nostalgia guaranteed 📚", location: "Birmingham, UK", isPlayer: false },
    { username: "fantasyExpert", fullName: "Fantasy King", bio: "Fantasy cricket expert | Tips & predictions | Win big 💰", location: "Singapore", isPlayer: false },
    { username: "womensCricket", fullName: "Women Cricket Fan", bio: "Supporting women's cricket | Equal game | Future is female 👑", location: "Sydney, Australia", isPlayer: false },
    { username: "testCricket", fullName: "Test Purist", bio: "Test cricket lover | 5 days of glory | Real cricket 🏛️", location: "Cape Town, South Africa", isPlayer: false },
    { username: "t20Lover", fullName: "T20 Enthusiast", bio: "T20 is life | Fast & furious | Entertainment first ⚡", location: "Mumbai, India", isPlayer: false },
    { username: "cricketPhotog", fullName: "Cricket Photographer", bio: "Professional cricket photographer | Capturing moments | 📸", location: "Lord's, London", isPlayer: false },
    { username: "pitchReport", fullName: "Pitch Expert", bio: "Pitch analyst | Conditions expert | Know before you play 🌱", location: "Chennai, India", isPlayer: false },
    { username: "cricketFitness", fullName: "Cricket Fitness", bio: "Cricket fitness trainer | Strength & conditioning | Peak performance 💪", location: "Brisbane, Australia", isPlayer: false },
    { username: "umpireView", fullName: "Third Umpire", bio: "Former international umpire | Rules expert | Fair play advocate ⚖️", location: "Sharjah, UAE", isPlayer: false },
  ];

  const createdUsers = [];
  for (let i = 0; i < demoUsers.length; i++) {
    const userData = demoUsers[i];
    const user = await storage.createUser({
      username: userData.username,
      email: `${userData.username}@cricsocial.com`,
      password: hashedPassword,
      fullName: userData.fullName,
      bio: userData.bio,
      location: userData.location,
      profileImage: profileImages[i],
      isPlayer: userData.isPlayer
    });
    createdUsers.push(user);
  }

  console.log(`👤 Created ${createdUsers.length} demo users`);

  // Create follow relationships (make it realistic - users follow each other)
  const followRelationships: InsertFollow[] = [];
  
  // Each user follows 5-15 random other users
  for (const user of createdUsers) {
    const numToFollow = Math.floor(Math.random() * 11) + 5; // 5-15 follows
    const otherUsers = createdUsers.filter(u => u.id !== user.id);
    const shuffled = otherUsers.sort(() => 0.5 - Math.random());
    const toFollow = shuffled.slice(0, numToFollow);
    
    for (const followUser of toFollow) {
      followRelationships.push({
        followerId: user.id,
        followingId: followUser.id
      });
    }
  }
  
  for (const follow of followRelationships) {
    await storage.followUser(follow);
  }

  console.log(`👥 Created ${followRelationships.length} follow relationships`);

  // Create posts with cricket content
  const postContents = [
    { content: "What an incredible match between India and Australia! The last over was a nail-biter 🏏🔥", category: "match_discussion", teamId: "india" },
    { content: "Team India's recent performance has been outstanding. The bowling attack is looking stronger than ever! 💪", category: "team_news", teamId: "india" },
    { content: "Here's my analysis of the recent IPL auction. Some surprising picks this year! What do you think? 🤔", category: "opinion" },
    { content: "BREAKING: England announces squad for the upcoming Test series against New Zealand 📢", category: "team_news", teamId: "england" },
    { content: "This shot by Virat Kohli is absolutely magnificent! Perfect technique and timing ⭐", category: "player_highlight", playerId: "virat-kohli" },
    { content: "The pitch conditions at Lords today are perfect for fast bowlers. Expect some quick wickets! 🌱", category: "match_discussion" },
    { content: "Throwback to when India won the World Cup in 2011. What a moment in cricket history! 🏆", category: "highlights", teamId: "india" },
    { content: "The upcoming T20 World Cup schedule has been announced! Mark your calendars cricket fans! 📅", category: "news" },
    { content: "Just witnessed the most amazing catch in the deep! Absolute athleticism on display 🤯", category: "match_discussion" },
    { content: "Morning practice session done! Working on my cover drive today. Cricket never stops 💯", category: "player_highlight" },
    { content: "Who's your pick for the Player of the Tournament? Drop your predictions below! 👇", category: "opinion" },
    { content: "The rivalry between India and Pakistan is unmatched. Every match is a festival! 🎉", category: "match_discussion" },
    { content: "New bat day! Can't wait to try this beauty in the nets tomorrow 🏏✨", category: "player_highlight" },
    { content: "Rain delay at the stadium. Perfect time for some cricket trivia! Who knows the answer? 🌧️", category: "match_discussion" },
    { content: "Congratulations to the U19 team for their brilliant victory! Future stars in the making 🌟", category: "team_news" },
    { content: "The art of spin bowling is truly mesmerizing. Watch this delivery on repeat! 🌀", category: "player_highlight" },
    { content: "Match day vibes! Nothing beats the atmosphere at a packed cricket stadium 🏟️", category: "match_discussion" },
    { content: "Fantasy cricket tip: Always check the pitch report before finalizing your team! 📊", category: "opinion" },
    { content: "Historic moment as the 500th Test match is played at this iconic venue! 🏛️", category: "news" },
    { content: "Training hard for the upcoming series. No shortcuts to success! 💪🏏", category: "player_highlight" },
    { content: "The DRS review was spot on! Technology making cricket fairer 📺", category: "match_discussion" },
    { content: "Celebrating 10 years of this legendary partnership. Cricket's greatest duo! 🤝", category: "highlights" },
    { content: "Night cricket has a different charm altogether. Under the lights magic! ✨🌙", category: "match_discussion" },
    { content: "Just met my cricket idol! Dreams do come true. Never give up on yours! 🙏", category: "player_highlight" },
    { content: "The women's cricket team is on fire this season! Proud supporters here 👑", category: "team_news" },
  ];

  const createdPosts = [];
  for (let i = 0; i < postContents.length; i++) {
    const postData = postContents[i];
    const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const post = await storage.createPost({
      userId: randomUser.id,
      content: postData.content,
      category: postData.category,
      teamId: postData.teamId || null,
      playerId: postData.playerId || null,
      imageUrl: postImages[i % postImages.length],
      matchId: null,
      videoUrl: null,
      thumbnailUrl: null,
      duration: null,
      location: null
    });
    createdPosts.push(post);
  }

  console.log(`� CCreated ${createdPosts.length} demo posts`);

  // Create likes (each post gets 5-20 random likes)
  for (const post of createdPosts) {
    const numLikes = Math.floor(Math.random() * 16) + 5;
    const shuffledUsers = [...createdUsers].sort(() => 0.5 - Math.random());
    const likers = shuffledUsers.slice(0, numLikes);
    
    for (const liker of likers) {
      await storage.likePost({ userId: liker.id, postId: post.id });
    }
  }

  console.log("👍 Created likes for posts");

  // Create comments
  const commentTexts = [
    "Amazing shot! 🔥",
    "What a match this was!",
    "Totally agree with this!",
    "Best player of this generation 💯",
    "Can't wait for the next match!",
    "This is why I love cricket ❤️",
    "Incredible performance!",
    "The technique is flawless",
    "Goosebumps watching this!",
    "Cricket at its finest 🏏",
    "Legend! 🙌",
    "This deserves more attention",
    "Sharing this with everyone!",
    "Pure class! ⭐",
    "What a moment to witness!",
  ];

  for (const post of createdPosts) {
    const numComments = Math.floor(Math.random() * 5) + 1;
    const shuffledUsers = [...createdUsers].sort(() => 0.5 - Math.random());
    const commenters = shuffledUsers.slice(0, numComments);
    
    for (const commenter of commenters) {
      const randomComment = commentTexts[Math.floor(Math.random() * commentTexts.length)];
      await storage.createComment({
        userId: commenter.id,
        postId: post.id,
        content: randomComment
      });
    }
  }

  console.log("💬 Created comments for posts");

  // Create stories
  const storyImages = [
    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1080&h=1920&fit=crop",
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1080&h=1920&fit=crop",
    "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=1080&h=1920&fit=crop",
    "https://images.unsplash.com/photo-1593766788306-28561086694e?w=1080&h=1920&fit=crop",
    "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1080&h=1920&fit=crop",
  ];

  const storyCaptions = [
    "Match day! 🏏",
    "At the stadium! 🏟️",
    "Practice makes perfect 💪",
    "Team bonding time 🤝",
    "Victory celebration! 🎉",
  ];

  for (let i = 0; i < 10; i++) {
    const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    await storage.createStory({
      userId: randomUser.id,
      imageUrl: storyImages[i % storyImages.length],
      caption: storyCaptions[i % storyCaptions.length]
    });
  }

  console.log("📸 Created stories");

  // Create player stats for players
  const playerUsers = createdUsers.filter(u => 
    ["cricketLegend", "playerOne", "sixHitter", "spinWizard", "fastBowler", "wicketKeeper", "youngTalent", "allRounder"].includes(u.username)
  );

  for (const player of playerUsers) {
    await storage.createPlayerStats({
      userId: player.id,
      position: player.username === "spinWizard" ? "Bowler" : player.username === "fastBowler" ? "Bowler" : "Batsman",
      battingStyle: "Right-handed",
      bowlingStyle: player.username === "spinWizard" ? "Leg-spin" : player.username === "fastBowler" ? "Right-arm fast" : "Right-arm medium",
      totalMatches: Math.floor(Math.random() * 200) + 50,
      totalRuns: Math.floor(Math.random() * 8000) + 1000,
      totalWickets: Math.floor(Math.random() * 200) + 20,
      totalCatches: Math.floor(Math.random() * 100) + 10,
      totalSixes: Math.floor(Math.random() * 150) + 20,
      totalFours: Math.floor(Math.random() * 500) + 100,
      highestScore: Math.floor(Math.random() * 150) + 50,
      bestBowling: `${Math.floor(Math.random() * 5) + 2}/${Math.floor(Math.random() * 40) + 10}`,
      battingAverage: (Math.random() * 30 + 20).toFixed(2),
      bowlingAverage: (Math.random() * 20 + 20).toFixed(2),
      innings: Math.floor(Math.random() * 180) + 40,
      notOuts: Math.floor(Math.random() * 30) + 5,
      ballsFaced: Math.floor(Math.random() * 8000) + 1000,
      oversBowled: `${Math.floor(Math.random() * 1500) + 100}.${Math.floor(Math.random() * 6)}`,
      runsConceded: Math.floor(Math.random() * 5000) + 500,
      maidens: Math.floor(Math.random() * 100) + 10,
      fifties: Math.floor(Math.random() * 40) + 5,
      hundreds: Math.floor(Math.random() * 15) + 1,
      totalRunOuts: Math.floor(Math.random() * 20) + 2
    });
  }

  console.log("📊 Created player stats");

  console.log("✅ Database seeding complete!");
  console.log("🚀 SERVER IS FULLY INITIALIZED AND READY");
  console.log("");
  console.log("📋 Test Accounts:");
  console.log("   Username: crickfan | Password: password123");
  console.log("   Username: teamIndia | Password: password123");
  console.log("   Username: cricketLegend | Password: password123");
  console.log("   (All 25 users have password: password123)");
}
