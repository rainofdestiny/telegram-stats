// src/components/social/ReplyGraph.tsx
import React, { useEffect, useRef } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import type { Node, Link } from "../../types";

export interface ReplyGraphProps {
  data: { nodes: Node[]; links: Link[] };
}

export default function ReplyGraph({ data }: ReplyGraphProps) {
  const ref = useRef<ForceGraphMethods>();

  useEffect(() => {
    if (!ref.current) return;
    // ослабляем притяжение и увеличиваем отталкивание
    // @ts-ignore — доступ к внутренней силе
    ref.current.d3Force("charge")?.strength(-220);
    // @ts-ignore
    ref.current.d3Force("link")?.distance(80);
  }, [data]);

  return (
    <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="hdr">🤝 Социальные связи по реплаям</div>
      </div>

      <div className="w-full h-[420px] overflow-hidden rounded-xl border border-white/10">
        <ForceGraph2D
          ref={ref as any}
          graphData={data}
          backgroundColor="#0a0a15"
          nodeRelSize={4}
          nodeLabel={(n: any) => n.name}
          linkColor={() => "rgba(168, 85, 247, 0.6)"} // purple-500/60
          linkDirectionalParticles={0}
          linkWidth={(l: any) =>
            Math.max(1, Math.log10((l.value ?? 1) + 1) * 2)
          }
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D) => {
            const r = 4;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = "#a855f7"; // purple-500
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#a855f7";
            ctx.fill();
            ctx.shadowBlur = 0;

            const label = node.name ?? node.id;
            ctx.font = "12px Inter, system-ui, sans-serif";
            ctx.fillStyle = "#e5e7eb"; // gray-200
            ctx.fillText(label, node.x + 6, node.y + 4);
          }}
          onNodeClick={(n: any) => {
            if (!ref.current) return;
            const distance = 60;
            const distRatio = 1 + distance / Math.hypot(n.x || 1, n.y || 1);
            // smooth zoom-pan to node
            // @ts-ignore
            ref.current.centerAt(n.x * distRatio, n.y * distRatio, 600);
            // @ts-ignore
            ref.current.zoom(2, 600);
          }}
        />
      </div>
    </div>
  );
}
