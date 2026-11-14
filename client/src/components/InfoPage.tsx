import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteShell } from "@/components/SiteShell";
import { BubbleButton, SectionEyebrow } from "@/components/StickerUI";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function InfoPage({ path, eyebrow, title, intro, children, accent = "pink" }: { path: string; eyebrow: string; title: ReactNode; intro: string; children: ReactNode; accent?: "pink" | "orange" | "chrome" }) {
  usePageMeta(path);
  return <SiteShell><section className={`info-hero info-hero--${accent}`}><div className="container"><SectionEyebrow>{eyebrow}</SectionEyebrow><h1 className="display-title info-hero__title">{title}</h1><p className="info-hero__intro">{intro}</p><div className="info-hero__crumb"><Link href="/">Home</Link><span> / </span><span>{eyebrow}</span></div></div></section><div className="info-body container">{children}<div className="info-bottom-cta"><div><h2>Need the hair tea?</h2><p>Ask us before the plot thickens.</p></div><BubbleButton href="/faq" tone="black">Read the FAQ <ArrowRight size={16} /></BubbleButton></div></div></SiteShell>;
}
