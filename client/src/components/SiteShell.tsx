import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUpRight, Heart, Instagram, Menu, MessageCircle, Minus, Plus, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useStore, formatMoney } from "@/contexts/StoreContext";
import { useBratTrail } from "@/hooks/useBratTrail";
import { BubbleButton, Sticker } from "@/components/StickerUI";
import { ItemThumb } from "@/components/LookArt";
import { asset } from "@/lib/routing";

const navItems = [
  { href: "/build", label: "Build your wig ✦" },
  { href: "/shop/wigs", label: "Wigs" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/about", label: "Our story" },
];

export function SiteShell({ children, hideHelper = false }: { children: ReactNode; hideHelper?: boolean }) {
  const trail = useBratTrail();
  return <div className="site-shell"><a className="skip-link" href="#main-content">Skip to content</a><AnnouncementBar /><Header /><main id="main-content">{children}</main><Footer /><CartDrawer />{!hideHelper && <AskTheBrats />}<AddToCartBurst /><div className="cursor-trail" aria-hidden="true">{trail.map((point) => <span key={point.id} style={{ left: point.x, top: point.y }}>{point.glyph}</span>)}</div><div className="grain-overlay" aria-hidden="true" /></div>;
}

function AddToCartBurst() {
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    const onAdd = () => setBurst((value) => value + 1);
    window.addEventListener("brathouse:add-to-cart", onAdd);
    return () => window.removeEventListener("brathouse:add-to-cart", onAdd);
  }, []);
  if (!burst) return null;
  return <div key={burst} className="cart-heart-burst" aria-hidden="true"><span>♡</span><span>✦</span><span>♡</span><span>✧</span><span>♡</span><span>✦</span></div>;
}

function AnnouncementBar() {
  return <div className="announcement-bar"><span>BRATTY BY DESIGN</span><i aria-hidden="true">✦</i><span>PRICES IN SOUTH AFRICAN RAND (R) · SHIPPING TO BE CONFIRMED</span><i aria-hidden="true">✦</i><span>YOUR CROWN, DELIVERED</span></div>;
}

function Header() {
  const { count, setCartOpen } = useStore();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location]);
  return <header className="site-header">
    <div className="site-header__inner">
      <button className="mobile-menu-toggle icon-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><Menu size={21} /></button>
      <Link href="/" className="brand-lockup" aria-label="BRATHOUSE home"><img src={asset("images/brathouse-logo.webp")} alt="BRATHOUSE crowned monogram and wigs & bundles wordmark" width="76" height="76" fetchPriority="high" /></Link>
      <nav className={`main-nav ${menuOpen ? "main-nav--open" : ""}`} aria-label="Main navigation">
        {navItems.map((item) => <Link key={item.href} href={item.href} className={`main-nav__link ${location === item.href ? "is-current" : ""}`}>{item.label}</Link>)}
        <Link href="/faq" className="main-nav__link main-nav__mobile-help">Need the tea?</Link>
      </nav>
      <div className="site-header__actions">
        <BubbleButton href="/build" tone="orange" className="header-shop">Build a wig <ArrowUpRight size={16} /></BubbleButton>
        <button className="cart-trigger" aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`} onClick={() => setCartOpen(true)}><ShoppingBag size={19} /><span>Bag</span><b>{count}</b></button>
      </div>
    </div>
    {menuOpen && <button className="mobile-menu-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
  </header>;
}

function CartDrawer() {
  const { items, subtotal, discount, total, promo, promoError, isCartOpen, setCartOpen, setQuantity, removeItem, applyPromo } = useStore();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setCartOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCartOpen, setCartOpen]);
  if (!isCartOpen) return null;
  const submitCode = (event: FormEvent) => { event.preventDefault(); setMessage(applyPromo(code) ? "Code secured, brat." : "Try BRAT10 or PACK20."); };
  return <div className="drawer-layer" role="presentation">
    <button className="drawer-scrim" aria-label="Close shopping bag" onClick={() => setCartOpen(false)} />
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="cart-drawer__header"><div><span className="cart-drawer__eyebrow">THE RECEIPT</span><h2 id="cart-title">Your bag, babe <Heart size={18} fill="currentColor" /></h2></div><button className="icon-button" aria-label="Close cart" onClick={() => setCartOpen(false)}><X size={21} /></button></div>
      <p className="receipt-rule">────────────────────────</p>
      {items.length === 0 ? <div className="cart-empty"><span className="cart-empty__heart">♡</span><h3>Nothing in the bag. Yet.</h3><p>Your next main-character moment is one click away.</p><BubbleButton href="/shop/wigs" onClick={() => setCartOpen(false)}>Shop the wigs</BubbleButton></div> : <>
        <ul className="cart-lines">{items.map((item) => <li className="cart-line" key={item.key}>
          <ItemThumb item={item} width={76} height={88} />
          <div className="cart-line__details"><Link href={item.link ?? `/product/${item.id}`} onClick={() => setCartOpen(false)}>{item.name}</Link><span>{item.variant}</span><strong>{formatMoney(item.price)}</strong><div className="quantity-stepper"><button aria-label={`Decrease ${item.name} quantity`} onClick={() => setQuantity(item.key, item.quantity - 1)}><Minus size={13} /></button><output aria-label="Quantity">{item.quantity}</output><button aria-label={`Increase ${item.name} quantity`} onClick={() => setQuantity(item.key, item.quantity + 1)}><Plus size={13} /></button><button className="cart-line__remove" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.key)}><Trash2 size={14} /></button></div></div>
        </li>)}</ul>
        <form className="promo-form" onSubmit={submitCode}><label htmlFor="drawer-promo">Got a little code?</label><div><input id="drawer-promo" value={code} onChange={(event) => setCode(event.target.value)} placeholder="BRAT10" autoComplete="off" /><button type="submit">Apply</button></div>{promo && <small className="field-success">{promo.message}</small>}{promoError && <small className="field-error">{promoError}</small>}{message && !promoError && !promo && <small>{message}</small>}</form>
        <div className="receipt-totals"><p><span>Subtotal</span><b>{formatMoney(subtotal)}</b></p><p><span>Shipping</span><b>{items.length ? "To be confirmed" : "—"}</b></p>{discount > 0 && <p><span>Promo {promo?.code}</span><b>−{formatMoney(discount)}</b></p>}<p className="receipt-total"><span>EST. TOTAL <small>(before shipping)</small></span><b>{formatMoney(total)}</b></p></div>
        <p className="cart-note">Prices are shown in Rand (R). Shipping and online payment are not set up; no order is placed here.</p>
        <BubbleButton href="/checkout" className="cart-checkout" onClick={() => setCartOpen(false)}>Checkout preview <ArrowUpRight size={16} /></BubbleButton>
        <Link href="/shop/wigs" className="keep-shopping" onClick={() => setCartOpen(false)}>Keep browsing</Link>
      </>}
      <p className="receipt-rule">BRATHOUSE • BRATTY BY DESIGN</p>
    </aside>
  </div>;
}

function Footer() {
  return <footer className="site-footer">
    <div className="site-footer__paper"><span className="footer-cross" aria-hidden="true">✦</span><div className="site-footer__top"><div className="footer-brand"><img src={asset("images/brathouse-logo.webp")} alt="BRATHOUSE crowned monogram and wordmark" width="112" height="112" loading="lazy" /><p>Hair with main-character energy.<br /><strong>Bratty by design.</strong></p></div><div className="footer-column"><h2>Get the goods</h2><Link href="/shop/wigs">Shop wigs</Link></div><div className="footer-column"><h2>Good to know</h2><Link href="/shipping">Shipping & returns</Link><Link href="/care">Care guide</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact us</Link></div><div className="footer-column"><h2>Find the brats</h2><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} /></a><a href="https://www.tiktok.com/" target="_blank" rel="noreferrer">TikTok <ArrowUpRight size={14} /></a><span className="footer-social-note">Social links are placeholders.</span></div></div><div className="footer-bottom"><p>© {new Date().getFullYear()} BRATHOUSE. All hair, no hush.</p><div className="payment-marks" aria-label="Payment method icons shown for future setup"><span>VISA</span><span>MC</span><span>PAY</span><span>—</span></div><p className="footer-demo">Prices are in Rand (R); shipping, policies & payment setup need confirmation.</p></div></div>
  </footer>;
}

const answers: Record<string, string> = {
  Texture: "The current edit includes bob, straight, body wave, curly and Afro kinky textures. Check the exact listing details for your pick.",
  Lace: "The listed styles use 5X5 or 13X4 lace. Check the selected wig's product details for the exact specification.",
  Care: "Detangle from ends upward, keep heat low, and sleep in satin. Always follow the supplier's care card for your exact texture.",
  Pricing: "Listed prices are in South African rand (R). Availability, shipping costs and payment setup still need confirmation.",
  Shipping: "Shipping terms and costs are not confirmed yet. We won't take an order until payment and the real policy details are set up.",
};

function AskTheBrats() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  return <div className="ask-widget">
    {open && <section className="ask-panel" role="dialog" aria-label="Ask the Brats hair guide"><div className="ask-panel__head"><div><span>YOUR HAIR BFF</span><h2>Ask the Brats</h2></div><button className="icon-button" aria-label="Close hair guide" onClick={() => setOpen(false)}><X size={18} /></button></div><p className="ask-panel__intro">Pick a topic. We got you, babe.</p><div className="ask-topics">{Object.keys(answers).map((item) => <button key={item} className={topic === item ? "is-selected" : ""} onClick={() => setTopic(item)}>{item}</button>)}</div>{topic && <p className="ask-answer">{answers[topic]}</p>}<p className="ask-disclaimer">Quick demo FAQ—not a live stylist.</p></section>}
    <button className="ask-launcher" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className="ask-launcher__sparkle"><Sparkles size={16} /></span><span>ASK THE BRATS</span>{open ? <X size={17} /> : <MessageCircle size={17} />}</button>
  </div>;
}
