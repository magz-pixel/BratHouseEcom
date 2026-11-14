import { useEffect } from "react";
import { BRATHOUSE_OG_IMAGE_URL, getPageSeo } from "@shared/seo";

export function usePageMeta(pathname: string) {
  useEffect(() => {
    const seo = getPageSeo(pathname);
    if (!seo) return;
    document.title = seo.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = seo.description;
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = seo.title;
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = seo.description;
    const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    if (ogImage) ogImage.content = seo.image || BRATHOUSE_OG_IMAGE_URL;
    const twitterCard = document.querySelector<HTMLMetaElement>('meta[name="twitter:card"]');
    if (twitterCard) twitterCard.content = "summary_large_image";
    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = seo.title;
    const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.content = seo.description;
    const twitterImage = document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.content = seo.image || BRATHOUSE_OG_IMAGE_URL;
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (seo.noindex && !robots) {
      const tag = document.createElement("meta");
      tag.name = "robots";
      tag.content = "noindex,follow";
      document.head.append(tag);
    } else if (!seo.noindex && robots?.content.includes("noindex")) {
      robots.remove();
    }
  }, [pathname]);
}
