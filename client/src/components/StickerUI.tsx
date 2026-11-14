import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from "react";
import { Link } from "wouter";

export function Sticker({ children, tone = "pink", className = "", tilt = "-2deg" }: { children: ReactNode; tone?: "pink" | "orange" | "cream" | "chrome" | "black"; className?: string; tilt?: string }) {
  return <span className={`sticker sticker--${tone} ${className}`} style={{ "--sticker-tilt": tilt } as CSSProperties}>{children}</span>;
}

export function Tape({ className = "" }: { className?: string }) {
  return <span className={`tape-strip ${className}`} aria-hidden="true" />;
}

export function Staple({ className = "" }: { className?: string }) {
  return <span className={`staple-mark ${className}`} aria-hidden="true">╭─╮</span>;
}

export function TornDivider({ label }: { label?: string }) {
  return <div className="torn-divider" role="separator" aria-label={label}><span className="torn-divider__edge" aria-hidden="true" />{label && <span className="torn-divider__label">{label}</span>}</div>;
}

export function SectionEyebrow({ children, icon = "✦" }: { children: ReactNode; icon?: string }) {
  return <p className="section-eyebrow"><span aria-hidden="true">{icon}</span> {children}</p>;
}

export function SectionTitle({ eyebrow, children, sub, className = "" }: { eyebrow?: string; children: ReactNode; sub?: ReactNode; className?: string }) {
  return <div className={`section-title ${className}`}>{eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}<h2 className="display-title">{children}</h2>{sub && <p className="section-title__sub">{sub}</p>}</div>;
}

export function BubbleButton({ children, href, onClick, tone = "pink", className = "", type = "button", disabled, ...props }: { children: ReactNode; href?: string; onClick?: () => void; tone?: "pink" | "orange" | "black" | "cream"; className?: string; type?: ButtonHTMLAttributes<HTMLButtonElement>["type"]; disabled?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `bubble-button bubble-button--${tone} ${className}`;
  if (href) return <Link href={href} className={classes} aria-disabled={disabled} onClick={onClick}>{children}</Link>;
  return <button className={classes} type={type} onClick={onClick} disabled={disabled} {...props}>{children}</button>;
}

export function PageTag({ children, color = "pink" }: { children: ReactNode; color?: "pink" | "orange" | "chrome" }) {
  return <span className={`page-tag page-tag--${color}`}>{children}</span>;
}
