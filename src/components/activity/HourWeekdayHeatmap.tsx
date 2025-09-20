import React, { useMemo } from "react";

const W = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function HourWeekdayHeatmap({
  data,
}: {
  data: { weekday: number; hour: number; count: number }[];
}) {
  const max = useMemo(
    () => data.reduce((m, x) => Math.max(m, x.count), 0) || 1,
    [data],
  );
  return (
    <div className="card">
      <div className="hdr mb-3">🕒 По дням недели и часам</div>
      <div className="overflow-x-auto">
        <div
          className="inline-grid"
          style={{
            gridTemplateColumns: `80px repeat(24, minmax(20px, 1fr))`,
            gap: "4px",
          }}
        >
          <div></div>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[10px] text-center text-gray-400">
              {h}
            </div>
          ))}
          {Array.from({ length: 7 }, (_, w) => (
            <React.Fragment key={w}>
              <div className="text-xs text-gray-400 h-6 flex items-center">
                {W[w]}
              </div>
              {Array.from({ length: 24 }, (_, h) => {
                const item = data.find((x) => x.weekday === w && x.hour === h);
                const c = item?.count || 0;
                const intensity = c === 0 ? 0 : 0.2 + 0.8 * (c / max);
                const bg = `rgba(168,85,247,${intensity.toFixed(3)})`;
                return (
                  <div
                    key={`${w}-${h}`}
                    title={`${W[w]} ${h}:00 • ${c}`}
                    style={{ backgroundColor: bg }}
                    className="h-6 rounded-sm"
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
