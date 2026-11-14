import { wigProducts } from "./catalog";
import { formatMoney } from "./money";

export type PageSeo = { title: string; description: string; body: string; image?: string; noindex?: boolean; status?: number };

export const BRATHOUSE_OG_IMAGE_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663950849015/PPYALSXkyUTjnXbE.webp";

export const pageSeo: Record<string, PageSeo> = {
  "/": { title: "BRATHOUSE — Wigs", description: "Ten listed wig styles with bratty Y2K energy, priced in South African rand.", body: "Shop BRATHOUSE wigs, browse exact listed product details, and see each price in South African rand (R). Availability, shipping and payment need confirmation." },
  "/shop/wigs": { title: "Shop Wigs — BRATHOUSE", description: "Browse ten BRATHOUSE wig styles in South African rand, including bob, straight, body wave, curly and Afro kinky looks.", body: "Explore the ten listed wigs by length, lace, texture, color, density and construction. Prices display in South African rand (R). Stock, availability and shipping have not been supplied." },
  "/shop/bundles": { title: "Shop Wigs — BRATHOUSE", description: "This retired shop path redirects to the current BRATHOUSE wig catalog.", body: "The current catalog contains the ten listed wig styles. This legacy URL does not offer a bundle catalog.", noindex: true },
  "/build": { title: "Build Your Wig — BRATHOUSE Custom Wig Studio", description: "Design your own wig: lace, texture, length, color, density, hairline and extras. Live preview, live Rand price, order on WhatsApp.", body: "Build a custom BRATHOUSE wig step by step with a live preview and live price in South African rand, then share it or send it to us on WhatsApp." },
  "/lookbook": { title: "BRATHOUSE Lookbook — Hair With Main-Character Energy", description: "Wig campaign imagery with big hair energy from the BRATHOUSE lookbook.", body: "Browse a collage of illustrative hair campaign imagery. Demo photos are not a real customer portfolio." },
  "/about": { title: "About BRATHOUSE — Bratty by Design", description: "Meet the idea behind BRATHOUSE: loud hair, fearless glam and absolutely no shrinking yourself.", body: "The BRATHOUSE story is told zine-style. Founder portrait and story details are illustrative placeholders until the owner supplies the real story and portrait." },
  "/faq": { title: "BRATHOUSE FAQ — Wigs, Lace & Care", description: "Quick answers about listed wig textures, lace choices, care and Rand pricing.", body: "Find answers about wig textures, lace, hair care, listed prices in South African rand, shipping and payment setup." },
  "/contact": { title: "Contact BRATHOUSE — Slide Into the Inbox", description: "Questions about a listed wig? Find BRATHOUSE contact information and send a note.", body: "Contact details are placeholders. No message is submitted until verified business contact information is added." },
  "/shipping": { title: "Shipping & Returns — BRATHOUSE", description: "Shipping and return information for your BRATHOUSE wig order.", body: "Review shipping and returns information. Shipping costs, destinations and policy copy must be confirmed by the owner before sale." },
  "/care": { title: "Hair Care Guide — BRATHOUSE", description: "Keep your wig looking fresh with the BRATHOUSE hair-care guide.", body: "Simple care advice for wigs. Product-specific care should follow the supplier's verified guidance." },
  "/checkout": { title: "Checkout — BRATHOUSE", description: "Review your BRATHOUSE wig basket, Rand total and payment setup status.", body: "Review basket contents and listed prices in South African rand. Shipping and tax are not included. Payment provider setup is deferred; no payment can be taken here." },
  "/order/preview": { title: "Order Confirmation Preview — BRATHOUSE", description: "A preview of the BRATHOUSE order-confirmation design.", body: "This is a visual order-confirmation preview only. No order has been placed and no payment was taken.", noindex: true },
};

export function normalizePagePath(pathname: string) {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return path;
}

export function getPageSeo(pathname: string): PageSeo | null {
  const path = normalizePagePath(pathname);
  if (pageSeo[path]) return pageSeo[path];
  if (path.startsWith("/product/")) {
    const slug = path.slice("/product/".length);
    const product = wigProducts.find((item) => item.slug === slug);
    if (!product) return { title: "Wig not found — BRATHOUSE", description: "This BRATHOUSE product listing could not be found.", body: "That style is not in the current supplier-provided catalog. Browse the wig shop to choose another listed style.", image: BRATHOUSE_OG_IMAGE_URL, noindex: true, status: 404 };
    const attributes = [product.grade, `${product.length}-inch`, product.texture.toLowerCase(), product.color.toLowerCase(), `${product.lace} lace`, product.density ? `${product.density}% density` : null, product.glueless ? "glueless" : null].filter(Boolean).join(" ");
    const densityNote = product.density ? ` Density: ${product.density}%.` : " Density was not listed.";
    const gluelessNote = product.glueless ? " Glueless construction." : " Construction details are shown as listed.";
    return { title: `${product.name} — BRATHOUSE`, description: `${product.name}, listed at ${formatMoney(product.price)}. ${attributes}.`, body: `${product.name} is listed at ${formatMoney(product.price)} in South African rand. Specifications: ${product.grade} grade, ${product.length}-inch ${product.texture.toLowerCase()}, ${product.color.toLowerCase()}, ${product.lace} lace.${densityNote}${gluelessNote} Availability and shipping have not been supplied. The model image is AI-generated illustrative artwork, not a verified supplier photo; actual hair may vary.`, image: BRATHOUSE_OG_IMAGE_URL };
  }
  if (path === "/cart") return { title: "Your Cart — BRATHOUSE", description: "Your saved BRATHOUSE wigs with totals in South African rand.", body: "Review quantities and promo code. Shipping and tax are not included in the displayed Rand total." };
  if (path.startsWith("/order/")) return { title: "Order Status — BRATHOUSE", description: "View the current status of a BRATHOUSE order.", body: "No completed order exists from this preview. Payment setup is deferred.", noindex: true };
  return { title: "Page not found — BRATHOUSE", description: "That BRATHOUSE page could not be found. Head back to the wig shop.", body: "This page is not part of the current BRATHOUSE storefront. Browse wigs or the lookbook.", image: BRATHOUSE_OG_IMAGE_URL, noindex: true, status: 404 };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] || character);
}

export function renderSeoFallback(page: PageSeo) {
  return `<main class="seo-prerender"><a class="seo-prerender__brand" href="/">BRATHOUSE <span>WIGS</span></a><h1>${escapeHtml(page.title.replace(/ — BRATHOUSE$/, ""))}</h1><p>${escapeHtml(page.description)}</p><p>${escapeHtml(page.body)}</p><nav aria-label="BRATHOUSE pages"><a href="/shop/wigs">Shop wigs</a><a href="/lookbook">Lookbook</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/shipping">Shipping &amp; returns</a><a href="/care">Care guide</a></nav></main>`;
}

export function injectSeoHtml(template: string, page: PageSeo, canonicalUrl?: string) {
  const safeTitle = escapeHtml(page.title);
  const safeDescription = escapeHtml(page.description);
  const image = escapeHtml(page.image || BRATHOUSE_OG_IMAGE_URL);
  const meta = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDescription}">`,
    `<meta name="keywords" content="wigs, lace front wigs, South African wigs, BRATHOUSE">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="BRATHOUSE">`,
    `<meta property="og:title" content="${safeTitle}">`,
    `<meta property="og:description" content="${safeDescription}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${safeTitle}">`,
    `<meta name="twitter:description" content="${safeDescription}">`,
    `<meta name="twitter:image" content="${image}">`,
    ...(canonicalUrl ? [`<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`] : []),
    ...(page.noindex ? [`<meta name="robots" content="noindex,follow">`] : []),
  ].join("\n    ");
  let html = template.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
  html = html.replace(/<meta\s+name="keywords"[^>]*>/i, "");
  html = html.replace("</head>", `    ${meta}\n  </head>`);
  const fallback = renderSeoFallback(page);
  html = html.replace('<div id="root"></div>', `${fallback}\n    <div id="root"></div>`);
  return html;
}
