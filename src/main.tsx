import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import "./index.css";

// Pre-render only marketing/public routes at build time.
// All /app/* and /admin/* stay client-only (require auth/session).
export const createRoot = ViteReactSSG(
  {
    routes,
    basename: "/",
  },
  () => {},
  {
    rootContainer: "#root",
  },
);
