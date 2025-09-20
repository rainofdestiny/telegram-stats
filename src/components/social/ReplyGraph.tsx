import React, { useMemo, useState } from "react";
import GraphCanvas from "./GraphCanvas";
import GraphInfoPanel from "./GraphInfoPanel";

type GNode = { id: string | number; name?: string; username?: string };
type GLink = {
  source: string | number | GNode;
  target: string | number | GNode;
  weight?: number;
  value?: number;
};
type GraphData = { nodes: GNode[]; links: GLink[] };

type Props = { data: GraphData };

const labelOf = (n: GNode) => n.name || (n as any).username || String(n.id);

export default function ReplyGraph({ data }: Props) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | number | null>(
    null,
  );
  const [selectedLink, setSelectedLink] = useState<{
    a: string | number;
    b: string | number;
  } | null>(null);
  const [dropdown, setDropdown] = useState<string>("---");

  const options = useMemo(
    () => data.nodes.map((n) => ({ id: String(n.id), label: labelOf(n) })),
    [data.nodes],
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:p-4">
      {/* Заголовок */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg md:text-xl font-semibold text-white">
          <span className="mr-2">🤝</span> Социальные связи по реплаям
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300 text-sm">Пользователь:</span>
          <select
            value={dropdown}
            onChange={(e) => {
              const v = e.target.value;
              setDropdown(v);
              if (v === "---") {
                setSelectedNodeId(null);
                setSelectedLink(null);
              } else {
                setSelectedNodeId(v);
                setSelectedLink(null);
              }
            }}
            className="rounded-xl bg-white/5 border border-white/10 text-slate-200 px-3 py-1.5 outline-none"
          >
            <option value="---">---</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-slate-200 hover:bg-white/10"
            onClick={() => {
              setDropdown("---");
              setSelectedNodeId(null);
              setSelectedLink(null);
            }}
          >
            Сброс
          </button>
        </div>
      </div>

      {/* Холст */}
      <GraphCanvas
        data={data}
        selectedNodeId={selectedNodeId}
        selectedLink={selectedLink}
        onBackgroundClick={() => {
          setDropdown("---");
          setSelectedNodeId(null);
          setSelectedLink(null);
        }}
        onNodeClick={(id) => {
          setSelectedLink(null);
          setSelectedNodeId(id);
          setDropdown(String(id));
        }}
        onLinkClick={(a, b) => {
          setSelectedNodeId(null);
          setDropdown("---");
          setSelectedLink({ a, b });
        }}
      />

      {/* Информпанель */}
      <GraphInfoPanel
        data={data}
        selectedNodeId={selectedNodeId}
        selectedLink={selectedLink}
      />
    </div>
  );
}
