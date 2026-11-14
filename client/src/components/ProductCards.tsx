import { Heart, Plus, Star } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "wouter";
import type { WigProduct } from "@shared/catalog";
import { useStore, formatMoney } from "@/contexts/StoreContext";
import { Sticker } from "@/components/StickerUI";
import { SkuArt, hasPhotos } from "@/components/LookArt";
import { encodeConfig, skuToConfig } from "@shared/wigBuilder";
import { pathWithQuery } from "@/lib/routing";


export function WigCard({ product, index = 0 }: { product: WigProduct; index?: number }) {
  const { addItem, wishlist, toggleWishlist } = useStore();
  const isSaved = wishlist.includes(product.id);
  const variant = [product.grade, `${product.length}\"`, product.lace, product.density ? `${product.density}%` : "", product.glueless ? "Glueless" : ""].filter(Boolean).join(" · ");
  return (
    <article className="product-card sticker-card" style={{ "--card-tilt": `${["-1.4deg", "0.8deg", "-0.5deg", "1.2deg"][index % 4]}` } as CSSProperties}>
      <div className="product-card__visual">
        <Link href={`/product/${product.slug}`} className="product-card__image-link" aria-label={`View ${product.name}`}>
          <SkuArt product={product} className="product-card__image product-card__image--main" />
        </Link>
        <button className={`wish-button ${isSaved ? "is-saved" : ""}`} aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={isSaved} onClick={() => toggleWishlist(product.id)}>
          <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <span className="product-grade-pill">{product.grade}</span>
      </div>
      <div className="product-card__copy">
        {!hasPhotos(product) && <p className="ai-image-disclosure ai-image-disclosure--card">Illustration · real photos of the sample drop coming soon.</p>}
        <div className="product-card__meta"><span>{product.texture}</span><span>{product.length}&quot;</span></div>
        <Link href={`/product/${product.slug}`} className="product-card__name">{product.name}</Link>
        <Link href={pathWithQuery("/build", encodeConfig(skuToConfig(product)))} className="customise-link">✦ Customise this wig</Link>
        <p>{product.lace}{product.density ? ` · ${product.density}% density` : " · Density not listed"}{product.glueless ? " · Glueless" : ""}</p>
        <div className="product-card__bottom">
          <strong>{formatMoney(product.price)}</strong>
          <button className="quick-add" onClick={() => addItem({ id: product.slug, name: product.name, kind: "wig", price: product.price, image: "", variant })} aria-label={`Add ${product.name} to bag`}>
            <Plus size={16} /><span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function RatingStars() {
  return <span className="rating-stars" aria-label="Sample rating"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></span>;
}
