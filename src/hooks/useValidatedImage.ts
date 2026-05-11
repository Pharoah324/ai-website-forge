import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ImageOrientation = "landscape" | "portrait" | "squarish";

// Curated, last-resort Unsplash CDN photo IDs by orientation. Served
// directly from images.unsplash.com — no API key required. Used when
// the unsplash-search edge function is unavailable or also returns
// nothing for the query.
const LAST_RESORT: Record<ImageOrientation, string[]> = {
  landscape: [
    "1497366216548-37526070297c",
    "1497366754035-f200968a6e72",
    "1486406146926-c627a92ad1ab",
    "1454165804606-c3d57bc86b40",
    "1517048676732-d65bc937f952",
  ],
  portrait: [
    "1519415510236-718bdfcd89c8",
    "1507003211169-0a1dd7228f2d",
    "1521572163474-6864f9cf17ab",
  ],
  squarish: [
    "1531746020798-e6953c6e8e04",
    "1535713875002-d1d0cf377fde",
    "1500648767791-00dcc994a43e",
  ],
};

function lastResortUrl(orientation: ImageOrientation, idx: number): string {
  const ids = LAST_RESORT[orientation] || LAST_RESORT.landscape;
  const id = ids[Math.abs(idx) % ids.length];
  const dim =
    orientation === "squarish"
      ? "w=800&h=800"
      : orientation === "portrait"
      ? "w=900&h=1200"
      : "w=1600&h=1000";
  return `https://images.unsplash.com/photo-${id}?${dim}&fit=crop&auto=format&q=80`;
}

// Deduplicate parallel refetches for the same query so a row of broken
// gallery cards doesn't fan out into N identical Unsplash calls.
const inflight = new Map<string, Promise<{ regular?: string; alt?: string } | null>>();

async function fetchReplacement(
  query: string,
  orientation: ImageOrientation,
): Promise<{ regular?: string; alt?: string } | null> {
  const key = `${orientation}::${query}`;
  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("unsplash-search", {
        body: { query, orientation },
      });
      if (error) return null;
      const r = (data as { result?: { regular?: string; alt?: string } } | null)?.result;
      if (r?.regular) return r;
      return null;
    } catch {
      return null;
    } finally {
      // Small delay so a burst of errors still shares the result, but
      // allow a fresh attempt later if the user re-renders.
      setTimeout(() => inflight.delete(key), 5_000);
    }
  })();
  inflight.set(key, p);
  return p;
}

export type UseValidatedImageOptions = {
  initial?: string;
  query: string;
  orientation?: ImageOrientation;
  /** Preload via new Image() so background-image users can also self-heal. */
  preload?: boolean;
  /** Stable index used to spread out last-resort fallbacks. */
  fallbackIndex?: number;
};

export type UseValidatedImageResult = {
  src?: string;
  alt?: string;
  /** Wire to <img onError={}> for foreground images. */
  onError: () => void;
  /** "ok" once an image has loaded (or initial src verified via preload). */
  status: "pending" | "ok" | "broken";
};

const MAX_ATTEMPTS = 2;

export function useValidatedImage(opts: UseValidatedImageOptions): UseValidatedImageResult {
  const { initial, query, orientation = "landscape", preload, fallbackIndex = 0 } = opts;
  const [src, setSrc] = useState<string | undefined>(initial);
  const [alt, setAlt] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<"pending" | "ok" | "broken">(initial ? "pending" : "broken");
  const attemptsRef = useRef(0);
  const triedSrcRef = useRef<Set<string>>(new Set());

  const heal = useCallback(async () => {
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      // give up and use a curated CDN fallback
      const url = lastResortUrl(orientation, fallbackIndex + attemptsRef.current);
      attemptsRef.current++;
      setSrc(url);
      setStatus("pending");
      return;
    }
    attemptsRef.current++;
    const r = await fetchReplacement(query, orientation);
    if (r?.regular && !triedSrcRef.current.has(r.regular)) {
      triedSrcRef.current.add(r.regular);
      setSrc(r.regular);
      if (r.alt) setAlt(r.alt);
      setStatus("pending");
      return;
    }
    const url = lastResortUrl(orientation, fallbackIndex + attemptsRef.current);
    setSrc(url);
    setStatus("pending");
  }, [query, orientation, fallbackIndex]);

  // Optional preload validation — important for background-image users
  // where the browser doesn't fire onError on a CSS background.
  useEffect(() => {
    if (!preload || !src) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setStatus("ok"); };
    img.onerror = () => { if (!cancelled) { setStatus("broken"); heal(); } };
    img.src = src;
    return () => { cancelled = true; };
  }, [src, preload, heal]);

  const onError = useCallback(() => {
    setStatus("broken");
    void heal();
  }, [heal]);

  return { src, alt, onError, status };
}
