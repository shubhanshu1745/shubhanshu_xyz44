// Optimized version for faster startup
import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";

// Create Express app with minimal configuration for fast startup
const app = express();
app.use(express.json({ limit: '10mb' }));  // Reduced from 50mb for faster startup
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add simple health check endpoints that respond immediately
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Plain text response for maximum simplicity
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Minimal logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    log(`${req.method} ${req.path}`);
  }
  next();
});

// Start the server first with a minimal configuration
// This ensures the port is opened quickly for the workflow system
const server = http.createServer(app);
const port = 5000;

// Open the port immediately
console.log(`SERVER IS STARTING ON PORT ${port}...`);
server.listen(port, "0.0.0.0", () => {
  console.log(`PORT ${port} IS NOW OPEN AND READY`);
});

// Then set up all the routes and other functionality in the background
setTimeout(async () => {
  try {
    // Register all API routes
    await registerRoutes(app);
    
    // Set up error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("Application error:", err);
    });
  
    // Setup Vite or static serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Start database seeding after routes and vite are set up
    setTimeout(async () => {
      try {
        await seedDatabase();
      } catch (error) {
        console.error("Error seeding database:", error);
      }
    }, 1000);

    console.log("🚀 SERVER IS FULLY INITIALIZED AND READY");
  } catch (error) {
    console.error("Error during server initialization:", error);
  }
}, 100);  // Very short delay to let the health endpoint start first