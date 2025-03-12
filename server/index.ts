import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Server error:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try to serve the app on port 3000
  // this serves both the API and the client
  const port = 3000;
  const alternativePort = 3001;
  
  const startServer = (portToUse: number) => {
    server.listen({
      port: portToUse,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${portToUse}`);
    }).on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${portToUse} is in use, trying port ${alternativePort}...`);
        // Only try the alternative port if we're not already trying it
        if (portToUse !== alternativePort) {
          startServer(alternativePort);
        } else {
          log(`Both ports ${port} and ${alternativePort} are in use. Trying another port...`);
          // Try one more port as a last resort
          const lastResortPort = 8080;
          server.listen({
            port: lastResortPort,
            host: "0.0.0.0",
            reusePort: true,
          }, () => {
            log(`serving on port ${lastResortPort}`);
          }).on('error', (err) => {
            log('All ports are in use. Could not start server.');
            process.exit(1);
          });
        }
      } else {
        console.error('Server error:', error);
        throw error;
      }
    });
  };
  
  startServer(port);
})();
