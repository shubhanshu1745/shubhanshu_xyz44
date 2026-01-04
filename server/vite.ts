import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, the build output is in dist/public
  // __dirname in compiled code is /app/dist, so public is at /app/dist/public
  const distPath = path.resolve(__dirname, "public");
  const altDistPath = path.resolve(process.cwd(), "dist", "public");
  const dockerPath = "/app/dist/public";
  
  // Try multiple paths for different environments
  let actualPath = distPath;
  if (!fs.existsSync(distPath)) {
    if (fs.existsSync(altDistPath)) {
      actualPath = altDistPath;
    } else if (fs.existsSync(dockerPath)) {
      actualPath = dockerPath;
    }
  }

  if (!fs.existsSync(actualPath)) {
    console.warn(
      `Warning: Could not find the build directory. Tried: ${distPath}, ${altDistPath}, ${dockerPath}`,
    );
    return;
  }

  // Check if index.html exists
  const indexPath = path.resolve(actualPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.warn(`Warning: index.html not found at ${indexPath}`);
  } else {
    console.log(`Found index.html at ${indexPath}`);
  }

  console.log(`Serving static files from: ${actualPath}`);
  app.use(express.static(actualPath));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not found - index.html missing");
    }
  });
}
