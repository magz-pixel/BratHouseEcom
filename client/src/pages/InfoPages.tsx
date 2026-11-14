import { useState, type FormEvent } from "react";
import { ArrowRight, Heart, Instagram, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { faqItems, demoNotice } from "@shared/demoContent";
import { SiteShell } from "@/components/SiteShell";
import InfoPage from "@/components/InfoPage";
import { AccordionList } from "@/components/AccordionList";
import { BubbleButton, PageTag, SectionEyebrow, Sticker, Tape } from "@/components/StickerUI";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LookArt } from "@/components/LookArt";

const lookbookImages = [
  { preset: "boss", label: "SLEEK TALK", caption: "No flat energy." },
  { preset: "curlqueen", label: "CURL CLUB", caption: "A little volume never hurt." },
  { preset: "ginger", label: "COLOR CRUSH", caption: "Copper was a good idea." },
  { preset: "softglam", label: "GLUELESS EDIT", caption: "No glue. No drama." },
  { preset: "icy", label: "MAIN CHARACTER", caption: "The hair gets there first." },
];

export function LookbookPage() {
  usePageMeta("/lookbook");
  return <SiteShell><section className="lookbook-header"><div className="container"><SectionEyebrow icon="◎">THE LOOKBOOK / DEMO EDITION</SectionEyebrow><h1 className="display-title">Caution:<br /><em>heads will turn.</em></h1><p>Wig campaign inspo for your next hair mood.</p><div className="lookbook-stamp"><span>ISSUE 01</span><b>BRAT<br />MAG</b><span>HAIR IS THE ATTITUDE</span></div></div></section><section className="lookbook-grid container">{lookbookImages.map((item, index) => <figure className={`lookbook-photo lookbook-photo--${index % 4}`} key={item.label}><Tape /><div><LookArt preset={item.preset} className="lookbook-art" label={item.label.toLowerCase()} /><span className="lookbook-photo__number">0{index + 1}</span></div><figcaption><span>{item.label}</span><p>{item.caption}</p></figcaption></figure>)}</section><p className="demo-note lookbook-disclaimer">Illustrated preset looks. The real campaign shoot happens when the sample drop lands.</p><section className="lookbook-cta container"><Sticker tone="pink" tilt="-3deg">YOUR TURN, BABE</Sticker><h2>Make the look yours.</h2><BubbleButton href="/build">Build your wig <ArrowRight size={16} /></BubbleButton></section></SiteShell>;
}

export function AboutPage() {
  usePageMeta("/about");
  return <SiteShell><section className="about-hero"><div className="container about-hero__grid"><div className="about-copy"><SectionEyebrow icon="♛">ISSUE 01 / THE BRATHOUSE STORY</SectionEyebrow><h1 className="display-title">We were never<br />here to <em>blend in.</em></h1><p className="about-lede">BRATHOUSE is a love letter to loud hair, fearless glam, and the girls who never asked permission to take up space.</p><div className="about-note"><Tape /><span>THE MANIFESTO</span><p>Good hair is not a quiet hobby. It’s a whole entrance.</p><small>— Brat house rules</small></div><p className="about-body">This zine-style story is a stand-in until the real founder story is supplied. The mission stays simple: wigs for baddies who want their crown to say something.</p><PageTag color="orange">BRATTY BY DESIGN</PageTag></div><div className="about-portrait"><span className="about-portrait__paper" aria-hidden="true" /><LookArt preset="softglam" compact={false} className="about-art" label="Illustration placeholder; replace with the founders' photo" /><span className="about-portrait__caption">A PLACEHOLDER FACE<br />FOR A REAL STORY</span><Sticker tone="chrome" className="about-sticker" tilt="8deg"><Heart size={16} fill="currentColor" /> HAIR FIRST</Sticker></div></div></section><section className="about-values container"><div><span>01</span><h2>Big hair.</h2><p>Volume is a valid personality trait.</p></div><div><span>02</span><h2>Soft heart.</h2><p>Bratty doesn’t mean we don’t care about your crown.</p></div><div><span>03</span><h2>No shrinkage.</h2><p>Take the chair, the camera and the compliments.</p></div></section><p className="demo-note container">Founder portrait and story are illustrative placeholders. Replace them with real owner-approved content.</p></SiteShell>;
}

export function FAQPage() {
  return <InfoPage path="/faq" eyebrow="THE HAIR TEA" title={<>Questions?<br /><em>We got you.</em></>} intro="The quick answers before you pick a crown." accent="orange"><AccordionList items={faqItems} /><div className="faq-assistant-card"><span><Sparkles size={19} /></span><div><h2>Want the short version?</h2><p>Tap “Ask the Brats” for a quick local FAQ. It is a demo guide, not a live stylist.</p></div><BubbleButton onClick={() => document.querySelector<HTMLButtonElement>(".ask-launcher")?.click()} tone="pink">Ask the Brats</BubbleButton></div></InfoPage>;
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const onSubmit = (event: FormEvent) => { event.preventDefault(); setSubmitted(true); };
  return <InfoPage path="/contact" eyebrow="SLIDE INTO THE INBOX" title={<>Talk hair.<br /><em>Talk to us.</em></>} intro="Questions about a listed wig? Send a note." accent="pink"><div className="contact-layout"><form className="contact-form" onSubmit={onSubmit}><label>Your name<input required maxLength={120} placeholder="What should we call you?" /></label><label>Email<input required type="email" maxLength={320} placeholder="you@email.com" /></label><label>What’s the tea?<select defaultValue="product"><option value="product">Product question</option><option value="order">Order help</option><option value="other">Other</option></select></label><label>Your message<textarea required maxLength={1200} rows={5} placeholder="Tell us what you need…" /></label><button className="bubble-button bubble-button--black" type="submit">{submitted ? "Preview generated" : "Preview my message"} <ArrowRight size={16} /></button>{submitted && <p className="form-note" role="status">Demo only—the message was not sent or saved. Add verified BRATHOUSE contact details or connect an inbox before launch.</p>}</form><aside className="contact-note"><Tape /><span className="contact-note__icon">♡</span><h2>Find the Brats</h2><p>Email and social contact details are placeholders until verified by the owner.</p><a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram <ArrowRight size={14} /></a><a href="https://www.tiktok.com/" target="_blank" rel="noreferrer">TikTok <ArrowRight size={14} /></a><small>External links open the generic platform home until real account URLs are added.</small></aside></div></InfoPage>;
}

export function ShippingPage() {
  return <InfoPage path="/shipping" eyebrow="DELIVERY & RETURNS" title={<>Your crown,<br /><em>delivered.</em></>} intro="The shipping basics. Read the demo note before you make plans." accent="chrome"><p className="policy-alert"><strong>Demo policy:</strong> {demoNotice} No order or payment can be placed in this preview.</p><div className="policy-grid"><PolicyCard number="01" title="Shipping time" text="Sample handling and delivery windows are placeholders. Replace with verified processing times, carriers, destinations and shipping costs." /><PolicyCard number="02" title="Tracking" text="A real tracking workflow is not connected in this preview. Add the owner's chosen fulfillment process before launch." /><PolicyCard number="03" title="Returns" text="Eligibility, hygiene seals, return windows and refund timing must match the final owner-approved store policy." /><PolicyCard number="04" title="Questions?" text="Use the Contact page for a message preview. Messages are not transmitted in this demo." /></div><p className="policy-last-updated">Last updated: demo placeholder · Owner review required.</p></InfoPage>;
}

export function CarePage() {
  return <InfoPage path="/care" eyebrow="KEEP IT CUTE" title={<>The hair-care<br /><em>playbook.</em></>} intro="A little care goes a long way. Your supplier's card gets the final word." accent="orange"><div className="care-checklist">{[{n:"01",t:"Detangle gently",d:"Start at the ends, work upward, and use a wide-tooth comb."},{n:"02",t:"Protect the style",d:"Wrap your wig in satin overnight and store it on a stand when you can."},{n:"03",t:"Go easy on heat",d:"Use heat protection and keep tools at a sensible temperature."},{n:"04",t:"Follow your hair's card",d:"Supplier-specific wash and product instructions beat generic tips every time."}].map((item) => <article key={item.n}><span>{item.n}</span><div><h2>{item.t}</h2><p>{item.d}</p></div><Sparkles size={19} /></article>)}</div><div className="care-callout"><span>✦</span><p>Demo care guide only. Check the verified product and supplier instructions for your exact hair type before use.</p></div><Link href="/shop/wigs" className="underlined-link">Find your next style <ArrowRight size={15} /></Link></InfoPage>;
}

function PolicyCard({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="policy-card"><span>{number} / BRAT RULE</span><h2>{title}</h2><p>{text}</p></article>;
}
