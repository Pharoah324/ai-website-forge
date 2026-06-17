# Real 3D websites — scoping plan

Goal: let generated sites include **interactive WebGL 3D** (rotatable models, immersive
hero scenes) like "Build a 3D website with AI" products — not just the CSS depth/motion
already shipped (gradients, glass, 3D-tilt cards, parallax-ish motion).

## The honest hard part
Rendering 3D in the browser is solved. The real challenge is **sourcing an on-topic 3D
asset per business**. There is no reliable way today to *generate* a bespoke, optimized,
on-brand 3D scene from a text prompt. So the feature's value hinges on the asset strategy,
not the renderer. Plan around that.

## Options (renderer)
| Approach | What it is | Pros | Cons |
|---|---|---|---|
| **Spline embed** | iframe/`<spline-viewer>` of a designer-made scene URL | Easiest; interactive; looks premium | Needs a Spline scene per use; iframe weight; external dep |
| **`<model-viewer>` (glTF/GLB)** | Google web component for 3D models | Drop-in, AR-capable, self-hostable assets | Single model, not full scenes; need glTF assets |
| **React Three Fiber (Three.js)** | Full custom WebGL in-renderer | Most powerful/flexible | Heaviest build + perf/maintenance burden |

## Asset-sourcing strategy (the deciding factor)
1. **Curated library, AI-picked (recommended first):** ship ~15-30 royalty-free GLB models /
   Spline scenes tagged by industry+concept (e.g. restaurant→plated-dish, saas→abstract-orb,
   fitness→dumbbell, realestate→house). The generator picks the best match by prompt, same
   pattern as the style engine. Predictable, fast, no per-site cost.
2. **Spline community / user-supplied URL:** let agencies paste a Spline scene URL per site
   (power-user / white-label). Cheap to support, unbounded quality.
3. **Generated 3D (future):** text→3D APIs exist but quality/latency/cost aren't production-ready
   for hero use yet. Revisit later.

## Recommended phased build
- **Phase A — Spline hero embed (smallest real-3D step):**
  - Schema: add optional `scene` to hero/section: `{ provider: "spline", url, poster }`.
  - Renderer: a `Scene3D` component — lazy-load `@splinetool/viewer`, render `<spline-viewer>`
    with the URL; show `poster` image until loaded; **fall back to the normal image hero** if
    WebGL unsupported, on mobile-data, or load fails.
  - Generator: only set `scene` when a curated match exists for the industry; otherwise omit
    (graceful — site stays 2D). Seed a small curated Spline-URL map by category.
- **Phase B — `<model-viewer>` product/object models** for e-commerce/product/menswear
  (rotatable product, optional AR), same curated-library + fallback pattern.
- **Phase C — evaluate React Three Fiber** only if A/B prove demand for custom scenes.

## Cross-cutting requirements
- **Performance/mobile:** lazy-load + IntersectionObserver (only init when in view); poster-first;
  cap to one heavy scene per page; respect `prefers-reduced-motion` and Save-Data.
- **Graceful degradation:** every 3D path MUST fall back to the current image/gradient hero so a
  WebGL failure never white-screens (consistent with the shared-renderer robustness rules).
- **SSR/SSG:** 3D viewers are client-only — dynamic import, no SSR; keep the published-page render safe.
- **Licensing:** only ship assets cleared for commercial/redistribution (this is a paid SaaS).

## Open questions for product
- Which industries get 3D by default vs. opt-in?
- Spline (scenes) vs. model-viewer (objects) as the first bet — or both, by industry?
- Budget/appetite for building & licensing the curated asset library (the real cost center).

## Status
CSS depth/motion is shipped (style engine + Phase 3). This 3D layer is **not started** —
scoped here for a deliberate decision. Recommend starting with **Phase A (Spline hero embed +
small curated library)** behind graceful fallback.
