import type { CSSProperties } from "react";
import { getWig, type WigProduct } from "@shared/catalog";
import { PRESETS, skuToConfig, type WigConfig } from "@shared/wigBuilder";
import { WigRender } from "@/components/WigRender";
import type { CartItem } from "@/contexts/StoreContext";

/**
 * Drawn wig art used wherever a real photo is still missing.
 * When the sample-drop photos arrive, swap these for <img> tags.
 */
export function LookArt({ preset, config, className = "", style, label, compact = true }: { preset?: string; config?: WigConfig; className?: string; style?: CSSProperties; label?: string; compact?: boolean }) {
  const look = config ?? (PRESETS.find((p) => p.id === preset) ?? PRESETS[0]).config;
  return <div className={`wig-thumb ${className}`} style={style}><WigRender config={look} compact={compact} title={label || look.name || "BRATHOUSE wig illustration"} /></div>;
}

export function SkuArt({ product, className = "" }: { product: WigProduct; className?: string }) {
  return <LookArt config={skuToConfig(product)} className={className} label={`Illustration of ${product.name}`} />;
}

/** Cart/checkout thumbnail: listed wigs are drawn, custom builds carry their own image. */
export function ItemThumb({ item, width, height }: { item: Pick<CartItem, "id" | "image" | "kind" | "name">; width: number; height: number }) {
  const product = item.kind === "wig" ? getWig(item.id) : undefined;
  if (product) return <div className="item-thumb" style={{ width, height }}><SkuArt product={product} /></div>;
  return <img src={item.image} alt="" width={width} height={height} loading="lazy" />;
}
