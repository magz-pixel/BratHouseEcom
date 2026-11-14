import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getPageSeo, injectSeoHtml } from "../../shared/seo";

const staticFilePattern = /\.[a-z0-9]{1,8}$/i;
const reservedPaths = ["/api/", "/manus-storage/", "/@", "/__vite", "/node_modules/"];

function isDocumentRequest(req: express.Request) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  if (req.accepts("html") === false) return false;
  if (reservedPaths.some((prefix) => req.path.startsWith(prefix))) return false;
  if (["/manus-routes.json", "/favicon.ico", "/robots.txt", "/sitemap.xml"].includes(req.path)) return false;
  if (staticFilePattern.test(req.path)) return false;
  return true;
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true as const },
    appType: "custom",
  });

  // Handle document requests first. Vite's generic dev HTML response otherwise
  // serves the home document for arbitrary paths and masks route-specific SEO/404s.
  app.use(async (req, res, next) => {
    if (!isDocumentRequest(req)) return next();
    try {
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const transformed = await vite.transformIndexHtml(req.originalUrl, template);
      const seo = getPageSeo(req.path);
      if (!seo) return res.status(404).end();
      const page = injectSeoHtml(transformed, seo);
      return res.status(seo.status ?? 200).set({ "Content-Type": "text/html; charset=utf-8" }).end(page);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      return next(error);
    }
  });

  app.use(vite.middlewares);
}

export function serveStatic(app: Express) {
  const distPath = process.env.NODE_ENV === "development"
    ? path.resolve(import.meta.dirname, "../..", "dist", "public")
    : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }

  app.use(express.static(distPath, { index: false }));

  // Render route-specific metadata/body before the client bundle mounts.
  app.get("*", async (req, res, next) => {
    try {
      const seo = getPageSeo(req.path);
      if (!seo) return res.status(404).end();
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const html = injectSeoHtml(template, seo);
      return res.status(seo.status ?? 200).set({ "Content-Type": "text/html; charset=utf-8" }).end(html);
    } catch (error) {
      return next(error);
    }
  });
}
