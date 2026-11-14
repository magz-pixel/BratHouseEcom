import { describe, expect, it } from "vitest";
import { wigProducts } from "./catalog";
import { DEFAULT_CONFIG, decodeConfig, differencesFromSku, encodeConfig, matchingSku, nearestSku, normalizeConfig, priceBreakdown, PRESETS, randomConfig, sameLook, skuToConfig } from "./wigBuilder";

describe("wig builder pricing", () => {
  it.each(wigProducts.map((p) => [p.name, p] as const))("prices %s exactly at its listed Rand price", (_name, product) => {
    expect(priceBreakdown(skuToConfig(product)).total).toBe(product.price);
  });

  it("recognises every listed SKU as ready to ship", () => {
    for (const product of wigProducts) expect(matchingSku(skuToConfig(product))?.id).toBe(product.id);
  });

  it("round-trips configs through the share URL", () => {
    for (const preset of PRESETS) {
      const config = normalizeConfig(preset.config);
      expect(decodeConfig(encodeConfig(config))).toEqual(config);
    }
  });

  it("random looks are always valid and priced", () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 200; i++) {
      const config = randomConfig(0, rand);
      expect(config.length).toBeGreaterThanOrEqual(10);
      expect(config.length).toBeLessThanOrEqual(config.texture === "bob" ? 14 : 30);
      expect(["blue", "lilac", "cherry"]).not.toContain(config.color);
      expect(priceBreakdown(config).total).toBeGreaterThan(500);
    }
  });
});

describe("closest ready-to-ship wig", () => {
  it("returns the listed wig itself for every SKU, with no differences", () => {
    for (const p of wigProducts) {
      expect(nearestSku(skuToConfig(p)).slug).toBe(p.slug);
      expect(differencesFromSku(skuToConfig(p), p)).toEqual([]);
    }
  });

  it("maps the default build to the 20\" body-wave black, listing only the hairline add-on", () => {
    const near = nearestSku(DEFAULT_CONFIG);
    expect(near.slug).toBe("12a-180-13x4-20-body-black-glueless");
    expect(differencesFromSku(DEFAULT_CONFIG, near)).toEqual(["+ Pre-Plucked hairline"]);
  });

  it("keeps bobs with bobs and long hair with long hair", () => {
    expect(nearestSku({ ...DEFAULT_CONFIG, texture: "bob", length: 12, color: "ginger" }).texture).toBe("Bob");
    expect(nearestSku({ ...DEFAULT_CONFIG, texture: "straight", length: 28, color: "chrome" }).texture).toBe("Straight");
    expect(nearestSku({ ...DEFAULT_CONFIG, texture: "body", color: "honey" }).color).toBe("Highlight");
  });

  it("describes changes in plain words", () => {
    const p = wigProducts.find((w) => w.slug === "12a-180-13x4-20-straight-black-glueless")!;
    expect(differencesFromSku({ ...skuToConfig(p), length: 24, extras: ["bangs"] }, p)).toEqual(['20" → 24"', "+ Full Bangs"]);
  });

  it("sameLook ignores the name and extra order", () => {
    expect(sameLook({ ...DEFAULT_CONFIG, name: "A", extras: ["clips", "knots"] }, { ...DEFAULT_CONFIG, name: "B", extras: ["knots", "clips"] })).toBe(true);
    expect(sameLook(DEFAULT_CONFIG, { ...DEFAULT_CONFIG, length: 22 })).toBe(false);
  });
});
