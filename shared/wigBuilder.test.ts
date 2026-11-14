import { describe, expect, it } from "vitest";
import { wigProducts } from "./catalog";
import { decodeConfig, encodeConfig, matchingSku, normalizeConfig, priceBreakdown, PRESETS, randomConfig, skuToConfig } from "./wigBuilder";

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
