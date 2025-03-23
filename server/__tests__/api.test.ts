
import request from 'supertest';
import { app } from '../routes';
import { storage } from '../storage';

let authToken: string;
let testUserId: number;

beforeAll(async () => {
  // Create a test user
  const registerResponse = await request(app)
    .post("/api/register")
    .send({
      username: "testuser",
      email: "test@example.com",
      password: "testpass123",
      fullName: "Test User"
    });
    
  // Login to get auth token
  const loginResponse = await request(app)
    .post("/api/login")
    .send({
      username: "testuser",
      password: "testpass123"
    });

  authToken = loginResponse.body.token;
  testUserId = loginResponse.body.user.id;
});

describe("Authentication", () => {
  it("should register a new user", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({
        username: "newuser",
        email: "new@example.com",
        password: "password123",
        fullName: "New User"
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should login an existing user", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({
        username: "testuser",
        password: "testpass123"
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });
});

describe("Posts", () => {
  it("should create a new post", async () => {
    const response = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        content: "Test post",
        category: "match_discussion"
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("should get user posts", async () => {
    const response = await request(app)
      .get("/api/users/testuser/posts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("Player Stats", () => {
  it("should create player stats", async () => {
    const response = await request(app)
      .post("/api/player-stats")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        position: "Batsman",
        battingStyle: "Right-handed",
        bowlingStyle: "Off-spin"
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("userId", testUserId);
  });

  it("should get player stats", async () => {
    const response = await request(app)
      .get(`/api/users/testuser/player-stats`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMatches");
  });
});

describe("Match Management", () => {
  let matchId: number;

  it("should create a new match", async () => {
    const response = await request(app)
      .post("/api/users/testuser/matches")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        matchName: "Test Match",
        opponent: "Test Team",
        venue: "Test Ground",
        matchDate: new Date().toISOString(),
        matchType: "T20"
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    matchId = response.body.id;
  });

  it("should add match performance", async () => {
    const response = await request(app)
      .post(`/api/users/testuser/matches/${matchId}/performance`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        runsScored: 50,
        ballsFaced: 35,
        fours: 5,
        sixes: 2,
        wicketsTaken: 2,
        oversBowled: "4.0",
        runsConceded: 25
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("performance");
  });
});
