import { useState } from "react";
import { Sparkles } from "lucide-react";

export type Cluster = { pillar: string; posts: string[] };

export function ClusterMap({ clusters, onGenerate }: { clusters: Cluster[]; onGenerate?: (topic: string) => void }) {
  const [active, setActive] = useState<{ topic: string; x: number; y: number } | null>(null);
  if (!clusters || clusters.length === 0) {
    return <p className="text-sm text-white/40">No content clusters yet.</p>;
  }

  // Build mind-map: central pillar = first cluster's pillar; show all pillars as primary nodes; posts radiate.
  const w = 900, h = 560, cx = w / 2, cy = h / 2;
  const N = clusters.length;
  const pillarR = 200;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 700 }}>
        {/* center node */}
        <defs>
          <radialGradient id="coreGlow">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r="90" fill="url(#coreGlow)" />
        <circle cx={cx} cy={cy} r="48" fill="#0E1A2B" stroke="#10B981" strokeWidth="1.5" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">Topical</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#10B981" fontSize="11" fontWeight="600">Authority</text>

        {clusters.map((c, i) => {
          const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(angle) * pillarR;
          const py = cy + Math.sin(angle) * pillarR;
          const postR = 110;
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={px} y2={py} stroke="rgba(16,185,129,0.35)" strokeWidth="1.5" />
              <g
                onClick={() => setActive({ topic: c.pillar, x: px, y: py })}
                className="cursor-pointer"
              >
                <circle cx={px} cy={py} r="38" fill="rgba(16,185,129,0.12)" stroke="#10B981" strokeWidth="1" />
                <text x={px} y={py + 3} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
                  {c.pillar.length > 16 ? c.pillar.slice(0, 14) + "…" : c.pillar}
                </text>
              </g>
              {c.posts.slice(0, 4).map((p, j) => {
                const sub = (j / 4) * Math.PI - Math.PI / 2 + angle;
                const sx = px + Math.cos(sub) * postR;
                const sy = py + Math.sin(sub) * postR;
                return (
                  <g key={j} onClick={() => setActive({ topic: p, x: sx, y: sy })} className="cursor-pointer">
                    <line x1={px} y1={py} x2={sx} y2={sy} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <circle cx={sx} cy={sy} r="5" fill="#0E1A2B" stroke="#84CC16" strokeWidth="1" />
                    <text x={sx + 8} y={sy + 3} fill="rgba(255,255,255,0.7)" fontSize="9">
                      {p.length > 26 ? p.slice(0, 24) + "…" : p}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {active && (
        <div
          className="absolute z-10 max-w-xs rounded-md border border-white/10 bg-[#0E1A2B] p-3 shadow-2xl"
          style={{ left: `min(${(active.x / w) * 100}%, calc(100% - 280px))`, top: (active.y / h) * 560 + 30 }}
        >
          <div className="text-[10px] uppercase tracking-wider text-emerald-400">Cluster node</div>
          <div className="mt-1 text-sm font-semibold text-white">{active.topic}</div>
          <button
            onClick={() => { onGenerate?.(active.topic); setActive(null); }}
            className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400"
          >
            <Sparkles className="h-3 w-3" /> Generate this page
          </button>
          <button onClick={() => setActive(null)} className="ml-2 text-xs text-white/40 hover:text-white/70">close</button>
        </div>
      )}
    </div>
  );
}
