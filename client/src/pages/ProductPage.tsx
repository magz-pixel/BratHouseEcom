import { useState } from "react";
import { ArrowLeft, ArrowRight, Heart, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Link, useRoute } from "wouter";
import { getWig, wigProducts } from "@shared/catalog";
import { useStore, formatMoney } from "@/contexts/StoreContext";
import { SiteShell } from "@/components/SiteShell";
import { BubbleButton, PageTag, SectionEyebrow, Tape } from "@/components/StickerUI";
import { WigCard } from "@/components/ProductCards";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SkuArt } from "@/components/LookArt";
import { encodeConfig, skuToConfig } from "@shared/wigBuilder";
import { pathWithQuery } from "@/lib/routing";

const imageDisclosure = "Illustration · real photos of the sample drop coming soon.";

export default function ProductPage() {
  const [, params] = useRoute("/product/:slug");
  const product = getWig(params?.slug || "");
  usePageMeta(`/product/${params?.slug || ""}`);
  if (!product) return <SiteShell><section className="not-found container"><PageTag color="orange">404 / NOPE</PageTag><h1 className="display-title">That wig went missing.</h1><BubbleButton href="/shop/wigs">Shop the wigs</BubbleButton></section></SiteShell>;
  return <ProductDetails key={product.id} product={product} />;
}

function ProductDetails({ product }: { product: (typeof wigProducts)[number] }) {
  const { addItem, wishlist, toggleWishlist } = useStore();
  const [tab, setTab] = useState("details");
  const saved = wishlist.includes(product.id);
  const variant = [product.grade, `${product.length}\"`, product.lace, product.density ? `${product.density}%` : "", product.glueless ? "Glueless" : ""].filter(Boolean).join(" · ");
  const details: [string, string][] = [
    ["Grade", product.grade],
    ["Length", `${product.length}\"`],
    ["Texture", product.texture],
    ["Color", product.color],
    ["Lace", product.lace],
    ["Density", product.density ? `${product.density}%` : "Not listed"],
    ["Construction", product.glueless ? "Glueless" : "Not listed"],
  ];
  const add = () => addItem({ id: product.slug, name: product.name, kind: "wig", price: product.price, image: "", variant });
  return (
    <SiteShell>
      <div className="product-breadcrumb container"><Link href="/shop/wigs"><ArrowLeft size={15} /> Back to wigs</Link><span>/</span><span>{product.name}</span></div>
      <section className="product-detail container">
        <div className="product-gallery">
          <div className="product-gallery__main sticker-card">
            <Tape />
            <SkuArt product={product} className="product-detail-art" />
            <p className="ai-image-disclosure ai-image-disclosure--detail">{imageDisclosure}</p>
          </div>
        </div>
        <div className="product-info">
          <SectionEyebrow icon="✦">THE BRATHOUSE DROP</SectionEyebrow>
          <h1 className="display-title product-title">{product.name}</h1>
          <div className="product-price-row"><strong>{formatMoney(product.price)}</strong><PageTag color="orange">LISTED PRICE</PageTag></div>
          <p className="product-stock">✦ Part of our South Africa sample drop: ready to ship once stock lands.</p>
          <div className="product-actions">
            <BubbleButton onClick={add} className="product-add-button">Add to bag <span>{formatMoney(product.price)}</span></BubbleButton>
            <button className={`wish-button wish-button--detail ${saved ? "is-saved" : ""}`} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} aria-pressed={saved} onClick={() => toggleWishlist(product.id)}><Heart size={19} fill={saved ? "currentColor" : "none"} /></button>
          </div>
          <div className="product-customise"><BubbleButton href={pathWithQuery("/build", encodeConfig(skuToConfig(product)))} tone="cream">✦ Customise this wig <ArrowRight size={16} /></BubbleButton><span>Change the length, color, lace or extras. Your build is made to order on the factory line.</span></div>
          <p className="payment-not-configured"><ShieldCheck size={15} /> Payment setup is not active; this preview cannot place an order.</p>
          <div className="product-trust"><span><PackageCheck size={16} /> Listed specs</span><span><Truck size={16} /> Shipping to be confirmed</span><span><ShieldCheck size={16} /> No online payment</span></div>
          <div className="product-tabs" role="tablist" aria-label="Product information">{[["details", "Hair details"], ["care", "Care"], ["shipping", "Shipping & returns"]].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
          <div className="product-tab-panel" role="tabpanel">{tab === "details" ? <dl className="hair-specs">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : tab === "care" ? <p>Product-specific care instructions were not supplied. Follow the care information provided with the hair and confirm any heat or wash guidance before use.</p> : <p>Shipping price, delivery time, destinations and return terms have not been supplied. Confirm them before ordering; this preview does not add a shipping charge.</p>}</div>
        </div>
      </section>
      <section className="related-products container"><div className="section-title-row"><div><SectionEyebrow>MORE HAIR TO LOVE</SectionEyebrow><h2 className="display-title">The side pieces.</h2></div><Link href="/shop/wigs" className="underlined-link">Shop all <ArrowRight size={15} /></Link></div><div className="product-grid">{wigProducts.filter((item) => item.id !== product.id).slice(0, 4).map((item, index) => <WigCard key={item.id} product={item} index={index} />)}</div></section>
    </SiteShell>
  );
}
