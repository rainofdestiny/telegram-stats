import React, { useMemo, useState } from "react";
import GraphCanvas from "./GraphCanvas";
import GraphInfoPanel from "./GraphInfoPanel";

// Берём форму ноды как в проекте
type Node = { id: string | number; name?: string; username?: string };

// Принимаем любой линк: с weight ИЛИ со старым value
type AnyLink = {
  source: string | number;
  target: string | number;
  weight?: number;
  value?: number;
};

type Props = {
  data: { nodes: Node[]; links: AnyLink[] };
};

export default function ReplyGraph({ data }: Props) {
  // Нормализуем ссылки к weight (если пришёл value — подставим его в weight)
  const normData = useMemo(() => {
    const links = data.links.map((l) => ({
      source: l.source,
      target: l.target,
      weight: l.weight ?? l.value ?? 0,
    }));
    return { nodes: data.nodes, links };
  }, [data]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | number | null>(
    null,
  );
  const [selectedLink, setSelectedLink] = useState<{
    a: string | number;
    b: string | number;
  } | null>(null);

  // Для сортировки пользователей в селекте — по популярности (числу связей)
  const { neighborsMap, degreeById, options } = useMemo(() => {
    const map = new Map<string | number, Set<string | number>>();
    for (const n of normData.nodes) map.set(n.id, new Set());
    for (const l of normData.links) {
      (map.get(l.source) as Set<string | number>).add(l.target);
      (map.get(l.target) as Set<string | number>).add(l.source);
    }
    const degree: Record<string, number> = {};
    map.forEach((set, id) => (degree[String(id)] = set.size));

    const label = (n: Node) =>
      (n.name && n.name.trim()) ||
      (n.username ? `@${n.username}` : String(n.id));

    const opts = [...normData.nodes]
      .sort((a, b) => {
        const da = degree[String(a.id)] ?? 0;
        const db = degree[String(b.id)] ?? 0;
        if (db !== da) return db - da; // больше связей — выше
        return label(a).localeCompare(label(b), "ru");
      })
      .map((n) => ({ id: n.id, label: label(n) }));

    return { neighborsMap: map, degreeById: degree, options: opts };
  }, [normData]);

  // Подсветка узла + его соседей
  const selectedNeighbors = useMemo(() => {
    if (selectedNodeId == null) return undefined;
    return new Set([
      selectedNodeId,
      ...(neighborsMap.get(selectedNodeId) ?? []),
    ]);
  }, [selectedNodeId, neighborsMap]);

  const clearSelection = () => {
    setSelectedNodeId(null);
    setSelectedLink(null);
  };

  return (
    <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="hdr">🤝 Социальные связи по реплаям</div>
        <div className="flex items-center gap-3">
          <select
            value={selectedNodeId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return clearSelection();
              setSelectedLink(null);
              setSelectedNodeId(v);
            }}
            className="px-2 py-1 bg-slate-700 rounded-md focus:ring-2 focus:ring-purple-500"
          >
            <option value="">---</option>
            {options.map((o) => (
              <option key={String(o.id)} value={String(o.id)}>
                {o.label} ({degreeById[String(o.id)] ?? 0})
              </option>
            ))}
          </select>

          <button
            onClick={clearSelection}
            className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500"
          >
            Сброс
          </button>
        </div>
      </div>

      <GraphCanvas
        data={normData}
        selectedNodeId={selectedNodeId ?? undefined}
        selectedLink={selectedLink ?? undefined}
        selectedNeighbors={selectedNeighbors}
        onNodeClick={(id) => {
          setSelectedLink(null);
          setSelectedNodeId(id);
        }}
        onLinkClick={(a, b) => {
          setSelectedNodeId(null);
          setSelectedLink({ a, b });
        }}
        onBackgroundClick={clearSelection}
      />

      <GraphInfoPanel
        data={normData}
        selectedNodeId={selectedNodeId ?? undefined}
        selectedLink={selectedLink ?? undefined}
      />
    </div>
  );
}
