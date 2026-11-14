import { useMemo, useState } from "react";
import { ArrowUpDown, Filter, RotateCcw } from "lucide-react";
import { wigProducts } from "@shared/catalog";
import { formatMoney } from "@shared/money";
import { SiteShell } from "@/components/SiteShell";
import { BubbleButton, PageTag, SectionEyebrow } from "@/components/StickerUI";
import { WigCard } from "@/components/ProductCards";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LookArt } from "@/components/LookArt";

const MAX_PRICE = 6000;

function initialFilter(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
}

export default function WigsPage() {
  usePageMeta("/shop/wigs");
  const [texture, setTexture] = useState(() => initialFilter("texture", "All textures"));
  const [lace, setLace] = useState("All lace");
  const [length, setLength] = useState("Any length");
  const [color, setColor] = useState("All colors");
  const [density, setDensity] = useState("Any density");
  const [construction, setConstruction] = useState(() => initialFilter("construction", "Any construction"));
  const [price, setPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState("featured");
  const filtered = useMemo(() => wigProducts.filter((product) =>
    (texture === "All textures" || product.texture === texture) &&
    (lace === "All lace" || product.lace === lace) &&
    (length === "Any length" || product.length === Number(length)) &&
    (color === "All colors" || product.color === color) &&
    (density === "Any density" || (density === "Not specified" ? product.density === undefined : product.density === Number(density))) &&
    (construction === "Any construction" || (construction === "Glueless" ? product.glueless === true : product.glueless === undefined)) &&
    product.price <= price
  ).sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : 0), [texture, lace, length, color, density, construction, price, sort]);
  const reset = () => { setTexture("All textures"); setLace("All lace"); setLength("Any length"); setColor("All colors"); setDensity("Any density"); setConstruction("Any construction"); setPrice(MAX_PRICE); setSort("featured"); };
  return <SiteShell>
    <section className="shop-hero shop-hero--wigs"><div className="container shop-hero__inner"><div><SectionEyebrow icon="✦">SHOP THE CROWN</SectionEyebrow><h1 className="display-title">Wigs that<br /><em>hit different.</em></h1><p>Find your texture. Pick your length. Walk in like you own the playlist.</p><div className="shop-hero__notes"><PageTag color="pink">10 LISTED STYLES</PageTag><span>Prices in South African rand (R).</span><BubbleButton href="/build" tone="pink">Or build your own ✦</BubbleButton></div></div><LookArt preset="softglam" className="shop-hero-art" label="Soft Glam body-wave illustration" /></div></section>
    <section className="catalog-section container"><div className="catalog-topline"><div><p className="catalog-count"><Filter size={15} /> {filtered.length} {filtered.length === 1 ? "wig" : "wigs"}</p><p className="demo-note">Availability and shipping are to be confirmed.</p></div><label className="sort-select"><ArrowUpDown size={15} /><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
      <div className="catalog-layout"><aside className="filter-panel" aria-label="Filter wigs"><div className="filter-panel__head"><h2>Filter the fantasy</h2><button type="button" onClick={reset}><RotateCcw size={14} /> Reset</button></div><FilterSelect label="Texture" value={texture} onChange={setTexture} options={["All textures", "Bob", "Straight", "Body wave", "Curly", "Afro kinky"]} /><FilterSelect label="Lace type" value={lace} onChange={setLace} options={["All lace", "5X5", "13X4"]} /><FilterSelect label="Length" value={length} onChange={setLength} options={["Any length", "10", "18", "20"]} suffix={length !== "Any length" ? '"' : undefined} /><FilterSelect label="Color" value={color} onChange={setColor} options={["All colors", "Black", "Highlight"]} /><FilterSelect label="Density" value={density} onChange={setDensity} options={["Any density", "180", "Not specified"]} suffix={density === "180" ? "%" : undefined} /><FilterSelect label="Construction" value={construction} onChange={setConstruction} options={["Any construction", "Glueless", "Not specified"]} /><label className="price-filter">Max price <strong>{formatMoney(price)}</strong><input aria-label="Maximum price in South African rand" type="range" min="1500" max={MAX_PRICE} step="100" value={price} onChange={(event) => setPrice(Number(event.target.value))} /><span><small>{formatMoney(1500)}</small><small>{formatMoney(MAX_PRICE)}</small></span></label><div className="filter-note"><span>✦</span><p>Made for big hair and bigger plans.</p></div></aside>
      <div className="catalog-results">{filtered.length ? <div className="product-grid">{filtered.map((product, index) => <WigCard key={product.id} product={product} index={index} />)}</div> : <div className="empty-state"><span>♡</span><h2>No crowns in that combo.</h2><p>Reset your filters and find the one.</p><BubbleButton onClick={reset}>Clear the filters</BubbleButton></div>}</div></div>
    </section>
  </SiteShell>;
}

function FilterSelect({ label, value, onChange, options, suffix = "" }: { label: string; value: string; onChange: (value: string) => void; options: string[]; suffix?: string }) {
  return <label className="filter-control"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option === "Any length" || option === "Any density" || option === "Any construction" ? option : option.includes("All") || option === "Not specified" || option === "Glueless" ? option : `${option}${suffix}`}</option>)}</select></label>;
}
