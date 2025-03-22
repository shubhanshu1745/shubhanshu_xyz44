import { storage } from "./storage";
import { hashPassword } from "./auth";
import { InsertPost, InsertFollow, InsertComment, InsertLike } from "@shared/schema";

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
    profileImage: "https://i.pravatar.cc/150?img=1"
  });
  
  const demoUser2 = await storage.createUser({
    username: "teamIndia",
    email: "teamIndia@example.com",
    password: await hashPassword("password123"),
    fullName: "Team India Fans",
    bio: "Official fan page for Team India | Cricket news and updates",
    location: "Delhi, India",
    profileImage: "https://i.pravatar.cc/150?img=2"
  });

  const demoUser3 = await storage.createUser({
    username: "cricketLegend",
    email: "legend@example.com",
    password: await hashPassword("password123"),
    fullName: "Cricket Legend",
    bio: "Former international cricket player | Coach | Analyst",
    location: "London, UK",
    profileImage: "https://i.pravatar.cc/150?img=3"
  });
  
  const demoUser4 = await storage.createUser({
    username: "cricNews",
    email: "cricnews@example.com",
    password: await hashPassword("password123"),
    fullName: "Cricket News Network",
    bio: "Breaking cricket news | Live match updates | Player interviews",
    location: "Melbourne, Australia",
    profileImage: "https://i.pravatar.cc/150?img=4"
  });

  const demoUser5 = await storage.createUser({
    username: "testUser",
    email: "test@example.com",
    password: await hashPassword("password123"),
    fullName: "Test User",
    bio: "This is a test account",
    location: "Bangalore, India",
    profileImage: "https://i.pravatar.cc/150?img=5"
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
  console.log("✅ Database seeding complete!");
}