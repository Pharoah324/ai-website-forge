// SSR/SSG polyfills must run BEFORE importing modules that touch browser globals
// at evaluation time (e.g. supabase-js reads `localStorage` when constructing the client).
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  // @ts-ignore - polyfill for Node SSG
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
}

import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./App";
import "./index.css";

// Marketing/public routes are pre-rendered at build time via ssgOptions in
// vite.config.ts. /app/* and /admin/* stay client-only (require auth/session).
export const createRoot = ViteReactSSG(
  { routes, basename: "/" },
  () => {},
);
