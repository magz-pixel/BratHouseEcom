/**
 * Business settings the owners must confirm before launch.
 * Replace the placeholders, nothing else in the code needs to change.
 */
export const BUSINESS = {
  /** WhatsApp ordering number in international format, digits only (e.g. 27821234567). PLACEHOLDER. */
  whatsappNumber: "27000000000",
  whatsappIsPlaceholder: true,
  instagram: "@brathousehair",
  /** Social profile links. PLACEHOLDER until the handles are confirmed. */
  instagramUrl: "https://www.instagram.com/",
  tiktokUrl: "https://www.tiktok.com/",
  /** Share-card image used for SEO/Open Graph. Still hosted on Manus; move to our own host before launch. */
  ogImageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663950849015/PPYALSXkyUTjnXbE.webp",
  /** Public site address shown on share cards. PLACEHOLDER until the domain is bought. */
  displayDomain: "brathouse.co.za",
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
