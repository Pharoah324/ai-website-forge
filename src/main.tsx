import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import "./index.css";

// Pre-render ONLY marketing/public routes. All /app/* and /admin/* stay
// client-only (require auth/session and would crash without window/Supabase).
const PRERENDER = new Set<string>([
  "/",
  "/auth",
  "/affiliates",
  "/affiliates/es",
  "/affiliates/pt",
]);

export const createRoot = ViteReactSSG(
  {
    routes,
    basename: "/",
  },
  () => {},
  {
    rootContainer: "#root",
    includedRoutes: (paths) => paths.filter((p) => PRERENDER.has(p)),
  },
);
