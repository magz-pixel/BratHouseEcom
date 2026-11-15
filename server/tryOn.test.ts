import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, encodeConfig } from "@shared/wigBuilder";
import { wigProducts } from "@shared/catalog";
import { MAX_SELFIE_BYTES, TryOnLimiter, buildPrompt, parseTryOnRequest, providerFromEnv } from "./tryOn";

const tinyJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==";
const look = encodeConfig(DEFAULT_CONFIG);

describe("try-on limits", () => {
  it("allows the daily amount per visitor, then blocks", () => {
    const l = new TryOnLimiter(3, 100);
    expect([l.take("a"), l.take("a"), l.take("a"), l.take("a")]).toEqual([true, true, true, false]);
    expect(l.remaining("a")).toBe(0);
    expect(l.take("b")).toBe(true); // other visitors unaffected
  });

  it("frees uses after 24 hours", () => {
    let now = 0;
    const l = new TryOnLimiter(1, 100, () => now);
    expect(l.take("a")).toBe(true);
    expect(l.take("a")).toBe(false);
    now += 24 * 60 * 60 * 1000 + 1;
    expect(l.take("a")).toBe(true);
  });

  it("enforces the global spend cap across visitors", () => {
    const l = new TryOnLimiter(5, 2);
    expect([l.take("a"), l.take("b"), l.take("c")]).toEqual([true, true, false]);
  });

  it("refunds a failed generation", () => {
    const l = new TryOnLimiter(1, 10);
    l.take("a");
    l.refund("a");
    expect(l.remaining("a")).toBe(1);
  });
});

describe("try-on request validation", () => {
  it("requires consent", () => {
    expect(parseTryOnRequest({ selfie: tinyJpeg, look })).toEqual({ error: "Consent is required." });
  });
  it("rejects non-image data and oversized photos", () => {
    expect(parseTryOnRequest({ selfie: "data:text/html;base64,PGgxPg==", look, consent: true })).toHaveProperty("error");
    const big = "data:image/jpeg;base64," + "A".repeat(Math.ceil((MAX_SELFIE_BYTES + 10) * 4 / 3));
    expect(parseTryOnRequest({ selfie: big, look, consent: true })).toEqual({ error: "Photo is too large (max 2 MB)." });
  });
  it("needs a valid build", () => {
    expect(parseTryOnRequest({ selfie: tinyJpeg, look: "", consent: true })).toEqual({ error: "Missing wig build." });
  });
  it("accepts a good request and decodes the build", () => {
    const r = parseTryOnRequest({ selfie: tinyJpeg, look, consent: true });
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.selfie.mime).toBe("image/jpeg");
      expect(r.config.length).toBe(DEFAULT_CONFIG.length);
    }
  });
});

describe("try-on prompt and provider config", () => {
  it("describes the build and keeps the person unchanged", () => {
    const p = buildPrompt({ ...DEFAULT_CONFIG, length: 26, color: "honey" }, wigProducts[0]);
    expect(p).toContain('Length: 26"');
    expect(p).toContain("Honey Blonde");
    expect(p).toMatch(/Keep their face/);
  });
  it("is off unless configured, and gemini needs a key", () => {
    expect(providerFromEnv({})).toBeNull();
    expect(providerFromEnv({ TRYON_PROVIDER: "gemini" })).toBeNull();
    expect(providerFromEnv({ TRYON_PROVIDER: "gemini", GEMINI_API_KEY: "test" })?.name).toBe("gemini");
    expect(providerFromEnv({ TRYON_PROVIDER: "mock" })?.name).toBe("mock");
  });
});
