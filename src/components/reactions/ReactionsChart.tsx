import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReactionsChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <div className="card">
      <div className="hdr mb-3">📈 Динамика реакций</div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#a855f7", stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
