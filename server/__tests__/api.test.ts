
import request from "supertest";
import { app } from "../index";
import { storage } from "../storage";

describe("API Endpoints", () => {
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user and get auth token
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        fullName: "Test User"
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        username: "testuser",
        password: "password123"
      });

    authToken = loginResponse.body.token;
    testUserId = loginResponse.body.user.id;
  });

  describe("Authentication", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "newuser",
          email: "new@example.com",
          password: "password123",
          fullName: "New User"
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
    });

    it("should login existing user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "testuser",
          password: "password123"
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
});
