import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

// Stores the original English text for each text node so we can restore on lang change.
const ORIGINAL = new WeakMap<Text, string>();
// Per-language translation cache (in-memory + localStorage).
const memCache: Record<string, Map<string, string>> = {};

function loadCache(lang: string): Map<string, string> {
  if (memCache[lang]) return memCache[lang];
  const m = new Map<string, string>();
  try {
    const raw = localStorage.getItem(`veb_tx_${lang}`);
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) m.set(k, v);
    }
  } catch { /* noop */ }
  memCache[lang] = m;
  return m;
}

function persistCache(lang: string) {
  const m = memCache[lang];
  if (!m) return;
  try {
    const obj: Record<string, string> = {};
    // Cap localStorage size by trimming to 4000 entries
    let i = 0;
    for (const [k, v] of m) {
      if (i++ > 4000) break;
      obj[k] = v;
    }
    localStorage.setItem(`veb_tx_${lang}`, JSON.stringify(obj));
  } catch { /* noop */ }
}

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT",
  "SVG", "PATH", "CANVAS", "IFRAME",
]);

function shouldSkip(node: Node): boolean {
  let p: Node | null = node.parentNode;
  while (p) {
    if (p.nodeType === 1) {
      const el = p as HTMLElement;
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.getAttribute("data-no-translate") === "true") return true;
      if (el.getAttribute("contenteditable") === "true") return true;
    }
    p = p.parentNode;
  }
  return false;
}

function collectTextNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const t = (n as Text).data;
      if (!t || !t.trim()) return NodeFilter.FILTER_REJECT;
      // Skip pure whitespace, numbers, symbols
      if (!/[\p{L}]/u.test(t)) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(n)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((n = walker.nextNode())) out.push(n as Text);
  return out;
}

async function translateBatch(texts: string[], target: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.functions.invoke("translate-batch", {
      body: { texts, target },
    });
    if (error) throw error;
    const arr = (data as { translations?: string[] })?.translations;
    if (Array.isArray(arr) && arr.length === texts.length) return arr;
  } catch (e) {
    console.warn("[translate-batch] failed", e);
  }
  return texts;
}

let runningFor: string | null = null;

async function translateAll(target: string) {
  if (runningFor === target) return;
  runningFor = target;
  try {
    const cache = loadCache(target);
    const nodes = collectTextNodes(document.body);
    if (nodes.length === 0) return;

    // Capture originals
    for (const node of nodes) {
      if (!ORIGINAL.has(node)) ORIGINAL.set(node, node.data);
    }

    if (target === "en") {
      for (const node of nodes) {
        const orig = ORIGINAL.get(node);
        if (orig != null && node.data !== orig) node.data = orig;
      }
      return;
    }

    // Apply cached, collect uncached
    const uncached: { node: Text; text: string; key: string }[] = [];
    for (const node of nodes) {
      const orig = ORIGINAL.get(node)!;
      const key = orig.trim();
      const cached = cache.get(key);
      if (cached != null) {
        const lead = orig.match(/^\s*/)?.[0] ?? "";
        const trail = orig.match(/\s*$/)?.[0] ?? "";
        const next = lead + cached + trail;
        if (node.data !== next) node.data = next;
      } else {
        uncached.push({ node, text: orig, key });
      }
    }

    // Batch translate uncached, deduped
    const uniqueKeys = Array.from(new Set(uncached.map((u) => u.key)));
    const BATCH = 40;
    for (let i = 0; i < uniqueKeys.length; i += BATCH) {
      if (runningFor !== target) return; // language changed mid-flight
      const slice = uniqueKeys.slice(i, i + BATCH);
      const out = await translateBatch(slice, target);
      slice.forEach((k, idx) => cache.set(k, out[idx] ?? k));
      // Apply translations for any node whose key is in this slice
      const sliceSet = new Set(slice);
      for (const u of uncached) {
        if (!sliceSet.has(u.key)) continue;
        const orig = ORIGINAL.get(u.node);
        if (orig == null) continue;
        const lead = orig.match(/^\s*/)?.[0] ?? "";
        const trail = orig.match(/\s*$/)?.[0] ?? "";
        const tx = cache.get(u.key) ?? u.key;
        const next = lead + tx + trail;
        if (u.node.data !== next) u.node.data = next;
      }
      persistCache(target);
    }
  } finally {
    if (runningFor === target) runningFor = null;
  }
}

let observer: MutationObserver | null = null;
let scheduled: number | null = null;

function scheduleRetranslate(target: string) {
  if (scheduled != null) return;
  scheduled = window.setTimeout(() => {
    scheduled = null;
    translateAll(target);
  }, 250);
}

export function usePageTranslator() {
  const { lang } = useI18n();

  useEffect(() => {
    // Disconnect any prior observer
    observer?.disconnect();
    observer = null;
    runningFor = null;

    // Always run once for the chosen language (en will restore originals)
    translateAll(lang);

    if (lang === "en") return;

    observer = new MutationObserver((mutations) => {
      let needs = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length) { needs = true; break; }
        if (m.type === "characterData") { needs = true; break; }
      }
      if (needs) scheduleRetranslate(lang);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer?.disconnect();
      observer = null;
    };
  }, [lang]);
}
