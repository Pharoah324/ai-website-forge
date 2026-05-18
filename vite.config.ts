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

// Supabase projects may expose either the newer publishable key or the legacy
// anon JWT key. Both are valid browser keys; prefer publishable when present.
const getSupabaseBrowserKey = (env: Record<string, string>) => {
  // Vite's loadEnv only reads .env files. On Vercel, env vars live in process.env,
  // so we must check both sources to avoid an empty key during SSG pre-render.
  const publishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anonKey =
    env.VITE_SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim();
  return publishableKey || anonKey || "";
};

const getSupabaseUrl = (env: Record<string, string>) =>
  env.VITE_SUPABASE_URL?.trim() ||
  process.env.VITE_SUPABASE_URL?.trim() ||
  DEFAULT_SUPABASE_URL;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseProjectId = env.VITE_SUPABASE_PROJECT_ID || DEFAULT_SUPABASE_PROJECT_ID;
  const supabaseUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabasePublishableKey = getSupabaseBrowserKey(env);

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
