// src/components/social/ReplyGraph.tsx
import React, { useMemo, useState } from "react";
import type { Node as TNode, Link as TLink } from "../../types";
import GraphCanvas from "./GraphCanvas";
import GraphInfoPanel from "./GraphInfoPanel";
import ChartCard from "../charts/ChartCard";

type Props = { data: { nodes: TNode[]; links: TLink[] } };

export default function ReplyGraph({ data }: Props) {
  // нормализуем веса (weight/value) и считаем «степени» (сумма парных весов)
  const normData = useMemo(() => {
    const nodes: (TNode & { __deg?: number })[] = data.nodes.map((n) => ({
      ...n,
      __deg: 0,
    }));
    const id2idx = new Map<string, number>();
    nodes.forEach((n, i) => id2idx.set(n.id, i));

    // pair weight по неориентированной паре
    const pair = new Map<string, number>();
    const keyOf = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

    const links = data.links.map((l) => {
      const w = Number((l as any).weight ?? (l as any).value ?? 0) || 0;
      const src = String(l.source);
      const dst = String(l.target);
      const k = keyOf(src, dst);
      pair.set(k, (pair.get(k) ?? 0) + w);
      return { source: src, target: dst, weight: w };
    });

    // распределим pair по узлам
    for (const [k, pw] of pair) {
      const [a, b] = k.split("|");
      const ia = id2idx.get(a);
      const ib = id2idx.get(b);
      if (ia != null) nodes[ia].__deg = (nodes[ia].__deg ?? 0) + pw;
      if (ib != null) nodes[ib].__deg = (nodes[ib].__deg ?? 0) + pw;
    }

    return { nodes, links };
  }, [data]);

  // сортировка для селекта по популярности (по __deg, убыв.)
  const selectOptions = useMemo(() => {
    return [...normData.nodes]
      .map((n) => ({
        id: n.id,
        label: `${n.name || n.id} (${n.__deg ?? 0})`,
        deg: n.__deg ?? 0,
      }))
      .sort((a, b) => b.deg - a.deg);
  }, [normData.nodes]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | number | null>(
    null,
  );
  const [selectedLink, setSelectedLink] = useState<{
    a: string | number;
    b: string | number;
  } | null>(null);

  const reset = () => {
    setSelectedNodeId(null);
    setSelectedLink(null);
  };

  return (
    <>
      <ChartCard
        title="🤝 Социальные связи по реплаям"
        right={
          <div className="flex items-center gap-3">
            <select
              value={selectedNodeId ?? "---"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "---") reset();
                else {
                  setSelectedNodeId(v);
                  setSelectedLink(null);
                }
              }}
              className="bg-slate-800/70 border border-white/10 rounded-lg px-2 py-1 text-sm outline-none"
            >
              <option value="---">---</option>
              {selectOptions.map((o) => (
                <option key={o.id} value={String(o.id)}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={reset}
              className="px-3 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-white/10 text-sm"
            >
              Сброс
            </button>
          </div>
        }
      >
        <GraphCanvas
          data={normData}
          selectedNodeId={selectedNodeId ?? undefined}
          selectedLink={selectedLink ?? undefined}
          onNodeClick={(id) => {
            setSelectedNodeId(id);
            setSelectedLink(null);
          }}
          onLinkClick={(a, b) => {
            setSelectedNodeId(null);
            setSelectedLink({ a, b });
          }}
          onBackgroundClick={reset}
          height={560}
        />
      </ChartCard>

      <GraphInfoPanel
        data={normData}
        selectedNodeId={selectedNodeId}
        selectedLink={selectedLink}
      />
    </>
  );
}
