import React from "react";

type HeatmapPoint = {
  weekday: number;
  hour: number;
  count: number;
};

type HeatmapProps = {
  data: HeatmapPoint[];
};

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function Heatmap({ data }: HeatmapProps) {
  // строим матрицу 7x24
  const matrix = Array.from({ length: 7 }, (_, w) =>
    Array.from({ length: 24 }, (_, h) => {
      const point = data.find((p) => p.weekday === w && p.hour === h);
      return point ? point.count : 0;
    }),
  );

  const max = Math.max(...matrix.flat());

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-1 text-xs text-gray-400"></th>
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="p-1 text-xs text-gray-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, w) => (
            <tr key={w}>
              <td className="p-1 text-xs text-gray-400">{weekdays[w]}</td>
              {row.map((count, h) => {
                const intensity = max > 0 ? count / max : 0;
                const color = `rgba(147, 51, 234, ${intensity})`; // фиолетовый с прозрачностью
                return (
                  <td
                    key={h}
                    className="w-6 h-6 border border-gray-800 relative group"
                    style={{ backgroundColor: color }}
                  >
                    {count > 0 && (
                      <span className="absolute opacity-0 group-hover:opacity-100 text-xs text-white bg-gray-900 px-1 py-0.5 rounded -top-6 left-1/2 transform -translate-x-1/2">
                        {count}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
