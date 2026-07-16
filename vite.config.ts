import { defineConfig } from "vite";

// LOCAL_ASSET_BASE_URL (no VITE_ prefix, per .env.local.example) must be
// explicitly whitelisted to reach import.meta.env in client code.
export default defineConfig({
  envPrefix: ["VITE_", "LOCAL_"],
});
