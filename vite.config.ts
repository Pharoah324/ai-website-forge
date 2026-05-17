import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const PRERENDER = new Set<string>([
  "/",
  "/auth",
  "/affiliates",
  "/affiliates/es",
  "/affiliates/pt",
]);

const DEFAULT_SUPABASE_PROJECT_ID = "idnyrmdhdfyxdrvyjirj";
const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;

// Reject legacy JWT keys (start with "eyJ"); otherwise pass the env value through
// so a rotated publishable key in .env propagates without code changes.
const getSupabasePublishableKey = (value?: string) => {
  const key = value?.trim();
  if (!key || key.startsWith("eyJ")) return undefined;
  return key;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseProjectId = env.VITE_SUPABASE_PROJECT_ID || DEFAULT_SUPABASE_PROJECT_ID;
  const supabaseUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabasePublishableKey =
    getSupabasePublishableKey(env.VITE_SUPABASE_PUBLISHABLE_KEY) ?? "";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: { overlay: false },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supabaseProjectId),
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
    // Consumed by `vite-react-ssg build` — restricts pre-rendering to public marketing pages.
    ssgOptions: {
      script: "async",
      formatting: "minify",
      mock: true,
      includedRoutes: (paths: string[]) => paths.filter((p) => PRERENDER.has(p)),
    },
  } as any;
});
