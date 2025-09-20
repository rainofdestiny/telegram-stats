// src/components/social/GraphCanvas.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";

type GNode = {
  id: string | number;
  name?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  __deg?: number; // суммарная сила связей (pairWeight cо всеми)
  __r?: number; // визуальный радиус
};

type GLink = {
  source: string | number | GNode;
  target: string | number | GNode;
  weight?: number; // исходный вес (кол-во реплаев по ребру)
  value?: number; // совместимость с вашим типом
  __w?: number; // неориентированная сила пары (a<->b)
};

type Props = {
  data: { nodes: GNode[]; links: GLink[] };
  selectedNodeId?: string | number;
  selectedLink?: { a: string | number; b: string | number };
  onNodeClick: (id: string | number) => void;
  onLinkClick: (a: string | number, b: string | number) => void;
  onBackgroundClick: () => void;
  height?: number;
};

const getId = (x: unknown): string | number =>
  typeof x === "object" && x !== null && "id" in (x as any)
    ? (x as any).id
    : (x as any);

const linkW = (l: GLink) => Number(l.weight ?? l.value ?? 0) || 0;

export default function GraphCanvas({
  data,
  selectedNodeId,
  selectedLink,
  onNodeClick,
  onLinkClick,
  onBackgroundClick,
  height = 560,
}: Props) {
  const fgRef = useRef<ForceGraphMethods<any, any>>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  // авто-ширина контейнера
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 800;
      setWidth(Math.max(320, Math.floor(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // предрасчёты: степени/радиусы узлов и объединённые веса пар
  const { nodes, links, maxNodeDeg, maxPairW } = useMemo(() => {
    const pair = new Map<string, number>(); // key: a|b (a<b)
    for (const l of data.links) {
      const s = getId(l.source);
      const t = getId(l.target);
      const w = linkW(l);
      if (!w) continue;
      const key = s < t ? `${s}|${t}` : `${t}|${s}`;
      pair.set(key, (pair.get(key) ?? 0) + w);
    }

    const linksDecor: GLink[] = data.links.map((l) => {
      const s = getId(l.source);
      const t = getId(l.target);
      const key = s < t ? `${s}|${t}` : `${t}|${s}`;
      const pw = pair.get(key) ?? 0;
      return { ...l, __w: pw };
    });

    // степень узла = сумма pairWeight по всем соседям
    const deg = new Map<string | number, number>();
    for (const l of linksDecor) {
      const s = getId(l.source);
      const t = getId(l.target);
      const w = l.__w ?? 0;
      deg.set(s, (deg.get(s) ?? 0) + w);
      deg.set(t, (deg.get(t) ?? 0) + w);
    }

    const maxNode = Array.from(deg.values()).reduce(
      (m, v) => Math.max(m, v),
      0,
    );
    const nodesDecor: GNode[] = data.nodes.map((n) => {
      const d = deg.get(n.id) ?? 0;
      const r = 6 + 8 * (maxNode > 0 ? Math.min(1, d / maxNode) : 0); // радиус 6..14
      return { ...n, __deg: d, __r: r };
    });

    const maxPW = Array.from(pair.values()).reduce((m, v) => Math.max(m, v), 0);

    return {
      nodes: nodesDecor,
      links: linksDecor,
      maxNodeDeg: maxNode,
      maxPairW: maxPW,
    };
  }, [data]);

  // настройка «сил»: charge, distance по связям и КАСТОМНАЯ радиальная центровка
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    // отталкивание
    const charge: any = fg.d3Force("charge");
    if (charge) charge.strength(-70).distanceMin(5).distanceMax(340);

    // расстояние по ссылкам: больше связей у пары — длиннее ребро
    const linkForce: any = fg.d3Force("link");
    if (linkForce) {
      const base = 36;
      const k = 180;
      linkForce.distance((l: GLink) => {
        const s = nodes.find((n) => n.id === getId(l.source));
        const t = nodes.find((n) => n.id === getId(l.target));
        const norm =
          ((s?.__deg ?? 0) + (t?.__deg ?? 0)) / Math.max(1, 2 * maxNodeDeg);
        return base + k * norm; // меньше связей → короче; больше → длиннее
      });
    }

    // КАСТОМНАЯ радиальная сила: чем меньше связей у узла, тем БЛИЖЕ к центру
    // force signature совместима с d3-force: (alpha)=>void + .initialize(nodes)
    const radial = (() => {
      let ns: any[] = [];
      const rMin = 40; // минимальный «желанный» радиус от центра
      const rMax = 260; // максимальный «желанный» радиус
      function force(alpha: number) {
        const k = alpha * 0.15; // плавность
        for (const n of ns) {
          const deg = n.__deg ?? 0;
          const norm = maxNodeDeg > 0 ? deg / maxNodeDeg : 0; // 0..1
          // меньше связей -> меньше norm -> ближе к центру
          const targetR = rMin + (rMax - rMin) * norm; // 0 связей ~ rMin, максимум ~ rMax

          const x = n.x || 0;
          const y = n.y || 0;
          let r = Math.sqrt(x * x + y * y);
          if (r < 1e-6) r = 1e-6;
          const diff = targetR - r; // положит. -> тянем наружу, отриц. -> тянем внутрь
          const ux = x / r;
          const uy = y / r;
          n.vx = (n.vx || 0) + ux * diff * k;
          n.vy = (n.vy || 0) + uy * diff * k;
        }
      }
      (force as any).initialize = (arr: any[]) => {
        ns = arr || [];
      };
      // важный cast через unknown, чтобы не ловить TS-конфликт сигнатур
      return force as unknown as (
        alpha: number,
      ) => void & { initialize(nodes: any[]): void };
    })();

    fg.d3Force("radial", radial);
  }, [nodes, maxNodeDeg]);

  // соседи выбранного узла
  const neighbors = useMemo(() => {
    if (selectedNodeId == null) return new Set<string | number>();
    const set = new Set<string | number>([selectedNodeId]);
    links.forEach((l) => {
      const s = getId(l.source);
      const t = getId(l.target);
      if (s === selectedNodeId) set.add(t);
      if (t === selectedNodeId) set.add(s);
    });
    return set;
  }, [links, selectedNodeId]);

  return (
    <div ref={wrapRef} className="w-full" style={{ height }}>
      <ForceGraph2D
        ref={fgRef as any}
        width={width}
        height={height}
        graphData={{ nodes, links }}
        backgroundColor="rgba(0,0,0,0)"
        enableNodeDrag
        onBackgroundClick={onBackgroundClick}
        onNodeClick={(n: unknown) => onNodeClick(getId(n))}
        onLinkClick={(l: unknown) =>
          onLinkClick(getId((l as any).source), getId((l as any).target))
        }
        linkColor={(l: any) => {
          const s = getId(l.source);
          const t = getId(l.target);
          const isSelectedLink =
            selectedLink &&
            ((s === selectedLink.a && t === selectedLink.b) ||
              (s === selectedLink.b && t === selectedLink.a));
          const touchesSelectedNode =
            selectedNodeId == null ||
            s === selectedNodeId ||
            t === selectedNodeId;
          const alpha = isSelectedLink
            ? 0.95
            : touchesSelectedNode
              ? 0.5
              : 0.12;
          return `rgba(167,139,250,${alpha})`;
        }}
        linkWidth={(l: any) =>
          0.6 + 0.8 * (Math.min(l.__w ?? 0, maxPairW) / (maxPairW || 1))
        }
        nodeRelSize={1}
        nodeCanvasObject={(
          n: any,
          ctx: CanvasRenderingContext2D,
          scale: number,
        ) => {
          const id = getId(n);
          const r = (n.__r as number) || 7;
          const dim =
            selectedNodeId == null ||
            id === selectedNodeId ||
            neighbors.has(id);

          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = dim
            ? "rgba(167,139,250,0.9)"
            : "rgba(167,139,250,0.2)";
          ctx.fill();
          ctx.lineWidth = dim ? 1 : 0.5;
          ctx.strokeStyle = dim
            ? "rgba(255,255,255,0.8)"
            : "rgba(255,255,255,0.2)";
          ctx.stroke();

          const label = n.name || String(id);
          const fontSize = 12 / Math.sqrt(scale);
          ctx.font = `${fontSize}px Inter, system-ui, -apple-system, Segoe UI, Roboto`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = dim
            ? "rgba(255,255,255,0.95)"
            : "rgba(255,255,255,0.25)";
          ctx.fillText(label, n.x, n.y + r + 2);
        }}
        nodePointerAreaPaint={(
          n: any,
          color: string,
          ctx: CanvasRenderingContext2D,
        ) => {
          const r = (n.__r as number) || 7;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 4, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        nodeLabel={(n: any) => n.name || String(getId(n))}
        linkLabel={(l: any) => {
          const s = nodes.find((x) => x.id === getId(l.source));
          const t = nodes.find((x) => x.id === getId(l.target));
          const pw = l.__w ?? linkW(l);
          return `${s?.name || getId(l.source)} ↔ ${t?.name || getId(l.target)} • Реплаев: ${pw}`;
        }}
      />
    </div>
  );
}
