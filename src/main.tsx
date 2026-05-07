import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import "./index.css";

// Marketing/public routes are pre-rendered at build time via ssgOptions in
// vite.config.ts. /app/* and /admin/* stay client-only (require auth/session).
export const createRoot = ViteReactSSG(
  { routes, basename: "/" },
  () => {},
);
