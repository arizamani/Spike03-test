import { manifest } from "../manifest/manifest";
import { resolveAssetUrl } from "../manifest/resolveUrl";

// Renders the manifest's primary asset fallback_image_url — never a blank
// page (handoff §4/§7.3). Missing fallback_image_url, or the image itself
// failing to load, degrades to a text fallback instead of blank.
export function renderFallback(container: HTMLElement): void {
  container.innerHTML = "";
  container.style.display = "flex";

  const primary = manifest.assets.find((a) => a.role === "primary");
  const imageUrl = primary?.fallback_image_url ? resolveAssetUrl(primary.fallback_image_url) : undefined;

  if (imageUrl) {
    const img = document.createElement("img");
    img.alt = "3D preview unavailable — static image fallback";
    img.onerror = () => {
      img.remove();
      renderTextFallback(container);
    };
    img.src = imageUrl;
    container.appendChild(img);
  } else {
    renderTextFallback(container);
  }

  const caption = document.createElement("div");
  caption.textContent = "3D view isn't available on this device/browser — showing a static preview.";
  container.appendChild(caption);
}

function renderTextFallback(container: HTMLElement): void {
  const text = document.createElement("div");
  text.textContent = "3D preview unavailable and no fallback image is configured for this product.";
  container.prepend(text);
}
