import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowRight, Heart, Instagram, PackageCheck, Sparkles, Star, Truck } from "lucide-react";
import { Link } from "wouter";
import { wigProducts } from "@shared/catalog";
import { SiteShell } from "@/components/SiteShell";
import { BubbleButton, PageTag, SectionEyebrow, SectionTitle, Sticker, Tape, TornDivider } from "@/components/StickerUI";
import { WigCard } from "@/components/ProductCards";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LookArt } from "@/components/LookArt";
import { asset } from "@/lib/routing";


export default function Home() {
  usePageMeta("/");
  const heroRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");
  const [signupMessage, setSignupMessage] = useState("");
  useEffect(() => {
    const node = heroRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--parallax-x", `${((event.clientX - rect.left) / rect.width - 0.5) * 18}px`);
        node.style.setProperty("--parallax-y", `${((event.clientY - rect.top) / rect.height - 0.5) * 14}px`);
      });
    };
    node.addEventListener("pointermove", move, { passive: true });
    return () => { cancelAnimationFrame(frame); node.removeEventListener("pointermove", move); };
  }, []);
  const submitSignup = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) return setSignupMessage("Drop a real email, babe.");
    try { window.localStorage.setItem("brathouse-newsletter-demo", email); } catch { /* storage optional */ }
    setSignupMessage("You’re on the demo list. Connect email signup before launch.");
  };
  return <SiteShell>
    <section className="hero-collage" ref={heroRef}>
      <div className="hero-collage__paper hero-collage__paper--back" aria-hidden="true" />
      <div className="hero-collage__left"><div className="hero-kicker"><span className="hero-kicker__pin" />THE HAIR IS THE ATTITUDE</div><img className="hero-wordmark" src={asset("images/brathouse-logo.webp")} alt="BRATHOUSE — wigs and bundles" width="520" height="520" fetchPriority="high" /><h1 className="hero-ransom"><span>WIGS</span><span>THAT</span><span>HIT</span><span>DIFFERENT.</span></h1><p className="hero-subline">A better hair day, with a little more <em>nerve.</em></p><div className="hero-actions"><BubbleButton href="/build" tone="pink">Build your wig ✦ <ArrowRight size={17} /></BubbleButton><BubbleButton href="/shop/wigs" tone="cream">Shop ready-to-ship <PackageCheck size={16} /></BubbleButton></div><p className="hero-trust"><span>✦</span> WIGS · MAIN-CHARACTER ENERGY</p></div>
      <div className="hero-collage__right"><div className="hero-photo-frame"><Tape className="hero-tape" /><LookArt preset="y2k" compact={false} className="hero-art" label="Y2K Baddie wig illustration: honey highlights, body wave" /><span className="hero-photo-caption">DESIGNED BY YOU.</span></div><Sticker tone="chrome" className="hero-sticker hero-sticker--crown" tilt="9deg">CROWN<br />YOURSELF</Sticker><Sticker tone="pink" className="hero-sticker hero-sticker--heart" tilt="-12deg"><Heart fill="currentColor" size={34} /><span>NO<br />APOLOGIES</span></Sticker><span className="hero-scribble hero-scribble--star" aria-hidden="true">✦</span><span className="hero-scribble hero-scribble--bolt" aria-hidden="true">↯</span><div className="hero-orbit" aria-hidden="true">BRATTY BY DESIGN · BRATTY BY DESIGN ·</div></div>
      <a href="#shop-the-mood" className="hero-scroll">SCROLL FOR THE TEA <ArrowDown size={15} /></a>
    </section>
    <Marquee />
    <section className="home-section builder-promo"><div className="container builder-promo__inner"><div className="builder-promo__copy"><SectionEyebrow icon="✦">NEW · BUILD-A-BRAT STUDIO</SectionEyebrow><h2 className="display-title">Your wig.<br /><em>Your rules.</em></h2><p>Our hair is made on a modular factory line in Xuchang, China, the wig capital of the world. Every lace, texture, length and color is its own station. So we let you pick each one.</p><ol className="builder-steps"><li><b>01</b> Pick your lace & cap</li><li><b>02</b> Choose texture & length</li><li><b>03</b> Go wild on color</li><li><b>04</b> Send it to us on WhatsApp</li></ol><div className="hero-actions"><BubbleButton href="/build" tone="pink">Start building <ArrowRight size={16} /></BubbleButton><BubbleButton href="/shop/wigs" tone="cream">Or shop ready-to-ship</BubbleButton></div></div><div className="builder-promo__looks">{["y2k", "ginger", "curlqueen"].map((preset, i) => <Link key={preset} href="/build" className={`builder-promo__look builder-promo__look--${i}`}><LookArt preset={preset} /></Link>)}</div></div></section>
    <section id="shop-the-mood" className="home-section categories-section"><div className="container"><SectionTitle eyebrow="PICK YOUR PLOT" sub="Pick your cut or construction.">The hair menu</SectionTitle><div className="category-cards"><CategoryCard href="/build" index="01" title="Build your own" note="Lace, texture, length, color. Your rules." preset="icy" tone="pink" label="CUSTOM STUDIO" /><CategoryCard href="/shop/wigs" index="02" title="Ready to ship" note="Ten styles in our South Africa sample drop." preset="softglam" tone="cream" label="THE DROP" /><CategoryCard href="/shop/wigs?construction=Glueless" index="03" title="Glueless wigs" note="No glue. All main-character energy." preset="boss" tone="cream" label="GLUELESS EDIT" /></div></div></section>
    <section className="home-section bestsellers-section"><div className="container"><div className="section-title-row"><SectionTitle eyebrow="THE BRAT PICKS" sub="The ones getting all the DMs.">Best sellers <span className="title-star">✦</span></SectionTitle><Link className="underlined-link" href="/shop/wigs">Shop all wigs <ArrowRight size={16} /></Link></div><div className="product-grid product-grid--home">{wigProducts.slice(0, 4).map((product, index) => <WigCard key={product.id} product={product} index={index} />)}</div></div></section>
    <TornDivider label="QUALITY HAIR. LOUDER ENERGY." />
    <section className="home-section why-section"><div className="container"><div className="why-heading"><Sticker tone="black" tilt="-3deg">THE BRATHOUSE PROMISE</Sticker><SectionTitle eyebrow="WHY THE BRATS COME BACK" sub="No gatekeeping the good hair.">Pretty hair.<br /><em>Zero</em> apologies.</SectionTitle></div><div className="benefit-grid"><Benefit icon={<Sparkles />} number="01" title="Quality hair" copy="Soft, full, and ready for whatever your camera roll has planned. Listed product details are provided as supplied; availability still needs confirmation." /><Benefit icon={<PackageCheck />} number="02" title="Pick your style" copy="Choose the cut, texture and color that feels like your next main-character moment." /><Benefit icon={<Truck />} number="03" title="Shipping to confirm" copy="Delivery costs and timing are not listed yet. Check final shipping details before an order can be placed." /><Benefit icon={<Star />} number="04" title="Glam guaranteed" copy="A crown should feel like you walked in with the aux cord." /></div></div></section>
    <section className="home-section reviews-section"><div className="container"><SectionTitle eyebrow="THE GROUP CHAT" sub="Sample notes, because we're saving seats for the real girls." >Brat notes <span aria-hidden="true">♡</span></SectionTitle><div className="review-wall"><Review note="The hairline? Not clockable. The attitude? Very." author="A sample Brat" tilt="-4deg" tone="pink" /><Review note="I came for the wigs and left with a whole new personality." author="Another sample Brat" tilt="2.5deg" tone="cream" /><Review note="She understood the assignment. These are demo notes until real reviews arrive." author="Brathouse demo" tilt="-1deg" tone="orange" /></div><p className="demo-note">Illustrative placeholder reviews—not verified customer testimonials.</p></div></section>
    <section className="home-section social-section"><div className="container"><div className="social-intro"><div><SectionEyebrow icon="◎">THE PHOTO DUMP</SectionEyebrow><SectionTitle>Hair pics or it didn’t happen.</SectionTitle><p>Campaign inspo for the next version of you.</p></div><Sticker tone="chrome" tilt="6deg"><Instagram size={16} /> @BRATHOUSEHAIR</Sticker></div><div className="social-wall"><SocialTile preset="y2k" label="Y2K BADDIE" tilt="-2deg" /><SocialTile preset="ginger" label="GINGER BOB" tilt="1deg" /><SocialTile preset="curlqueen" label="CURL QUEEN" tilt="-0.8deg" /><SocialTile preset="icy" label="ICY CHROME" tilt="2deg" /></div><p className="demo-note">Preset looks from the wig builder. Tap one to make it yours.</p><div className="social-actions"><BubbleButton href="/lookbook" tone="black">Enter the lookbook <ArrowRight size={16} /></BubbleButton><span>More looks, less lurking.</span></div></div></section>
    <section className="newsletter-section"><div className="newsletter-paper"><Tape className="newsletter-tape" /><span className="newsletter-spark" aria-hidden="true">✦</span><p className="newsletter-kicker">FIRST TO THE GOOD HAIR</p><h2>Join the <span>Brat Pack</span></h2><p>New wig drops, hair notes, and just enough gossip.</p><form onSubmit={submitSignup} className="newsletter-form"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="your@email.com" /><button type="submit">Count me in <ArrowRight size={16} /></button></form>{signupMessage && <p className="newsletter-feedback" role="status">{signupMessage}</p>}<span className="newsletter-foot">NO SPAM. WE HAVE STANDARDS.</span></div></section>
  </SiteShell>;
}

function Marquee() {
  const words = "BUILD YOUR WIG ✦ BRATTY BY DESIGN ✦ YOUR CROWN, DELIVERED ✦";
  return <div className="marquee-strip" aria-label="Wigs, bratty by design"><div className="marquee-strip__track" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <span key={index}>{words}</span>)}</div></div>;
}

function CategoryCard({ href, index, title, note, preset, tone, label }: { href: string; index: string; title: string; note: string; preset: string; tone: string; label: string }) {
  return <Link href={href} className={`category-card category-card--${tone}`}><span className="category-card__index">{index} / 03</span><LookArt preset={preset} className="category-art" /><div className="category-card__sticker"><span>{label}</span><h3>{title}</h3></div><p>{note}</p><ArrowRight className="category-card__arrow" size={20} /></Link>;
}

function Benefit({ icon, number, title, copy }: { icon: ReactNode; number: string; title: string; copy: string }) {
  return <article className="benefit-note"><span className="benefit-note__icon">{icon}</span><span className="benefit-note__number">{number}</span><h3>{title}</h3><p>{copy}</p><span className="benefit-note__star" aria-hidden="true">✧</span></article>;
}

function Review({ note, author, tilt, tone }: { note: string; author: string; tilt: string; tone: string }) {
  return <blockquote className={`review-note review-note--${tone}`} style={{ "--note-tilt": tilt } as CSSProperties}><Tape /><span className="review-note__quote">“</span><p>{note}</p><footer>— {author}</footer><span className="review-note__heart" aria-hidden="true">♡</span></blockquote>;
}

function SocialTile({ preset, label, tilt }: { preset: string; label: string; tilt: string }) {
  return <Link href="/build" className="social-tile" style={{ "--tile-tilt": tilt } as CSSProperties}><LookArt preset={preset} className="social-art" label={label.toLowerCase()} /><span>{label}</span></Link>;
}
