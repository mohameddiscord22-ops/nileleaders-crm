import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
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
  // In production, the built files are in ./public relative to dist/index.js
  const distPath = path.resolve(import.meta.dirname, "public");
  
  console.log(`[Static] Serving files from: ${distPath}`);
  
  if (!fs.existsSync(distPath)) {
    console.warn(`[Static] Directory NOT found: ${distPath}`);
    // Try fallback path for some environments
    const fallbackPath = path.resolve(process.cwd(), "dist", "public");
    if (fs.existsSync(fallbackPath)) {
       console.log(`[Static] Using fallback path: ${fallbackPath}`);
       app.use(express.static(fallbackPath));
       app.use("*", (_req, res) => {
         res.sendFile(path.resolve(fallbackPath, "index.html"));
       });
       return;
    }
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found");
    }
  });
}
