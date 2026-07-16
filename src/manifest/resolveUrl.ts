// Substitutes the manifest's ${CLOUDFRONT_DOMAIN} template with the local
// static-server base URL, per handoff §7 (.env.local / LOCAL_ASSET_BASE_URL).
const TEMPLATE_TOKEN = "${CLOUDFRONT_DOMAIN}";

export function resolveAssetUrl(templatedUrl: string): string {
  const base = import.meta.env.LOCAL_ASSET_BASE_URL;
  if (!base) {
    throw new Error(
      "LOCAL_ASSET_BASE_URL is not set — copy .env.local.example to .env.local",
    );
  }
  if (!templatedUrl.includes(TEMPLATE_TOKEN)) {
    return templatedUrl;
  }
  return templatedUrl.replace(TEMPLATE_TOKEN, base);
}
