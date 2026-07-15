import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const port = parseInt(process.env.PORT || "3000");

  // Start listening IMMEDIATELY to satisfy Railway health checks
  server.listen(port, "0.0.0.0", () => {
    console.log(`[Server] Listening on port ${port} - Bootstrapping starting...`);
  });

  // Security & CORS
  app.disable("x-powered-by");
  
  // Simplest possible CORS for troubleshooting
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check for Railway/Render - Put these BEFORE any other middleware
  app.get("/health", (req, res) => res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }));
  app.get("/ping", (req, res) => res.status(200).send("pong"));

  // Sanitize DATABASE_URL to remove any accidental spaces or hidden characters
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.trim();
  }

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global Error Handler - MUST be the last middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Global Error Handler]:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  });

  console.log("[Server] Bootstrap complete");
}

startServer().catch((err) => {
  console.error("FAILED TO START SERVER:", err);
  // Still try to start a dummy server to satisfy Railway health checks if possible
  const app = express();
  app.get("*", (req, res) => res.status(500).send("Server failed to start, check logs"));
  app.listen(process.env.PORT || 3000);
});
