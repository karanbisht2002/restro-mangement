/**
 * Dynamically updates the document's favicon tag.
 * Works seamlessly with data URLs, uploaded image URLs, or hosted web links.
 */
export function setDocumentFavicon(url?: string | null): void {
  if (typeof document === "undefined") return;
  const href = url?.trim();
  if (!href) return;

  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
}
