import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema, registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { EmailService } from "./services/email-service";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Simple session secret (in production, use a more secure secret from environment variables)
  const sessionSecret = process.env.SESSION_SECRET || "cricsocial-secret-key";

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body using the registerSchema, which includes confirmPassword
      const { confirmPassword, ...validationData } = registerSchema.parse(req.body);
      
      // At this point, validation has passed including password matching
      const validatedUser = validationData;
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(validatedUser.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(validatedUser.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password and create user
      const user = await storage.createUser({
        ...validatedUser,
        password: await hashPassword(validatedUser.password)
      });

      // Still send verification email for demo purposes
      try {
        await EmailService.sendVerificationEmail(user.email, user.id);
        console.log("Verification email would be sent (verification bypass is active)");
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with login even if email sending fails
      }
      
      // Login the newly registered user
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password to client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          ...userWithoutPassword,
          message: "Registration successful! You can now use all features of the application."
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      // Validate request body
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error, user: Express.User) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
        
        // Bypassing email verification check for now
        // In production, you would check if user.emailVerified is true
        
        req.login(user, (err) => {
          if (err) return next(err);
          // Don't send password to client
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Don't send password to client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
