import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, sql } from "./db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Test database connection first
    log("Testing database connection...");
    await db.execute(sql`SELECT 1`);
    log("Database connection successful");

    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message} - ${err.stack}`); //Improved logging
      res.status(status).json({ message });
    });

    const buildDir = path.join(__dirname, '..', 'build'); // Path to build directory

    try {
      if (process.env.NODE_ENV === "development") {
        await setupVite(app, server);
      } else {
        if (fs.existsSync(buildDir)) { //Check if build directory exists
          serveStatic(app); 
        } else {
          log("Build directory not found. Serving static files skipped.");
        }
      }

      const port = 5000;
      server.listen({
        port,
        host: "0.0.0.0",
      }, () => {
        log(`Server started successfully on port ${port}`);
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
})();
