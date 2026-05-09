import { defineConfig } from "vite";
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

// Public Lovable Cloud credentials for this project. These values are safe to ship
// in the browser and intentionally pin Vite's build output so external hosts can't
// accidentally mix this project's URL with a publishable key from another project.
const SUPABASE_PROJECT_ID = "idnyrmdhdfyxdrvyjirj";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbnlybWRoZGZ5eGRydnlqaXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1Njc1NDgsImV4cCI6MjA5MzE0MzU0OH0.KYkIrbVUWHYDq5YHxOkd-TcIYzrMM_Kg4hs_5a8uJiA";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(SUPABASE_PROJECT_ID),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  // Consumed by `vite-react-ssg build` — restricts pre-rendering to public marketing pages.
  // Consumed by `vite-react-ssg build` — restricts pre-rendering to public marketing pages.
  ssgOptions: {
    script: "async",
    formatting: "minify",
    mock: true,
    includedRoutes: (paths: string[]) => paths.filter((p) => PRERENDER.has(p)),
  },
} as any));
