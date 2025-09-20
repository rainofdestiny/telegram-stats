import React from "react";

export type HeatmapPoint = {
  weekday: number; // 0..6 (Пн..Вс)
  hour: number; // 0..23
  count: number; // кол-во
};

type HeatmapProps = {
  data: HeatmapPoint[];
};

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function colorFor(intensity: number): string {
  const l = 14 + intensity * 56; // яркость 14%..70%
  return `hsl(270deg 90% ${l}%)`;
}

function norm(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.log(count + 1) / Math.log(max + 1); // 0..1
}

export default function Heatmap({ data }: HeatmapProps) {
  // 7x24 матрица
  const matrix = Array.from({ length: 7 }, (_, w) =>
    Array.from({ length: 24 }, (_, h) => {
      const p = data.find((d) => d.weekday === w && d.hour === h);
      return p ? p.count : 0;
    }),
  );
  const max = Math.max(0, ...matrix.flat());

  // вместо grid-cols-24 используем inline grid-template-columns
  const colsStyle: React.CSSProperties = {
    gridTemplateColumns: "repeat(24, minmax(0, 1fr))",
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        {/* верхняя шкала часов */}
        <div className="pl-10 pr-2 mb-2">
          <div
            className="grid gap-1 text-[10px] text-gray-400/80"
            style={colsStyle}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center">
                {h}
              </div>
            ))}
          </div>
        </div>

        {/* строки по дням недели */}
        <div className="flex flex-col gap-1">
          {matrix.map((row, w) => (
            <div key={w} className="flex items-center gap-2">
              <div className="w-8 text-right pr-2 text-xs text-gray-400/90">
                {weekdays[w]}
              </div>
              <div className="grid gap-1 flex-1" style={colsStyle}>
                {row.map((count, h) => {
                  const k = `${w}-${h}`;
                  const t = norm(count, max);
                  const bg = count > 0 ? colorFor(t) : "hsl(270deg 20% 10%)";
                  return (
                    <div
                      key={k}
                      title={`${weekdays[w]} ${h}:00 — ${count}`}
                      className="h-5 rounded-md border border-white/5 transition-transform duration-150 will-change-transform"
                      style={{ background: bg }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "scale(1)";
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
