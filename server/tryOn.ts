/**
 * "See it on me": AI-generated photo of the customer wearing their build.
 *
 *   GET  /api/try-on/status  -> { enabled, provider, remaining, limit }
 *   POST /api/try-on         -> { image (data URL), remaining }
 *
 * Privacy: selfies are held in memory only for the request, never written to
 * disk or logged, and only sent to the configured AI provider.
 *
 * Config (env):
 *   TRYON_PROVIDER        "gemini" | "mock"   (unset = feature off)
 *   GEMINI_API_KEY        required for gemini
 *   TRYON_GEMINI_MODEL    default "gemini-2.5-flash-image"
 *   TRYON_DAILY_LIMIT     per visitor per 24h, default 3
 *   TRYON_GLOBAL_DAILY    all visitors per 24h (spend cap), default 200
 */
import fs from "node:fs";
import path from "node:path";
import type { Express, Request, Response } from "express";
import { decodeConfig, nearestSku, specLines, type WigConfig } from "@shared/wigBuilder";
import type { WigProduct } from "@shared/catalog";

export const MAX_SELFIE_BYTES = 2 * 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

/* ------------------------------ limits ------------------------------ */

/** Sliding 24h counter per key, plus a global cap. In memory: resets on restart (fine for a single server). */
export class TryOnLimiter {
  private hits = new Map<string, number[]>();
  private global: number[] = [];
  constructor(private perVisitor: number, private globalCap: number, private now: () => number = Date.now) {}

  private prune(list: number[]) {
    const cutoff = this.now() - DAY_MS;
    while (list.length && list[0] <= cutoff) list.shift();
    return list;
  }
  remaining(key: string) {
    const mine = this.prune(this.hits.get(key) ?? []);
    const globalLeft = this.globalCap - this.prune(this.global).length;
    return Math.max(0, Math.min(this.perVisitor - mine.length, globalLeft));
  }
  /** Records a use if allowed. */
  take(key: string): boolean {
    if (this.remaining(key) <= 0) return false;
    const t = this.now();
    const mine = this.hits.get(key) ?? [];
    mine.push(t);
    this.hits.set(key, mine);
    this.global.push(t);
    return true;
  }
  /** Give a use back (e.g. the provider failed). */
  refund(key: string) {
    this.hits.get(key)?.pop();
    this.global.pop();
  }
}

/* ------------------------------ validation ------------------------------ */

export type ParsedRequest = { selfie: { mime: string; data: string }; config: WigConfig };

export function parseTryOnRequest(body: unknown): ParsedRequest | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.consent !== true) return { error: "Consent is required." };
  if (typeof b.selfie !== "string") return { error: "Missing photo." };
  const m = b.selfie.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return { error: "Photo must be a JPG, PNG or WebP." };
  if (Math.floor((m[2].length * 3) / 4) > MAX_SELFIE_BYTES) return { error: "Photo is too large (max 2 MB)." };
  const config = typeof b.look === "string" ? decodeConfig(b.look) : null;
  if (!config) return { error: "Missing wig build." };
  return { selfie: { mime: m[1], data: m[2] }, config };
}

/* ------------------------------ prompt ------------------------------ */

export function buildPrompt(config: WigConfig, reference?: WigProduct) {
  const spec = specLines(config).map(([k, v]) => `- ${k}: ${v}`).join("\n");
  return [
    "Edit the first image: the same person wearing a new wig.",
    "Keep their face, skin tone, expression, body, clothing, pose, lighting and background exactly the same. Do not beautify or change their features.",
    "Replace only their hair with a realistic human-hair lace wig, natural hairline, realistic strands and shine.",
    reference ? `The second image is a reference photo of a similar real wig (${reference.name}); match its hair quality and texture, but follow the spec below where it differs.` : "",
    "Wig spec:",
    spec,
    "Photorealistic. One person only. No text or watermark.",
  ].filter(Boolean).join("\n");
}

/* ------------------------------ providers ------------------------------ */

export type ProviderInput = { selfie: { mime: string; data: string }; reference?: { mime: string; data: string }; prompt: string };
export type TryOnProvider = { name: string; generate(input: ProviderInput): Promise<{ mime: string; data: string }> };

/** Returns the selfie unchanged: exercises the whole flow without an AI bill. */
export const mockProvider: TryOnProvider = {
  name: "mock",
  async generate({ selfie }) {
    await new Promise((r) => setTimeout(r, 1200));
    return selfie;
  },
};

export function geminiProvider(apiKey: string, model: string): TryOnProvider {
  return {
    name: "gemini",
    async generate({ selfie, reference, prompt }) {
      const parts: unknown[] = [{ text: prompt }, { inline_data: { mime_type: selfie.mime, data: selfie.data } }];
      if (reference) parts.push({ inline_data: { mime_type: reference.mime, data: reference.data } });
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"] } }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      const json = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } }[] } }[] };
      for (const p of json.candidates?.[0]?.content?.parts ?? []) {
        if (p.inlineData) return { mime: p.inlineData.mimeType, data: p.inlineData.data };
        if (p.inline_data) return { mime: p.inline_data.mime_type, data: p.inline_data.data };
      }
      throw new Error("Gemini returned no image");
    },
  };
}

export function providerFromEnv(env = process.env): TryOnProvider | null {
  switch (env.TRYON_PROVIDER) {
    case "mock": return mockProvider;
    case "gemini": return env.GEMINI_API_KEY ? geminiProvider(env.GEMINI_API_KEY, env.TRYON_GEMINI_MODEL || "gemini-2.5-flash-image") : null;
    default: return null;
  }
}

/** Front photo of the closest real wig, if the shoot has been processed. */
function referencePhoto(product: WigProduct): ProviderInput["reference"] {
  const dir = path.resolve(import.meta.dirname, "..", process.env.NODE_ENV === "production" ? "dist/public" : "client/public", "wigs", product.slug);
  for (const f of ["front-960.webp", "front-480.webp"]) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) return { mime: "image/webp", data: fs.readFileSync(p).toString("base64") };
  }
  return undefined;
}

/* ------------------------------ routes ------------------------------ */

const visitorKey = (req: Request) => {
  const device = typeof req.headers["x-tryon-device"] === "string" ? req.headers["x-tryon-device"].slice(0, 64) : "";
  return `${req.ip}|${device}`;
};

export function registerTryOnRoutes(app: Express, provider = providerFromEnv(), limiter = new TryOnLimiter(Number(process.env.TRYON_DAILY_LIMIT) || 3, Number(process.env.TRYON_GLOBAL_DAILY) || 200)) {
  const limit = Number(process.env.TRYON_DAILY_LIMIT) || 3;

  app.get("/api/try-on/status", (req: Request, res: Response) => {
    res.set("Cache-Control", "no-store").json({ enabled: Boolean(provider), provider: provider?.name ?? null, remaining: provider ? limiter.remaining(visitorKey(req)) : 0, limit });
  });

  app.post("/api/try-on", async (req: Request, res: Response) => {
    res.set("Cache-Control", "no-store");
    if (!provider) return res.status(503).json({ error: "AI try-on isn't switched on yet." });
    const parsed = parseTryOnRequest(req.body);
    if ("error" in parsed) return res.status(400).json({ error: parsed.error });
    const key = visitorKey(req);
    if (!limiter.take(key)) return res.status(429).json({ error: "You've used today's free AI previews. Message us on WhatsApp for more.", remaining: 0 });
    try {
      const reference = nearestSku(parsed.config);
      const out = await provider.generate({ selfie: parsed.selfie, reference: referencePhoto(reference), prompt: buildPrompt(parsed.config, reference) });
      return res.json({ image: `data:${out.mime};base64,${out.data}`, remaining: limiter.remaining(key), provider: provider.name });
    } catch (e) {
      limiter.refund(key);
      console.error("[try-on] provider failed:", e instanceof Error ? e.message : "unknown"); // never log the image
      return res.status(502).json({ error: "The AI preview didn't work this time. Try again in a moment." });
    }
  });
}
