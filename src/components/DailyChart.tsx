import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function DailyChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <div className="card">
      <div className="hdr mb-3">📈 Сообщения по дням</div>
      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              interval="preserveStartEnd" // ← показываем только крайние и равномерные подписи
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={{ fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d0d16",
                borderColor: "#1f2937",
                color: "#f3f4f6",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: "#c026d3" }}
              style={{ filter: "drop-shadow(0 0 6px #a855f7)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
